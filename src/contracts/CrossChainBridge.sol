// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IChainflipVault {
    function xSwapToken(
        uint32 dstChain,
        bytes calldata dstAddress,
        uint32 dstToken,
        bytes calldata cfParameters
    ) external payable;
    
    function xSwapNative(
        uint32 dstChain,
        bytes calldata dstAddress,
        uint32 dstToken,
        bytes calldata cfParameters
    ) external payable;
}

interface IPriceOracle {
    function getPrice(string memory pair) external view returns (uint256);
    function updatePrice(string memory pair, uint256 price) external;
}

contract CrossChainBridge is AccessControl, ReentrancyGuard {
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    
    IChainflipVault public immutable chainflipVault;
    IPriceOracle public priceOracle;
    
    // Chain IDs for Chainflip
    uint32 public constant ETHEREUM_CHAIN = 1;
    uint32 public constant BITCOIN_CHAIN = 0;
    
    // Token IDs for Chainflip
    uint32 public constant ETH_TOKEN = 1;
    uint32 public constant BTC_TOKEN = 0;
    uint32 public constant USDC_TOKEN = 2;
    uint32 public constant USDT_TOKEN = 3;
    
    struct CrossChainOrder {
        bytes32 orderId;
        address initiator;
        uint32 sourceChain;
        uint32 destinationChain;
        uint32 sourceToken;
        uint32 destinationToken;
        uint256 amount;
        uint256 minReturn;
        uint256 timestamp;
        OrderStatus status;
        bytes destinationAddress;
    }
    
    struct GridStrategy {
        bytes32 strategyId;
        address owner;
        string pair; // e.g., "ETH/BTC"
        uint256 basePrice;
        uint256 gridSpacing; // percentage
        uint256 orderSize;
        uint8 gridLevels;
        bool isActive;
        uint256[] buyOrders;
        uint256[] sellOrders;
    }
    
    struct StopLossOrder {
        bytes32 orderId;
        address owner;
        string pair;
        uint256 triggerPrice;
        uint256 amount;
        bool isTrailing;
        uint256 trailAmount; // for trailing stop loss
        uint256 highestPrice; // for trailing SL tracking
        bool isActive;
    }
    
    enum OrderStatus {
        Pending,
        Executed,
        Failed,
        Cancelled
    }
    
    mapping(bytes32 => CrossChainOrder) public crossChainOrders;
    mapping(bytes32 => GridStrategy) public gridStrategies;
    mapping(bytes32 => StopLossOrder) public stopLossOrders;
    mapping(address => bytes32[]) public userGridStrategies;
    mapping(address => bytes32[]) public userStopLossOrders;
    
    uint256 public totalGridStrategies;
    uint256 public totalStopLossOrders;
    
    event CrossChainSwapInitiated(
        bytes32 indexed orderId,
        address indexed initiator,
        uint32 sourceChain,
        uint32 destinationChain,
        uint256 amount
    );
    
    event GridStrategyCreated(
        bytes32 indexed strategyId,
        address indexed owner,
        string pair,
        uint256 basePrice,
        uint8 gridLevels
    );
    
    event StopLossCreated(
        bytes32 indexed orderId,
        address indexed owner,
        string pair,
        uint256 triggerPrice,
        bool isTrailing
    );
    
    event GridOrderTriggered(
        bytes32 indexed strategyId,
        uint256 price,
        bool isBuyOrder,
        uint256 amount
    );
    
    event StopLossTriggered(
        bytes32 indexed orderId,
        uint256 triggerPrice,
        uint256 currentPrice
    );
    
    constructor(
        address _chainflipVault,
        address _priceOracle
    ) {
        chainflipVault = IChainflipVault(_chainflipVault);
        priceOracle = IPriceOracle(_priceOracle);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(AGENT_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
    }
    
    // Cross-chain swap functions
    function swapETHToBTC(
        uint256 amount,
        bytes calldata btcAddress,
        uint256 minReturn
    ) external payable onlyRole(AGENT_ROLE) nonReentrant {
        require(msg.value >= amount, "Insufficient ETH");
        
        bytes32 orderId = keccak256(abi.encodePacked(
            msg.sender,
            block.timestamp,
            amount,
            BITCOIN_CHAIN
        ));
        
        crossChainOrders[orderId] = CrossChainOrder({
            orderId: orderId,
            initiator: msg.sender,
            sourceChain: ETHEREUM_CHAIN,
            destinationChain: BITCOIN_CHAIN,
            sourceToken: ETH_TOKEN,
            destinationToken: BTC_TOKEN,
            amount: amount,
            minReturn: minReturn,
            timestamp: block.timestamp,
            status: OrderStatus.Pending,
            destinationAddress: btcAddress
        });
        
        // Execute Chainflip swap
        chainflipVault.xSwapNative{value: amount}(
            BITCOIN_CHAIN,
            btcAddress,
            BTC_TOKEN,
            abi.encode(minReturn)
        );
        
        emit CrossChainSwapInitiated(
            orderId,
            msg.sender,
            ETHEREUM_CHAIN,
            BITCOIN_CHAIN,
            amount
        );
    }
    
    function swapBTCToETH(
        uint256 amount,
        address ethAddress,
        uint256 minReturn
    ) external onlyRole(AGENT_ROLE) nonReentrant {
        bytes32 orderId = keccak256(abi.encodePacked(
            msg.sender,
            block.timestamp,
            amount,
            ETHEREUM_CHAIN
        ));
        
        crossChainOrders[orderId] = CrossChainOrder({
            orderId: orderId,
            initiator: msg.sender,
            sourceChain: BITCOIN_CHAIN,
            destinationChain: ETHEREUM_CHAIN,
            sourceToken: BTC_TOKEN,
            destinationToken: ETH_TOKEN,
            amount: amount,
            minReturn: minReturn,
            timestamp: block.timestamp,
            status: OrderStatus.Pending,
            destinationAddress: abi.encodePacked(ethAddress)
        });
        
        // Note: BTC deposit would be handled off-chain via Chainflip's deposit channels
        
        emit CrossChainSwapInitiated(
            orderId,
            msg.sender,
            BITCOIN_CHAIN,
            ETHEREUM_CHAIN,
            amount
        );
    }
    
    // Grid Trading Implementation
    function createGridStrategy(
        string memory pair,
        uint256 basePrice,
        uint256 gridSpacing,
        uint256 orderSize,
        uint8 gridLevels
    ) external returns (bytes32) {
        require(gridLevels > 0 && gridLevels <= 20, "Invalid grid levels");
        require(gridSpacing > 0 && gridSpacing <= 1000, "Invalid grid spacing"); // max 10%
        
        bytes32 strategyId = keccak256(abi.encodePacked(
            msg.sender,
            pair,
            block.timestamp,
            totalGridStrategies++
        ));
        
        GridStrategy storage strategy = gridStrategies[strategyId];
        strategy.strategyId = strategyId;
        strategy.owner = msg.sender;
        strategy.pair = pair;
        strategy.basePrice = basePrice;
        strategy.gridSpacing = gridSpacing;
        strategy.orderSize = orderSize;
        strategy.gridLevels = gridLevels;
        strategy.isActive = true;
        
        userGridStrategies[msg.sender].push(strategyId);
        
        emit GridStrategyCreated(strategyId, msg.sender, pair, basePrice, gridLevels);
        
        return strategyId;
    }
    
    function executeGridOrders(bytes32 strategyId) external onlyRole(ORACLE_ROLE) {
        GridStrategy storage strategy = gridStrategies[strategyId];
        require(strategy.isActive, "Strategy not active");
        
        uint256 currentPrice = priceOracle.getPrice(strategy.pair);
        
        // Check buy orders (below current price)
        for (uint8 i = 1; i <= strategy.gridLevels; i++) {
            uint256 buyPrice = strategy.basePrice * (1000 - strategy.gridSpacing * i) / 1000;
            if (currentPrice <= buyPrice) {
                // Trigger buy order
                emit GridOrderTriggered(strategyId, buyPrice, true, strategy.orderSize);
                // Execute actual trade logic here
            }
        }
        
        // Check sell orders (above current price)
        for (uint8 i = 1; i <= strategy.gridLevels; i++) {
            uint256 sellPrice = strategy.basePrice * (1000 + strategy.gridSpacing * i) / 1000;
            if (currentPrice >= sellPrice) {
                // Trigger sell order
                emit GridOrderTriggered(strategyId, sellPrice, false, strategy.orderSize);
                // Execute actual trade logic here
            }
        }
    }
    
    // Stop Loss Implementation
    function createStopLoss(
        string memory pair,
        uint256 triggerPrice,
        uint256 amount,
        bool isTrailing,
        uint256 trailAmount
    ) external returns (bytes32) {
        bytes32 orderId = keccak256(abi.encodePacked(
            msg.sender,
            pair,
            triggerPrice,
            block.timestamp,
            totalStopLossOrders++
        ));
        
        uint256 currentPrice = priceOracle.getPrice(pair);
        
        stopLossOrders[orderId] = StopLossOrder({
            orderId: orderId,
            owner: msg.sender,
            pair: pair,
            triggerPrice: triggerPrice,
            amount: amount,
            isTrailing: isTrailing,
            trailAmount: trailAmount,
            highestPrice: currentPrice,
            isActive: true
        });
        
        userStopLossOrders[msg.sender].push(orderId);
        
        emit StopLossCreated(orderId, msg.sender, pair, triggerPrice, isTrailing);
        
        return orderId;
    }
    
    function checkStopLossOrders() external onlyRole(ORACLE_ROLE) {
        // This would typically be called by a price monitoring service
        // Check all active stop loss orders and trigger if conditions are met
        
        for (uint256 i = 0; i < totalStopLossOrders; i++) {
            // Implementation would iterate through active orders
            // and check trigger conditions
        }
    }
    
    function executeStopLoss(bytes32 orderId) external onlyRole(ORACLE_ROLE) {
        StopLossOrder storage order = stopLossOrders[orderId];
        require(order.isActive, "Order not active");
        
        uint256 currentPrice = priceOracle.getPrice(order.pair);
        
        if (order.isTrailing) {
            // Update trailing stop loss
            if (currentPrice > order.highestPrice) {
                order.highestPrice = currentPrice;
                order.triggerPrice = currentPrice - order.trailAmount;
            }
        }
        
        if (currentPrice <= order.triggerPrice) {
            order.isActive = false;
            
            emit StopLossTriggered(orderId, order.triggerPrice, currentPrice);
            
            // Execute actual sell order here
        }
    }
    
    // Admin functions
    function updatePriceOracle(address newOracle) external onlyRole(DEFAULT_ADMIN_ROLE) {
        priceOracle = IPriceOracle(newOracle);
    }
    
    function deactivateGridStrategy(bytes32 strategyId) external {
        GridStrategy storage strategy = gridStrategies[strategyId];
        require(strategy.owner == msg.sender || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Unauthorized");
        strategy.isActive = false;
    }
    
    function cancelStopLoss(bytes32 orderId) external {
        StopLossOrder storage order = stopLossOrders[orderId];
        require(order.owner == msg.sender || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Unauthorized");
        order.isActive = false;
    }
    
    // View functions
    function getGridStrategy(bytes32 strategyId) external view returns (GridStrategy memory) {
        return gridStrategies[strategyId];
    }
    
    function getStopLossOrder(bytes32 orderId) external view returns (StopLossOrder memory) {
        return stopLossOrders[orderId];
    }
    
    function getUserGridStrategies(address user) external view returns (bytes32[] memory) {
        return userGridStrategies[user];
    }
    
    function getUserStopLossOrders(address user) external view returns (bytes32[] memory) {
        return userStopLossOrders[user];
    }
}
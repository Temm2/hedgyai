// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface ILimitOrderProtocol {
    function fillOrder(
        address order,
        bytes calldata signature,
        uint256 makingAmount,
        uint256 takingAmount,
        uint256 skipPermitAndThresholdAmount
    ) external payable returns (uint256, uint256);
}

interface IFusionPlus {
    function createOrder(
        address srcToken,
        address dstToken,
        uint256 amount,
        uint256 minReturn,
        bytes calldata permit
    ) external returns (bytes32 orderId);
}

/**
 * @title InvestmentVault
 * @dev ERC4626 vault that integrates with 1inch protocols for automated trading
 */
contract InvestmentVault is ERC4626, Ownable, ReentrancyGuard {
    ILimitOrderProtocol public limitOrderProtocol;
    IFusionPlus public fusionPlus;
    
    mapping(address => bool) public authorizedAgents;
    mapping(bytes32 => bool) public activeOrders;
    
    uint256 public constant MIN_INVESTMENT = 10e6; // $10 USDC minimum
    uint256 public totalAllocated;
    uint256 public performanceFee = 200; // 2%
    uint256 public managementFee = 100; // 1%
    
    event InvestmentDeposited(address indexed user, uint256 amount, uint256 shares);
    event OrderExecuted(bytes32 indexed orderId, address token, uint256 amount);
    event AgentAuthorized(address indexed agent, bool authorized);
    
    constructor(
        IERC20 _asset,
        string memory _name,
        string memory _symbol,
        address _limitOrderProtocol,
        address _fusionPlus
    ) ERC4626(_asset) ERC20(_name, _symbol) {
        limitOrderProtocol = ILimitOrderProtocol(_limitOrderProtocol);
        fusionPlus = IFusionPlus(_fusionPlus);
    }
    
    /**
     * @dev Invest with minimum $10 requirement
     */
    function investWithMinimum(uint256 assets) external nonReentrant returns (uint256 shares) {
        require(assets >= MIN_INVESTMENT, "Investment below minimum");
        
        shares = deposit(assets, msg.sender);
        emit InvestmentDeposited(msg.sender, assets, shares);
    }
    
    /**
     * @dev Execute limit order through 1inch protocol
     */
    function executeLimitOrder(
        address order,
        bytes calldata signature,
        uint256 makingAmount,
        uint256 takingAmount
    ) external onlyAuthorizedAgent returns (uint256, uint256) {
        IERC20(asset()).approve(address(limitOrderProtocol), makingAmount);
        
        (uint256 actualMakingAmount, uint256 actualTakingAmount) = limitOrderProtocol.fillOrder(
            order,
            signature,
            makingAmount,
            takingAmount,
            0
        );
        
        bytes32 orderId = keccak256(abi.encodePacked(order, block.timestamp));
        activeOrders[orderId] = true;
        
        emit OrderExecuted(orderId, order, actualMakingAmount);
        return (actualMakingAmount, actualTakingAmount);
    }
    
    /**
     * @dev Execute cross-chain swap via Fusion+
     */
    function executeFusionSwap(
        address srcToken,
        address dstToken,
        uint256 amount,
        uint256 minReturn,
        bytes calldata permit
    ) external onlyAuthorizedAgent returns (bytes32) {
        IERC20(srcToken).approve(address(fusionPlus), amount);
        
        bytes32 orderId = fusionPlus.createOrder(
            srcToken,
            dstToken,
            amount,
            minReturn,
            permit
        );
        
        activeOrders[orderId] = true;
        emit OrderExecuted(orderId, srcToken, amount);
        
        return orderId;
    }
    
    /**
     * @dev Authorize/deauthorize trading agents
     */
    function setAgentAuthorization(address agent, bool authorized) external onlyOwner {
        authorizedAgents[agent] = authorized;
        emit AgentAuthorized(agent, authorized);
    }
    
    /**
     * @dev Calculate total assets including pending orders
     */
    function totalAssets() public view override returns (uint256) {
        return IERC20(asset()).balanceOf(address(this)) + totalAllocated;
    }
    
    /**
     * @dev Update performance and management fees
     */
    function updateFees(uint256 _performanceFee, uint256 _managementFee) external onlyOwner {
        require(_performanceFee <= 2000, "Performance fee too high"); // Max 20%
        require(_managementFee <= 500, "Management fee too high"); // Max 5%
        
        performanceFee = _performanceFee;
        managementFee = _managementFee;
    }
    
    modifier onlyAuthorizedAgent() {
        require(authorizedAgents[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
}
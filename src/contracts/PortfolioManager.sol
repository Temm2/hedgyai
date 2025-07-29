// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IAgentExecutor {
    function executeLimitOrderStrategy(
        address order,
        bytes calldata signature,
        uint256 makingAmount,
        uint256 takingAmount
    ) external returns (bytes32);
    
    function executeFusionStrategy(
        address srcToken,
        address dstToken,
        uint256 amount,
        uint256 minReturn,
        bytes calldata permit
    ) external returns (bytes32);
}

interface ISignalRegistry {
    function getSignalScore(bytes32 signalId) external view returns (uint256);
    function submitSignal(string memory signal, uint256 confidence) external returns (bytes32);
}

/**
 * @title PortfolioManager
 * @dev Meta-agent that manages capital allocation and strategy execution
 */
contract PortfolioManager is Ownable, ReentrancyGuard {
    struct Strategy {
        address agent;
        uint256 allocation; // Percentage allocation (basis points)
        uint256 riskLevel; // 1-10 scale
        bool active;
        uint256 lastRebalance;
    }
    
    struct RiskParameters {
        uint256 maxSinglePosition; // Max % in single position
        uint256 maxDrawdown; // Max acceptable drawdown
        uint256 rebalanceThreshold; // Threshold for rebalancing
        uint256 volatilityLimit; // Max portfolio volatility
    }
    
    mapping(bytes32 => Strategy) public strategies;
    mapping(address => uint256) public tokenAllocations;
    
    IAgentExecutor public agentExecutor;
    ISignalRegistry public signalRegistry;
    
    RiskParameters public riskParams;
    
    bytes32[] public activeStrategies;
    uint256 public totalPortfolioValue;
    uint256 public constant BASIS_POINTS = 10000;
    
    event StrategyAdded(bytes32 indexed strategyId, address agent, uint256 allocation);
    event CapitalRebalanced(bytes32 indexed strategyId, uint256 newAllocation);
    event RiskParametersUpdated(uint256 maxPosition, uint256 maxDrawdown);
    
    constructor(address _agentExecutor, address _signalRegistry) {
        agentExecutor = IAgentExecutor(_agentExecutor);
        signalRegistry = ISignalRegistry(_signalRegistry);
        
        // Default risk parameters
        riskParams = RiskParameters({
            maxSinglePosition: 2000, // 20%
            maxDrawdown: 1000, // 10%
            rebalanceThreshold: 500, // 5%
            volatilityLimit: 2500 // 25%
        });
    }
    
    /**
     * @dev Add new strategy to portfolio
     */
    function addStrategy(
        bytes32 strategyId,
        address agent,
        uint256 allocation,
        uint256 riskLevel
    ) external onlyOwner {
        require(allocation <= riskParams.maxSinglePosition, "Allocation too high");
        require(riskLevel >= 1 && riskLevel <= 10, "Invalid risk level");
        
        strategies[strategyId] = Strategy({
            agent: agent,
            allocation: allocation,
            riskLevel: riskLevel,
            active: true,
            lastRebalance: block.timestamp
        });
        
        activeStrategies.push(strategyId);
        emit StrategyAdded(strategyId, agent, allocation);
    }
    
    /**
     * @dev Execute strategy with dynamic allocation based on signals
     */
    function executeStrategy(
        bytes32 strategyId,
        bytes32 signalId,
        address srcToken,
        address dstToken,
        uint256 baseAmount,
        bytes calldata executionData
    ) external nonReentrant returns (bytes32) {
        Strategy memory strategy = strategies[strategyId];
        require(strategy.active, "Strategy not active");
        
        // Get signal confidence score
        uint256 signalScore = signalRegistry.getSignalScore(signalId);
        
        // Adjust allocation based on signal confidence and risk level
        uint256 adjustedAmount = calculateDynamicAllocation(
            baseAmount,
            strategy.allocation,
            signalScore,
            strategy.riskLevel
        );
        
        // Execute via Fusion+ for cross-chain or limit orders for single chain
        bytes32 orderId;
        if (srcToken != dstToken) {
            // Cross-chain execution via Fusion+
            orderId = agentExecutor.executeFusionStrategy(
                srcToken,
                dstToken,
                adjustedAmount,
                calculateMinReturn(adjustedAmount, strategy.riskLevel),
                executionData
            );
        } else {
            // Single chain limit order execution
            (address order, bytes memory signature, uint256 makingAmount, uint256 takingAmount) = 
                abi.decode(executionData, (address, bytes, uint256, uint256));
            
            orderId = agentExecutor.executeLimitOrderStrategy(
                order,
                signature,
                makingAmount,
                takingAmount
            );
        }
        
        strategies[strategyId].lastRebalance = block.timestamp;
        return orderId;
    }
    
    /**
     * @dev Calculate dynamic allocation based on signal confidence
     */
    function calculateDynamicAllocation(
        uint256 baseAmount,
        uint256 strategyAllocation,
        uint256 signalScore,
        uint256 riskLevel
    ) internal pure returns (uint256) {
        // Signal score: 0-1000 (0-100%)
        // Higher signal confidence = higher allocation
        // Lower risk level = more conservative allocation
        
        uint256 signalMultiplier = (signalScore * 150) / 100; // 0-150% based on signal
        uint256 riskAdjustment = (11 - riskLevel) * 10; // 10-100% based on risk level
        
        uint256 adjustedAllocation = (strategyAllocation * signalMultiplier * riskAdjustment) / (BASIS_POINTS * 100);
        
        return (baseAmount * adjustedAllocation) / BASIS_POINTS;
    }
    
    /**
     * @dev Calculate minimum return based on risk level
     */
    function calculateMinReturn(uint256 amount, uint256 riskLevel) internal pure returns (uint256) {
        // Higher risk level allows for higher slippage
        uint256 slippageTolerance = riskLevel * 50; // 0.5% per risk level
        return (amount * (BASIS_POINTS - slippageTolerance)) / BASIS_POINTS;
    }
    
    /**
     * @dev Rebalance portfolio based on performance and signals
     */
    function rebalancePortfolio() external onlyOwner {
        uint256 totalAllocation = 0;
        
        for (uint256 i = 0; i < activeStrategies.length; i++) {
            bytes32 strategyId = activeStrategies[i];
            Strategy storage strategy = strategies[strategyId];
            
            if (strategy.active) {
                // Calculate new allocation based on performance and signals
                uint256 newAllocation = calculateRebalanceAllocation(strategyId);
                strategy.allocation = newAllocation;
                strategy.lastRebalance = block.timestamp;
                
                totalAllocation += newAllocation;
                emit CapitalRebalanced(strategyId, newAllocation);
            }
        }
        
        require(totalAllocation <= BASIS_POINTS, "Total allocation exceeds 100%");
    }
    
    /**
     * @dev Calculate new allocation for rebalancing
     */
    function calculateRebalanceAllocation(bytes32 strategyId) internal view returns (uint256) {
        Strategy memory strategy = strategies[strategyId];
        
        // This would typically include:
        // - Historical performance analysis
        // - Recent signal accuracy
        // - Risk-adjusted returns
        // - Market conditions
        
        // Simplified implementation for hackathon
        uint256 baseAllocation = strategy.allocation;
        uint256 riskAdjustment = (11 - strategy.riskLevel) * 100; // Conservative adjustment
        
        return (baseAllocation * riskAdjustment) / 1000;
    }
    
    /**
     * @dev Update risk parameters
     */
    function updateRiskParameters(
        uint256 maxPosition,
        uint256 maxDrawdown,
        uint256 rebalanceThreshold,
        uint256 volatilityLimit
    ) external onlyOwner {
        riskParams = RiskParameters({
            maxSinglePosition: maxPosition,
            maxDrawdown: maxDrawdown,
            rebalanceThreshold: rebalanceThreshold,
            volatilityLimit: volatilityLimit
        });
        
        emit RiskParametersUpdated(maxPosition, maxDrawdown);
    }
    
    /**
     * @dev Emergency stop for all strategies
     */
    function emergencyStop() external onlyOwner {
        for (uint256 i = 0; i < activeStrategies.length; i++) {
            strategies[activeStrategies[i]].active = false;
        }
    }
    
    /**
     * @dev Get strategy details
     */
    function getStrategy(bytes32 strategyId) external view returns (Strategy memory) {
        return strategies[strategyId];
    }
    
    /**
     * @dev Get all active strategies
     */
    function getActiveStrategies() external view returns (bytes32[] memory) {
        return activeStrategies;
    }
}
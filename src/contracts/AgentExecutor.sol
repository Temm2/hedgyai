// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IInvestmentVault {
    function executeLimitOrder(
        address order,
        bytes calldata signature,
        uint256 makingAmount,
        uint256 takingAmount
    ) external returns (uint256, uint256);
    
    function executeFusionSwap(
        address srcToken,
        address dstToken,
        uint256 amount,
        uint256 minReturn,
        bytes calldata permit
    ) external returns (bytes32);
}

/**
 * @title AgentExecutor
 * @dev Handles AI agent strategy execution with 1inch integration
 */
contract AgentExecutor is AccessControl, ReentrancyGuard {
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");
    bytes32 public constant PORTFOLIO_MANAGER_ROLE = keccak256("PORTFOLIO_MANAGER_ROLE");
    
    struct AgentStrategy {
        string name;
        address executor;
        uint256 allocatedCapital;
        uint256 performanceScore;
        bool active;
        uint256 lastExecutionTime;
    }
    
    struct ExecutionLog {
        bytes32 orderId;
        address srcToken;
        address dstToken;
        uint256 amount;
        uint256 timestamp;
        bool successful;
    }
    
    mapping(address => AgentStrategy) public agents;
    mapping(bytes32 => ExecutionLog) public executionHistory;
    
    IInvestmentVault public vault;
    
    uint256 public totalManagedCapital;
    uint256 public constant MAX_SLIPPAGE = 500; // 5%
    
    event StrategyExecuted(
        address indexed agent,
        bytes32 indexed orderId,
        address srcToken,
        address dstToken,
        uint256 amount
    );
    
    event AgentRegistered(address indexed agent, string strategy);
    event CapitalAllocated(address indexed agent, uint256 amount);
    
    constructor(address _vault) {
        vault = IInvestmentVault(_vault);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PORTFOLIO_MANAGER_ROLE, msg.sender);
    }
    
    /**
     * @dev Register a new AI agent strategy
     */
    function registerAgent(
        address agentAddress,
        string memory strategyName,
        uint256 initialCapital
    ) external onlyRole(PORTFOLIO_MANAGER_ROLE) {
        agents[agentAddress] = AgentStrategy({
            name: strategyName,
            executor: agentAddress,
            allocatedCapital: initialCapital,
            performanceScore: 100, // Start with neutral score
            active: true,
            lastExecutionTime: block.timestamp
        });
        
        _grantRole(AGENT_ROLE, agentAddress);
        totalManagedCapital += initialCapital;
        
        emit AgentRegistered(agentAddress, strategyName);
        emit CapitalAllocated(agentAddress, initialCapital);
    }
    
    /**
     * @dev Execute limit order strategy via 1inch
     */
    function executeLimitOrderStrategy(
        address order,
        bytes calldata signature,
        uint256 makingAmount,
        uint256 takingAmount
    ) external onlyRole(AGENT_ROLE) nonReentrant returns (bytes32) {
        AgentStrategy storage agent = agents[msg.sender];
        require(agent.active, "Agent not active");
        require(makingAmount <= agent.allocatedCapital, "Insufficient capital");
        
        (uint256 actualMaking, uint256 actualTaking) = vault.executeLimitOrder(
            order,
            signature,
            makingAmount,
            takingAmount
        );
        
        bytes32 orderId = keccak256(abi.encodePacked(order, block.timestamp, msg.sender));
        
        executionHistory[orderId] = ExecutionLog({
            orderId: orderId,
            srcToken: address(0), // Will be filled by limit order
            dstToken: address(0),
            amount: actualMaking,
            timestamp: block.timestamp,
            successful: true
        });
        
        agent.lastExecutionTime = block.timestamp;
        
        emit StrategyExecuted(msg.sender, orderId, address(0), address(0), actualMaking);
        return orderId;
    }
    
    /**
     * @dev Execute cross-chain strategy via Fusion+
     */
    function executeFusionStrategy(
        address srcToken,
        address dstToken,
        uint256 amount,
        uint256 minReturn,
        bytes calldata permit
    ) external onlyRole(AGENT_ROLE) nonReentrant returns (bytes32) {
        AgentStrategy storage agent = agents[msg.sender];
        require(agent.active, "Agent not active");
        require(amount <= agent.allocatedCapital, "Insufficient capital");
        
        bytes32 orderId = vault.executeFusionSwap(
            srcToken,
            dstToken,
            amount,
            minReturn,
            permit
        );
        
        executionHistory[orderId] = ExecutionLog({
            orderId: orderId,
            srcToken: srcToken,
            dstToken: dstToken,
            amount: amount,
            timestamp: block.timestamp,
            successful: true
        });
        
        agent.lastExecutionTime = block.timestamp;
        
        emit StrategyExecuted(msg.sender, orderId, srcToken, dstToken, amount);
        return orderId;
    }
    
    /**
     * @dev Update agent performance score based on execution results
     */
    function updatePerformanceScore(
        address agentAddress,
        uint256 newScore
    ) external onlyRole(PORTFOLIO_MANAGER_ROLE) {
        require(newScore <= 1000, "Score too high"); // Max 10x
        agents[agentAddress].performanceScore = newScore;
    }
    
    /**
     * @dev Reallocate capital between agents
     */
    function reallocateCapital(
        address fromAgent,
        address toAgent,
        uint256 amount
    ) external onlyRole(PORTFOLIO_MANAGER_ROLE) {
        require(agents[fromAgent].allocatedCapital >= amount, "Insufficient capital");
        
        agents[fromAgent].allocatedCapital -= amount;
        agents[toAgent].allocatedCapital += amount;
        
        emit CapitalAllocated(toAgent, amount);
    }
    
    /**
     * @dev Deactivate underperforming agent
     */
    function deactivateAgent(address agentAddress) external onlyRole(PORTFOLIO_MANAGER_ROLE) {
        agents[agentAddress].active = false;
        _revokeRole(AGENT_ROLE, agentAddress);
    }
    
    /**
     * @dev Get agent strategy details
     */
    function getAgentStrategy(address agentAddress) external view returns (AgentStrategy memory) {
        return agents[agentAddress];
    }
    
    /**
     * @dev Get execution history
     */
    function getExecutionLog(bytes32 orderId) external view returns (ExecutionLog memory) {
        return executionHistory[orderId];
    }
}
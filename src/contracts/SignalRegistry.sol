// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title SignalRegistry
 * @dev Registry for alpha signals with scoring and rewards system
 */
contract SignalRegistry is Ownable, ReentrancyGuard {
    struct Signal {
        bytes32 id;
        address submitter;
        string data; // Encrypted or hashed signal data
        uint256 confidence; // 0-1000 (0-100%)
        uint256 timestamp;
        uint256 performanceScore; // Updated based on results
        bool verified;
        uint256 rewardsClaimed;
    }
    
    struct Contributor {
        address wallet;
        uint256 totalSignals;
        uint256 successfulSignals;
        uint256 totalRewards;
        uint256 reputation; // 0-1000 scale
        bool banned;
    }
    
    mapping(bytes32 => Signal) public signals;
    mapping(address => Contributor) public contributors;
    mapping(bytes32 => mapping(address => bool)) public signalVotes;
    
    IERC20 public rewardToken;
    
    bytes32[] public activeSignals;
    uint256 public totalRewardsPool;
    uint256 public minimumStake = 100e18; // 100 tokens to submit signals
    
    uint256 public constant MAX_CONFIDENCE = 1000;
    uint256 public constant VERIFICATION_THRESHOLD = 3; // Votes needed for verification
    
    event SignalSubmitted(
        bytes32 indexed signalId,
        address indexed submitter,
        uint256 confidence,
        uint256 timestamp
    );
    
    event SignalVerified(bytes32 indexed signalId, uint256 finalScore);
    event RewardDistributed(address indexed contributor, uint256 amount);
    event ContributorBanned(address indexed contributor, string reason);
    
    constructor(address _rewardToken) {
        rewardToken = IERC20(_rewardToken);
    }
    
    /**
     * @dev Submit a new alpha signal
     */
    function submitSignal(
        string memory signalData,
        uint256 confidence
    ) external nonReentrant returns (bytes32) {
        require(confidence <= MAX_CONFIDENCE, "Invalid confidence level");
        require(!contributors[msg.sender].banned, "Contributor banned");
        require(
            rewardToken.balanceOf(msg.sender) >= minimumStake,
            "Insufficient stake"
        );
        
        bytes32 signalId = keccak256(abi.encodePacked(
            signalData,
            msg.sender,
            block.timestamp,
            block.difficulty
        ));
        
        signals[signalId] = Signal({
            id: signalId,
            submitter: msg.sender,
            data: signalData,
            confidence: confidence,
            timestamp: block.timestamp,
            performanceScore: 0,
            verified: false,
            rewardsClaimed: 0
        });
        
        activeSignals.push(signalId);
        contributors[msg.sender].totalSignals++;
        
        emit SignalSubmitted(signalId, msg.sender, confidence, block.timestamp);
        return signalId;
    }
    
    /**
     * @dev Vote on signal quality (for verification)
     */
    function voteOnSignal(bytes32 signalId, bool approve) external {
        require(signals[signalId].submitter != address(0), "Signal not found");
        require(signals[signalId].submitter != msg.sender, "Cannot vote on own signal");
        require(!signalVotes[signalId][msg.sender], "Already voted");
        require(!contributors[msg.sender].banned, "Voter banned");
        
        signalVotes[signalId][msg.sender] = true;
        
        // Check if signal reaches verification threshold
        uint256 approvalCount = getSignalApprovals(signalId);
        if (approvalCount >= VERIFICATION_THRESHOLD && !signals[signalId].verified) {
            signals[signalId].verified = true;
            emit SignalVerified(signalId, signals[signalId].confidence);
        }
    }
    
    /**
     * @dev Update signal performance based on actual results
     */
    function updateSignalPerformance(
        bytes32 signalId,
        uint256 actualReturn,
        uint256 expectedReturn
    ) external onlyOwner {
        Signal storage signal = signals[signalId];
        require(signal.submitter != address(0), "Signal not found");
        
        // Calculate performance score based on accuracy
        uint256 accuracy;
        if (expectedReturn > 0) {
            accuracy = (actualReturn * 1000) / expectedReturn;
            if (accuracy > 1000) accuracy = 1000; // Cap at 100%
        }
        
        signal.performanceScore = (signal.confidence * accuracy) / 1000;
        
        // Update contributor reputation
        Contributor storage contributor = contributors[signal.submitter];
        if (accuracy >= 800) { // 80% accuracy threshold
            contributor.successfulSignals++;
        }
        
        // Update reputation score
        contributor.reputation = calculateReputation(signal.submitter);
        
        // Distribute rewards for successful signals
        if (signal.performanceScore >= 600 && signal.rewardsClaimed == 0) {
            uint256 reward = calculateReward(signalId);
            if (reward > 0 && totalRewardsPool >= reward) {
                rewardToken.transfer(signal.submitter, reward);
                signal.rewardsClaimed = reward;
                contributor.totalRewards += reward;
                totalRewardsPool -= reward;
                
                emit RewardDistributed(signal.submitter, reward);
            }
        }
    }
    
    /**
     * @dev Calculate reward for successful signal
     */
    function calculateReward(bytes32 signalId) internal view returns (uint256) {
        Signal memory signal = signals[signalId];
        Contributor memory contributor = contributors[signal.submitter];
        
        // Base reward calculation
        uint256 baseReward = (signal.performanceScore * 1000e18) / 1000; // 1000 tokens max
        
        // Reputation multiplier (1.0x to 2.0x)
        uint256 reputationMultiplier = 1000 + (contributor.reputation * 1000) / 1000;
        
        // Confidence multiplier
        uint256 confidenceMultiplier = (signal.confidence * 500) / 1000 + 500; // 0.5x to 1.0x
        
        return (baseReward * reputationMultiplier * confidenceMultiplier) / (1000 * 1000);
    }
    
    /**
     * @dev Calculate contributor reputation
     */
    function calculateReputation(address contributor) internal view returns (uint256) {
        Contributor memory contrib = contributors[contributor];
        
        if (contrib.totalSignals == 0) return 0;
        
        // Success rate (0-500 points)
        uint256 successRate = (contrib.successfulSignals * 500) / contrib.totalSignals;
        
        // Volume bonus (0-300 points)
        uint256 volumeBonus = contrib.totalSignals >= 100 ? 300 : (contrib.totalSignals * 3);
        
        // Rewards earned bonus (0-200 points)
        uint256 rewardsBonus = contrib.totalRewards >= 10000e18 ? 200 : (contrib.totalRewards / 50e18);
        
        return successRate + volumeBonus + rewardsBonus;
    }
    
    /**
     * @dev Get signal approval count
     */
    function getSignalApprovals(bytes32 signalId) internal view returns (uint256) {
        // This would typically track votes in a mapping
        // Simplified for hackathon
        return 3; // Assume signals get verified
    }
    
    /**
     * @dev Ban malicious contributor
     */
    function banContributor(address contributor, string memory reason) external onlyOwner {
        contributors[contributor].banned = true;
        emit ContributorBanned(contributor, reason);
    }
    
    /**
     * @dev Add rewards to the pool
     */
    function addRewardsToPool(uint256 amount) external onlyOwner {
        rewardToken.transferFrom(msg.sender, address(this), amount);
        totalRewardsPool += amount;
    }
    
    /**
     * @dev Get signal details
     */
    function getSignal(bytes32 signalId) external view returns (Signal memory) {
        return signals[signalId];
    }
    
    /**
     * @dev Get signal score for portfolio manager
     */
    function getSignalScore(bytes32 signalId) external view returns (uint256) {
        Signal memory signal = signals[signalId];
        if (!signal.verified) return 0;
        
        // Combine confidence and performance
        if (signal.performanceScore > 0) {
            return signal.performanceScore;
        }
        return signal.confidence;
    }
    
    /**
     * @dev Get contributor stats
     */
    function getContributor(address contributor) external view returns (Contributor memory) {
        return contributors[contributor];
    }
    
    /**
     * @dev Get all active signals
     */
    function getActiveSignals() external view returns (bytes32[] memory) {
        return activeSignals;
    }
}
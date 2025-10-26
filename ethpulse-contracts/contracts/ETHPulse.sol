// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IETHPulse.sol";

/**
 * @title ETHPulse
 * @notice Decentralized incentivized polls and surveys platform
 * @dev Supports multiple reward distribution models with flexible access control
 */
contract ETHPulse is IETHPulse, ReentrancyGuard, Ownable {
    // State variables
    uint256 public pollCounter;
    uint256 public platformFeePercent = 2; // 2% platform fee
    uint256 public constant MAX_RATING = 10;
    uint256 public constant BASIS_POINTS = 100;

    mapping(uint256 => Poll) public polls;
    mapping(uint256 => mapping(address => Response)) public responses;
    mapping(uint256 => address[]) public pollRespondents;
    mapping(uint256 => mapping(address => bool)) public whitelist;
    mapping(uint256 => mapping(address => bool)) public hasRespondedMap;

    modifier onlyPollCreator(uint256 pollId) {
        require(polls[pollId].creator == msg.sender, "Not poll creator");
        _;
    }

    modifier pollExists(uint256 pollId) {
        require(pollId < pollCounter, "Poll does not exist");
        _;
    }

    modifier pollActive(uint256 pollId) {
        require(polls[pollId].status == PollStatus.Active, "Poll not active");
        require(block.timestamp <= polls[pollId].deadline, "Poll expired");
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Create a new poll
     * @param deadline Unix timestamp for poll expiration
     * @param minResponses Minimum responses needed for valid poll
     * @param maxResponses Maximum responses allowed (0 for unlimited)
     * @param fixedRewardAmount Fixed reward per response (for FixedPerResponse type)
     * @param rewardType Type of reward distribution mechanism
     * @param requiresWhitelist Whether poll requires whitelist
     * @param dataHash IPFS hash or similar for poll data
     * @return pollId The ID of the created poll
     */
    function createPoll(
        uint256 deadline,
        uint256 minResponses,
        uint256 maxResponses,
        uint256 fixedRewardAmount,
        RewardType rewardType,
        bool requiresWhitelist,
        bytes32 dataHash
    ) external payable override nonReentrant returns (uint256 pollId) {
        require(deadline > block.timestamp, "Invalid deadline");
        require(msg.value > 0, "Must provide reward pool");
        require(minResponses > 0, "Min responses must be > 0");

        if (rewardType == RewardType.FixedPerResponse) {
            require(fixedRewardAmount > 0, "Fixed reward must be > 0");
            if (maxResponses > 0) {
                require(
                    msg.value >= fixedRewardAmount * maxResponses,
                    "Insufficient reward pool"
                );
            }
        }

        pollId = pollCounter++;

        polls[pollId] = Poll({
            creator: msg.sender,
            rewardPool: msg.value,
            deadline: deadline,
            minResponses: minResponses,
            maxResponses: maxResponses,
            fixedRewardAmount: fixedRewardAmount,
            rewardType: rewardType,
            status: PollStatus.Active,
            responseCount: 0,
            requiresWhitelist: requiresWhitelist,
            dataHash: dataHash
        });

        emit PollCreated(pollId, msg.sender, rewardType, msg.value, deadline);

        return pollId;
    }

    /**
     * @notice Submit a response to a poll
     * @param pollId The poll ID
     * @param dataHash IPFS hash of response data
     */
    function submitResponse(
        uint256 pollId,
        bytes32 dataHash
    ) external payable override nonReentrant pollExists(pollId) pollActive(pollId) {
        Poll storage poll = polls[pollId];

        require(!hasRespondedMap[pollId][msg.sender], "Already responded");
        require(dataHash != bytes32(0), "Invalid data hash");

        if (poll.requiresWhitelist) {
            require(whitelist[pollId][msg.sender], "Not whitelisted");
        }

        if (poll.maxResponses > 0) {
            require(poll.responseCount < poll.maxResponses, "Max responses reached");
        }

        // Store response
        responses[pollId][msg.sender] = Response({
            respondent: msg.sender,
            timestamp: block.timestamp,
            dataHash: dataHash,
            qualityRating: 0
        });

        hasRespondedMap[pollId][msg.sender] = true;
        pollRespondents[pollId].push(msg.sender);
        poll.responseCount++;

        emit ResponseSubmitted(pollId, msg.sender, dataHash);

        // Auto-close if max responses reached
        if (poll.maxResponses > 0 && poll.responseCount >= poll.maxResponses) {
            _closePoll(pollId);
        }
    }

    /**
     * @notice Close a poll and distribute rewards
     * @param pollId The poll ID
     */
    function closePoll(uint256 pollId)
        external
        override
        nonReentrant
        pollExists(pollId)
        onlyPollCreator(pollId)
    {
        _closePoll(pollId);
    }

    function _closePoll(uint256 pollId) internal {
        Poll storage poll = polls[pollId];

        require(poll.status == PollStatus.Active, "Poll not active");
        require(
            block.timestamp > poll.deadline ||
            (poll.maxResponses > 0 && poll.responseCount >= poll.maxResponses),
            "Cannot close yet"
        );
        require(poll.responseCount >= poll.minResponses, "Min responses not met");

        poll.status = PollStatus.Closed;

        // Distribute rewards based on type
        if (poll.rewardType == RewardType.EqualSplit) {
            _distributeEqualSplit(pollId);
        } else if (poll.rewardType == RewardType.FixedPerResponse) {
            _distributeFixedReward(pollId);
        } else if (poll.rewardType == RewardType.WeightedQuality) {
            _distributeWeightedReward(pollId);
        } else if (poll.rewardType == RewardType.RandomLottery) {
            _distributeRandomLottery(pollId);
        }

        emit PollClosed(pollId, poll.responseCount);
    }

    /**
     * @notice Cancel a poll and refund creator (only if no responses)
     * @param pollId The poll ID
     */
    function cancelPoll(uint256 pollId)
        external
        override
        nonReentrant
        pollExists(pollId)
        onlyPollCreator(pollId)
    {
        Poll storage poll = polls[pollId];

        require(poll.status == PollStatus.Active, "Poll not active");
        require(poll.responseCount == 0, "Cannot cancel with responses");

        poll.status = PollStatus.Cancelled;
        uint256 refundAmount = poll.rewardPool;
        poll.rewardPool = 0;

        (bool success, ) = poll.creator.call{value: refundAmount}("");
        require(success, "Refund failed");

        emit PollCancelled(pollId, refundAmount);
    }

    /**
     * @notice Rate a response (for WeightedQuality polls)
     * @param pollId The poll ID
     * @param respondent The respondent address
     * @param rating Quality rating 1-10
     */
    function rateResponse(
        uint256 pollId,
        address respondent,
        uint256 rating
    ) external override pollExists(pollId) onlyPollCreator(pollId) {
        require(rating > 0 && rating <= MAX_RATING, "Invalid rating");
        require(hasRespondedMap[pollId][respondent], "No response found");
        require(polls[pollId].rewardType == RewardType.WeightedQuality, "Wrong poll type");
        require(polls[pollId].status == PollStatus.Active, "Poll not active");

        responses[pollId][respondent].qualityRating = rating;

        emit ResponseRated(pollId, respondent, rating);
    }

    /**
     * @notice Add addresses to poll whitelist
     */
    function addToWhitelist(uint256 pollId, address[] calldata addresses)
        external
        override
        pollExists(pollId)
        onlyPollCreator(pollId)
    {
        for (uint256 i = 0; i < addresses.length; i++) {
            whitelist[pollId][addresses[i]] = true;
        }
    }

    /**
     * @notice Remove addresses from poll whitelist
     */
    function removeFromWhitelist(uint256 pollId, address[] calldata addresses)
        external
        override
        pollExists(pollId)
        onlyPollCreator(pollId)
    {
        for (uint256 i = 0; i < addresses.length; i++) {
            whitelist[pollId][addresses[i]] = false;
        }
    }

    // Internal reward distribution functions

    function _distributeEqualSplit(uint256 pollId) internal {
        Poll storage poll = polls[pollId];
        uint256 platformFee = (poll.rewardPool * platformFeePercent) / BASIS_POINTS;
        uint256 distributionPool = poll.rewardPool - platformFee;
        uint256 rewardPerResponse = distributionPool / poll.responseCount;

        address[] memory respondents = pollRespondents[pollId];
        for (uint256 i = 0; i < respondents.length; i++) {
            _sendReward(pollId, respondents[i], rewardPerResponse);
        }

        _collectPlatformFee(platformFee);
    }

    function _distributeFixedReward(uint256 pollId) internal {
        Poll storage poll = polls[pollId];
        uint256 rewardPerResponse = poll.fixedRewardAmount;
        uint256 totalDistributed = 0;

        address[] memory respondents = pollRespondents[pollId];
        for (uint256 i = 0; i < respondents.length; i++) {
            _sendReward(pollId, respondents[i], rewardPerResponse);
            totalDistributed += rewardPerResponse;
        }

        // Refund excess to creator
        uint256 excess = poll.rewardPool - totalDistributed;
        if (excess > 0) {
            (bool success, ) = poll.creator.call{value: excess}("");
            require(success, "Excess refund failed");
        }
    }

    function _distributeWeightedReward(uint256 pollId) internal {
        Poll storage poll = polls[pollId];
        address[] memory respondents = pollRespondents[pollId];

        // Calculate total rating
        uint256 totalRating = 0;
        for (uint256 i = 0; i < respondents.length; i++) {
            uint256 rating = responses[pollId][respondents[i]].qualityRating;
            require(rating > 0, "All responses must be rated");
            totalRating += rating;
        }

        uint256 platformFee = (poll.rewardPool * platformFeePercent) / BASIS_POINTS;
        uint256 distributionPool = poll.rewardPool - platformFee;

        // Distribute proportionally to ratings
        for (uint256 i = 0; i < respondents.length; i++) {
            uint256 rating = responses[pollId][respondents[i]].qualityRating;
            uint256 reward = (distributionPool * rating) / totalRating;
            _sendReward(pollId, respondents[i], reward);
        }

        _collectPlatformFee(platformFee);
    }

    function _distributeRandomLottery(uint256 pollId) internal {
        Poll storage poll = polls[pollId];
        address[] memory respondents = pollRespondents[pollId];

        // Simple pseudo-random selection (NOTE: Not secure for production, use Chainlink VRF)
        uint256 randomIndex = uint256(
            keccak256(abi.encodePacked(block.timestamp, block.prevrandao, pollId))
        ) % respondents.length;

        address winner = respondents[randomIndex];

        uint256 platformFee = (poll.rewardPool * platformFeePercent) / BASIS_POINTS;
        uint256 winnerReward = poll.rewardPool - platformFee;

        _sendReward(pollId, winner, winnerReward);
        _collectPlatformFee(platformFee);
    }

    function _sendReward(uint256 pollId, address recipient, uint256 amount) internal {
        if (amount > 0) {
            (bool success, ) = recipient.call{value: amount}("");
            require(success, "Reward transfer failed");
            emit RewardDistributed(pollId, recipient, amount);
        }
    }

    function _collectPlatformFee(uint256 amount) internal {
        if (amount > 0) {
            (bool success, ) = owner().call{value: amount}("");
            require(success, "Fee collection failed");
        }
    }

    // View functions

    function getPoll(uint256 pollId) external view override pollExists(pollId) returns (Poll memory) {
        return polls[pollId];
    }

    function getResponse(uint256 pollId, address respondent)
        external
        view
        override
        pollExists(pollId)
        returns (Response memory)
    {
        return responses[pollId][respondent];
    }

    function getPollResponses(uint256 pollId)
        external
        view
        override
        pollExists(pollId)
        returns (address[] memory)
    {
        return pollRespondents[pollId];
    }

    function isWhitelisted(uint256 pollId, address user)
        external
        view
        override
        pollExists(pollId)
        returns (bool)
    {
        return whitelist[pollId][user];
    }

    function hasResponded(uint256 pollId, address user)
        external
        view
        override
        pollExists(pollId)
        returns (bool)
    {
        return hasRespondedMap[pollId][user];
    }

    // Admin functions

    function setPlatformFee(uint256 newFeePercent) external onlyOwner {
        require(newFeePercent <= 10, "Fee too high"); // Max 10%
        platformFeePercent = newFeePercent;
    }

    function withdrawPlatformFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");

        (bool success, ) = owner().call{value: balance}("");
        require(success, "Withdrawal failed");
    }
}

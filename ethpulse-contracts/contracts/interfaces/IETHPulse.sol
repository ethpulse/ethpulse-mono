// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IETHPulse {
    enum RewardType {
        EqualSplit,
        FixedPerResponse,
        WeightedQuality,
        RandomLottery
    }

    enum PollStatus {
        Active,
        Closed,
        Cancelled
    }

    struct Poll {
        address creator;
        uint256 rewardPool;
        uint256 deadline;
        uint256 minResponses;
        uint256 maxResponses;
        uint256 fixedRewardAmount;
        RewardType rewardType;
        PollStatus status;
        uint256 responseCount;
        bool requiresWhitelist;
        bytes32 dataHash; // IPFS hash or similar for poll questions
    }

    struct Response {
        address respondent;
        uint256 timestamp;
        bytes32 dataHash; // IPFS hash for response data
        uint256 qualityRating; // For weighted quality polls (0-10)
    }

    // Events
    event PollCreated(
        uint256 indexed pollId,
        address indexed creator,
        RewardType rewardType,
        uint256 rewardPool,
        uint256 deadline
    );

    event ResponseSubmitted(
        uint256 indexed pollId,
        address indexed respondent,
        bytes32 dataHash
    );

    event PollClosed(
        uint256 indexed pollId,
        uint256 totalResponses
    );

    event PollCancelled(
        uint256 indexed pollId,
        uint256 refundAmount
    );

    event RewardDistributed(
        uint256 indexed pollId,
        address indexed respondent,
        uint256 amount
    );

    event ResponseRated(
        uint256 indexed pollId,
        address indexed respondent,
        uint256 rating
    );

    // Core Functions
    function createPoll(
        uint256 deadline,
        uint256 minResponses,
        uint256 maxResponses,
        uint256 fixedRewardAmount,
        RewardType rewardType,
        bool requiresWhitelist,
        bytes32 dataHash
    ) external payable returns (uint256 pollId);

    function submitResponse(
        uint256 pollId,
        bytes32 dataHash
    ) external payable;

    function closePoll(uint256 pollId) external;

    function cancelPoll(uint256 pollId) external;

    function rateResponse(
        uint256 pollId,
        address respondent,
        uint256 rating
    ) external;

    function addToWhitelist(uint256 pollId, address[] calldata addresses) external;

    function removeFromWhitelist(uint256 pollId, address[] calldata addresses) external;

    // View Functions
    function getPoll(uint256 pollId) external view returns (Poll memory);

    function getResponse(uint256 pollId, address respondent) external view returns (Response memory);

    function getPollResponses(uint256 pollId) external view returns (address[] memory);

    function isWhitelisted(uint256 pollId, address user) external view returns (bool);

    function hasResponded(uint256 pollId, address user) external view returns (bool);
}

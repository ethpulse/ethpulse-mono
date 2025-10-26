# ETHPulse Smart Contracts

Decentralized incentivized polls and surveys platform with flexible reward distribution mechanisms.

## Overview

ETHPulse enables creators to launch polls and surveys with built-in incentives for respondents. The platform supports multiple reward distribution models, access control, and quality-based compensation.

## Features

### Reward Distribution Models

1. **Equal Split**: Reward pool divided equally among all respondents
2. **Fixed Per Response**: Each respondent receives a fixed amount (first-come-first-served)
3. **Weighted Quality**: Creator rates responses 1-10, rewards distributed proportionally
4. **Random Lottery**: Random winner selection from all respondents

### Access Control

- **Whitelist Support**: Restrict poll access to specific addresses
- **One Response Per Address**: Prevent duplicate responses
- **Time-Limited Polls**: Automatic expiration and closure

### Poll Management

- Create polls with customizable parameters
- Cancel polls before responses (full refund)
- Close polls manually or automatically at max responses
- Rate responses for quality-based distribution

## Contract Architecture

```
contracts/
├── ETHPulse.sol              # Main contract implementation
└── interfaces/
    └── IETHPulse.sol         # Contract interface
```

## Getting Started

### Installation

```bash
npm install
```

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm test
```

### Deploy

Local deployment:
```bash
# Start local node
npm run node

# In another terminal
npm run deploy:localhost
```

Testnet deployment:
```bash
npm run deploy:sepolia
```

## Usage

### Creating a Poll

```javascript
const deadline = Math.floor(Date.now() / 1000) + 86400; // 24 hours
const minResponses = 10;
const maxResponses = 100;
const fixedRewardAmount = ethers.parseEther("0.1");
const rewardType = 0; // EqualSplit
const requiresWhitelist = false;
const dataHash = ethers.keccak256(ethers.toUtf8Bytes("ipfs://..."));

const tx = await ethPulse.createPoll(
  deadline,
  minResponses,
  maxResponses,
  fixedRewardAmount,
  rewardType,
  requiresWhitelist,
  dataHash,
  { value: ethers.parseEther("10") } // Reward pool
);

const receipt = await tx.wait();
const pollId = receipt.logs[0].args.pollId;
```

### Submitting a Response

```javascript
const responseHash = ethers.keccak256(ethers.toUtf8Bytes("ipfs://response-data"));

await ethPulse.submitResponse(pollId, responseHash);
```

### Rating Responses (Weighted Quality Polls)

```javascript
// Only poll creator can rate
await ethPulse.rateResponse(pollId, respondentAddress, 8); // Rating 1-10
```

### Closing a Poll

```javascript
// Manual close (after deadline and min responses met)
await ethPulse.closePoll(pollId);

// Auto-close when max responses reached
```

### Managing Whitelist

```javascript
// Add addresses to whitelist
await ethPulse.addToWhitelist(pollId, [address1, address2, address3]);

// Remove from whitelist
await ethPulse.removeFromWhitelist(pollId, [address1]);
```

## Contract Functions

### Core Functions

- `createPoll()`: Create a new poll with reward pool
- `submitResponse()`: Submit a response to an active poll
- `closePoll()`: Close poll and distribute rewards
- `cancelPoll()`: Cancel poll and refund creator (no responses only)
- `rateResponse()`: Rate a response (for weighted quality polls)

### Access Control

- `addToWhitelist()`: Add addresses to poll whitelist
- `removeFromWhitelist()`: Remove addresses from whitelist

### View Functions

- `getPoll()`: Get poll details
- `getResponse()`: Get response data for a specific respondent
- `getPollResponses()`: Get all respondents for a poll
- `isWhitelisted()`: Check if address is whitelisted
- `hasResponded()`: Check if address has responded

### Admin Functions

- `setPlatformFee()`: Set platform fee percentage (max 10%)
- `withdrawPlatformFees()`: Withdraw accumulated fees

## Events

```solidity
event PollCreated(uint256 indexed pollId, address indexed creator, RewardType rewardType, uint256 rewardPool, uint256 deadline)
event ResponseSubmitted(uint256 indexed pollId, address indexed respondent, bytes32 dataHash)
event PollClosed(uint256 indexed pollId, uint256 totalResponses)
event PollCancelled(uint256 indexed pollId, uint256 refundAmount)
event RewardDistributed(uint256 indexed pollId, address indexed respondent, uint256 amount)
event ResponseRated(uint256 indexed pollId, address indexed respondent, uint256 rating)
```

## Security Features

- ReentrancyGuard protection
- Ownable access control
- Input validation
- Safe ETH transfers
- One response per address

## Important Notes

### Random Lottery Security

The current implementation uses pseudo-random number generation for the lottery feature:

```solidity
keccak256(abi.encodePacked(block.timestamp, block.prevrandao, pollId))
```

**For production use**, integrate [Chainlink VRF](https://docs.chain.link/vrf) for secure randomness.

### Gas Optimization

- Consider pagination for large respondent arrays
- Off-chain storage recommended for poll/response data (IPFS)
- Use events for indexing rather than on-chain queries

### Platform Fee

Default platform fee is 2% (configurable by owner, max 10%). Fees are collected during reward distribution.

## Testing

The test suite covers:

- Poll creation (all reward types)
- Response submission
- Whitelist management
- Poll cancellation
- Reward distribution
- Quality rating
- Admin functions
- Edge cases and error conditions

Run tests with coverage:

```bash
npx hardhat coverage
```

## License

MIT

## Contributing

Contributions welcome! Please open an issue or submit a PR.

## Audit Status

⚠️ **This contract has not been audited.** Use at your own risk. Recommended for testnet/hackathon use only until professionally audited.

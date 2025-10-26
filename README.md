# ETHPulse

> Decentralized incentivized polls and surveys platform with flexible reward distribution mechanisms

ETHPulse is a Web3 platform that enables creators to launch polls and surveys with built-in incentives for respondents. The platform supports multiple reward distribution models, access control, and quality-based compensation, all powered by Ethereum smart contracts.

## Features

### 🎁 Multiple Reward Distribution Models

1. **Equal Split** - Reward pool divided equally among all respondents
2. **Fixed Per Response** - Each respondent receives a fixed amount (first-come-first-served)
3. **Weighted Quality** - Creator rates responses 1-10, rewards distributed proportionally
4. **Random Lottery** - Random winner selection from all respondents

### 🔐 Access Control & Security

- **Whitelist Support** - Restrict poll access to specific addresses
- **One Response Per Address** - Prevent duplicate responses
- **Time-Limited Polls** - Automatic expiration and closure
- **On-chain Transparency** - All votes recorded immutably on the blockchain

### 📊 Poll Management

- Create polls with customizable parameters
- Cancel polls before responses (full refund)
- Close polls manually or automatically at max responses
- Rate responses for quality-based distribution
- Real-time results visualization

## Architecture

This is a monorepo containing two main packages:

```
ethpulse-mono/
├── ethpulse-contracts/    # Solidity smart contracts (Hardhat)
│   ├── contracts/         # Smart contract source files
│   ├── scripts/           # Deployment scripts
│   └── test/              # Contract test suite
│
└── ethpulse-app/          # Next.js frontend application
    ├── app/               # Next.js App Router pages
    ├── components/        # React components (shadcn/ui)
    ├── lib/               # Utilities and Web3 integration
    └── hooks/             # Custom React hooks
```

## Tech Stack

### Smart Contracts
- **Solidity** ^0.8.24
- **Hardhat** - Development environment
- **OpenZeppelin** - Secure contract libraries
- **Ethers.js** - Ethereum interaction

### Frontend
- **Next.js** 16.0.0 with App Router
- **React** 19.2.0
- **TypeScript** 5.x
- **Tailwind CSS** v4
- **shadcn/ui** - Component library
- **Recharts** - Data visualization
- **next-themes** - Dark mode support

## Prerequisites

- **Node.js** 18.x or higher
- **npm** or **pnpm**
- **MetaMask** or compatible Web3 wallet

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd ethpulse-mono

# Install contract dependencies
cd ethpulse-contracts
npm install

# Install frontend dependencies
cd ../ethpulse-app
npm install
```

### 2. Set Up Environment Variables

**For Contracts:**

```bash
cd ethpulse-contracts
cp .env.example .env
```

Edit `.env` and add:
- `SEPOLIA_RPC_URL` - Your Alchemy or Infura Sepolia endpoint
- `PRIVATE_KEY` - Your deployer wallet private key
- `ETHERSCAN_API_KEY` - For contract verification

**For Frontend:**

```bash
cd ethpulse-app
# Create .env.local if needed for contract addresses (after deployment)
```

### 3. Compile Contracts

```bash
cd ethpulse-contracts
npm run compile
```

### 4. Run Tests

```bash
cd ethpulse-contracts
npm test
```

### 5. Start Frontend Development Server

```bash
cd ethpulse-app
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Development Workflow

### Local Blockchain Development

```bash
# Terminal 1: Start local Hardhat node
cd ethpulse-contracts
npm run node

# Terminal 2: Deploy to local network
npm run deploy:localhost

# Terminal 3: Start frontend
cd ../ethpulse-app
npm run dev
```

### Working with Contracts

```bash
cd ethpulse-contracts

# Compile contracts
npm run compile

# Run tests
npm test

# Run tests with coverage
npx hardhat coverage

# Deploy to Sepolia testnet
npm run deploy:sepolia
```

### Frontend Development

```bash
cd ethpulse-app

# Development server with hot reload
npm run dev

# Type checking
npm run lint

# Build for production
npm run build

# Start production server
npm run start
```

## Deployment

### Deploy Smart Contracts to Sepolia

1. Ensure your `.env` file is properly configured
2. Fund your deployer wallet with Sepolia ETH
3. Run deployment:

```bash
cd ethpulse-contracts
npm run deploy:sepolia
```

4. Note the deployed contract address from the console output
5. Contract will be automatically verified on Etherscan

### Deploy Frontend to Vercel

```bash
cd ethpulse-app

# Install Vercel CLI (if not already)
npm i -g vercel

# Deploy
vercel
```

Or push to GitHub and connect to Vercel for automatic deployments.

## Project Structure

### Smart Contracts (`ethpulse-contracts/`)

```
contracts/
├── ETHPulse.sol              # Main contract implementation
└── interfaces/
    └── IETHPulse.sol         # Contract interface

scripts/
└── deploy.js                 # Deployment script with verification

test/
└── ETHPulse.test.js         # Comprehensive test suite
```

### Frontend (`ethpulse-app/`)

```
app/
├── layout.tsx               # Root layout with providers
├── page.tsx                 # Homepage
├── create/                  # Create poll page
│   └── page.tsx
└── polls/                   # Browse/vote on polls
    └── page.tsx

components/
├── navbar.tsx               # Navigation bar
├── poll-results.tsx         # Results visualization
├── theme-provider.tsx       # Dark mode provider
├── web3-provider.tsx        # Web3 context provider
└── ui/                      # shadcn/ui components

lib/
├── polls.ts                 # Poll data management
├── web3.ts                  # Web3 utilities
└── utils.ts                 # General utilities

hooks/
├── use-toast.ts            # Toast notifications
└── use-mobile.ts           # Mobile detection
```

## Current Status

⚠️ **Important Notes:**

### Smart Contract
- ✅ Contracts written and tested
- ✅ Deployment script ready
- ❌ **NOT YET DEPLOYED** to Sepolia testnet
- ⚠️ Not audited - for testnet/hackathon use only

### Frontend
- ✅ UI/UX complete with Next.js 16
- ✅ Web3 wallet connection implemented
- ✅ Poll creation and voting interface
- ❌ **USING MOCK DATA** - Not yet integrated with smart contracts
- ❌ No contract ABI or address configuration

## Integration Roadmap

To complete the integration between frontend and smart contracts:

- [ ] Deploy ETHPulse contract to Sepolia testnet
- [ ] Create contract integration layer (`lib/contract.ts`)
- [ ] Add contract ABI to frontend
- [ ] Configure contract address in environment variables
- [ ] Replace mock poll functions with contract calls
- [ ] Implement ethers.js contract instances
- [ ] Add transaction handling and error states
- [ ] Implement event listeners for real-time updates
- [ ] Add IPFS integration for poll/response data storage
- [ ] Integrate Chainlink VRF for secure lottery randomness (production)

## Smart Contract Functions

### Core Functions

- `createPoll()` - Create a new poll with reward pool
- `submitResponse()` - Submit a response to an active poll
- `closePoll()` - Close poll and distribute rewards
- `cancelPoll()` - Cancel poll and refund creator
- `rateResponse()` - Rate a response (weighted quality polls)

### Access Control

- `addToWhitelist()` - Add addresses to poll whitelist
- `removeFromWhitelist()` - Remove addresses from whitelist

### View Functions

- `getPoll()` - Get poll details
- `getResponse()` - Get response data for a respondent
- `getPollResponses()` - Get all respondents for a poll
- `isWhitelisted()` - Check whitelist status
- `hasResponded()` - Check if address has responded

### Admin Functions

- `setPlatformFee()` - Set platform fee percentage (max 10%)
- `withdrawPlatformFees()` - Withdraw accumulated fees

## Security Considerations

### Contract Security
- ReentrancyGuard protection on all state-changing functions
- Ownable access control for admin functions
- Comprehensive input validation
- Safe ETH transfer patterns
- Tested against common vulnerabilities

### Random Lottery Warning

⚠️ The current lottery implementation uses pseudo-random generation suitable for testnets:
```solidity
keccak256(abi.encodePacked(block.timestamp, block.prevrandao, pollId))
```

**For production**, integrate [Chainlink VRF](https://docs.chain.link/vrf) for provably fair randomness.

### Platform Fee

Default platform fee is 2% (configurable by owner, max 10%). Fees are collected during reward distribution.

## Testing

The smart contracts include comprehensive tests covering:
- Poll creation (all reward types)
- Response submission and validation
- Whitelist management
- Poll cancellation and refunds
- Reward distribution calculations
- Quality rating system
- Admin functions
- Edge cases and error conditions

Run the test suite:

```bash
cd ethpulse-contracts
npm test

# With coverage report
npx hardhat coverage
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Built for ETHGlobal hackathon
- Smart contracts based on OpenZeppelin standards
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

## Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**⚠️ Disclaimer:** This project has not been audited. Use at your own risk. Recommended for testnet and educational purposes only until professionally audited.

# Blockchain Donations Platform

A decentralized crowdfunding platform built on Ethereum that enables transparent, milestone-based fundraising campaigns with blockchain technology.

## Overview

This platform allows users to create donation campaigns with milestone-based goals, track donations transparently on the blockchain, and manage campaign progress through a modern web interface. All campaigns are deployed as smart contracts, ensuring transparency and trustless operation.

## Features

- **Create Campaigns**: Launch fundraising campaigns with customizable goals and milestones
- **Milestone Tracking**: Set multiple funding milestones with deadlines
- **Transparent Donations**: All donations are recorded on the blockchain
- **Campaign Discovery**: Browse all active campaigns
- **Real-time Progress**: Track donation progress and recent activity
- **Wallet Integration**: Connect with Web3 wallets (MetaMask, WalletConnect, etc.)
- **Image Upload**: Add campaign images (up to 10MB)

## Tech Stack

### Frontend
- **React** 19.1.1 - UI framework
- **Vite** 7.1.7 - Build tool
- **React Router** 7.9.4 - Navigation
- **Ethers.js** 6.15.0 - Ethereum interaction
- **Web3Modal/Wagmi** - Wallet connection
- **Tailwind CSS** 4.1.14 - Styling

### Backend
- **Node.js** with Express 4.18.2
- **SQLite3** 5.1.6 - Local database
- **Ethers.js** 6.8.1 - Blockchain interaction
- **Joi** 17.11.0 - Validation
- **CORS** enabled for cross-origin requests

### Smart Contracts
- **Solidity** - Smart contract language
- **Hardhat** 2.26.3 - Development environment
- **OpenZeppelin Contracts** 4.9.3 - Contract libraries
- **Campaign Factory Pattern** - Deploy individual campaign contracts

## Project Structure

```
IS4302-Donations/
├── frontend/           # React frontend application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Page components
│   │   ├── lib/        # Utilities and API clients
│   │   └── index.css   # Global styles
│   └── package.json
├── backend/            # Express.js backend server
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   └── services/
│   ├── index.js
│   └── package.json
├── contracts/          # Solidity smart contracts
│   ├── Campaign.sol
│   └── CampaignFactory.sol
├── scripts/            # Deployment and utility scripts
├── test/               # Smart contract tests
└── hardhat.config.js   # Hardhat configuration
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or pnpm
- MetaMask or compatible Web3 wallet
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd IS4302-Donations
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

4. **Install backend dependencies**
   ```bash
   cd ../backend
   npm install
   ```

### Configuration

1. **Backend Environment Setup**

   Create a `.env` file in the `backend` directory:
   ```bash
   cd backend
   cp .env.example .env
   ```

   Edit the `.env` file with your configuration:
   ```env
   PORT=3001
   NODE_ENV=development
   RPC_URL=http://localhost:8545
   CHAIN_ID=1337
   FACTORY_ADDRESS=0x...
   START_BLOCK=0
   DATABASE_URL=./data/donations.db
   ```

2. **Frontend Environment Setup**

   Create a `.env` file in the `frontend` directory:
   ```bash
   cd frontend
   ```

   Add the following:
   ```env
   VITE_BACKEND_URL=http://localhost:3001/api
   ```

### Running the Application

1. **Start the Backend Server**
   ```bash
   cd backend
   npm start
   ```
   The backend will run on `http://localhost:3001`

2. **Start the Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

3. **Access the Application**

   Open your browser and navigate to: `http://localhost:5173`

### Smart Contract Development

1. **Compile Contracts**
   ```bash
   npx hardhat compile
   ```

2. **Run Tests**
   ```bash
   npx hardhat test
   ```

3. **Deploy Contracts (Local Network)**
   ```bash
   npx hardhat node
   # In another terminal:
   npx hardhat run scripts/deploy.js --network localhost
   ```

4. **Deploy to Testnet/Mainnet**
   ```bash
   npx hardhat run scripts/deploy.js --network <network-name>
   ```

## Usage

### Creating a Campaign

1. Click "Create Campaign" in the navigation
2. Fill in the campaign details:
   - Upload an image (optional)
   - Enter campaign title (required)
   - Write a description (required)
   - Set overall goal in ETH (required)
   - Set campaign deadline (required)
   - Add milestones (optional)
3. Click "Save and confirm" to create the campaign

### Donating to a Campaign

1. Browse campaigns on the "All Campaigns" page
2. Click on a campaign to view details
3. Click the "Donate" button
4. Connect your wallet if not already connected
5. Enter donation amount and confirm transaction

### Viewing Campaign Progress

- **Progress Circle**: Visual representation of funding progress
- **Milestone Timeline**: Track which milestones have been reached
- **Recent Activity**: See recent donations and updates
- **Donor Count**: Number of unique donors

## API Endpoints

### Backend REST API

- `GET /api/campaigns` - List all campaigns
- `GET /api/campaigns/:address` - Get campaign details
- `POST /api/campaigns` - Create new campaign
- `GET /api/campaigns/:address/events` - Get campaign events
- `GET /api/health` - Health check endpoint

## Development

### Building for Production

**Frontend:**
```bash
cd frontend
npm run build
```

**Backend:**
The backend runs directly with Node.js (no build step required)

### Linting

```bash
cd frontend
npm run lint
```


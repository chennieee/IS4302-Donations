# Quick Start Guide

## What I Simplified

### Removed:
- Docker files (Dockerfile, docker-compose.yml)
- Test files and Jest configuration
- ESLint configuration
- Migration scripts
- Middleware directory
- Utility files
- IPFS/Pinata integration
- Health controller
- Indexer (can add back if needed)

### Kept (Only Essential Files):
```
backend/
├── index.js                           # Main server (SINGLE ENTRY POINT)
├── package.json                       # 6 dependencies only
├── .env                              # Your config
├── config/index.js                   # Config loader
└── src/
    ├── models/database.js            # SQLite wrapper
    ├── controllers/campaignController.js  # Campaign API
    └── services/
        ├── blockchainService.js      # Blockchain interaction
        └── eventProcessor.js         # Event processing
```

## Run in 3 Steps

### 1. Install (first time only)
```bash
cd backend
npm install
```

### 2. Configure
```bash
cp .env.example .env
# Edit .env with your RPC_URL and FACTORY_ADDRESS
```

### 3. Start
```bash
npm start
```

That's it! Server runs on http://localhost:3001

## API Endpoints

```bash
# Get all campaigns
curl http://localhost:3001/api/campaigns

# Get specific campaign
curl http://localhost:3001/api/campaigns/0xYourCampaignAddress

# Get campaign events
curl http://localhost:3001/api/campaigns/0xYourCampaignAddress/events
```

## Notes

- Database auto-creates on first run
- No Docker needed
- No complex build process
- Just Node.js + 6 npm packages
- Total: 8 files (excluding node_modules)

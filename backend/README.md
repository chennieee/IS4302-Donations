# Donations Backend

Simple Node.js backend for the blockchain donations platform.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and update with your values:
```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=3001
RPC_URL=http://localhost:8545
CHAIN_ID=1337
FACTORY_ADDRESS=0xYourFactoryAddress
DATABASE_URL=./data/donations.db
```

### 3. Run the Server
```bash
npm start
```

Server will start on `http://localhost:3001`

## API Endpoints

### Get All Campaigns
```
GET /api/campaigns
```

Query parameters:
- `organizer` - Filter by organizer address
- `verifier` - Filter by verifier address
- `status` - Filter by status (active/completed/expired)
- `limit` - Number of results (default: 20, max: 100)
- `cursor` - Pagination cursor

### Get Single Campaign
```
GET /api/campaigns/:address
```

Returns campaign details, verifiers, milestones, and recent activity.

### Get Campaign Events
```
GET /api/campaigns/:address/events
```

Query parameters:
- `limit` - Number of events (default: 20, max: 100)
- `cursor` - Pagination cursor

## File Structure

```
backend/
├── index.js                    # Main server file (START HERE)
├── package.json               # Dependencies
├── .env                       # Configuration (create from .env.example)
├── config/
│   └── index.js              # Config loader
├── src/
│   ├── models/
│   │   └── database.js       # SQLite database
│   ├── controllers/
│   │   └── campaignController.js  # Campaign API logic
│   └── services/
│       ├── blockchainService.js   # Blockchain interaction
│       └── eventProcessor.js      # Event processing
└── data/
    └── donations.db          # SQLite database (auto-created)
```

## Database

The backend uses SQLite for simplicity. The database file is created automatically in `./data/donations.db` when you first run the server.

Tables:
- `campaigns` - Campaign information
- `verifiers` - Campaign verifiers (many-to-many)
- `milestones` - Milestone tracking
- `donations` - Donation records
- `event_log` - Blockchain events
- `aggregates` - Cached aggregates

## Notes

- Database is created automatically on first run
- All blockchain data must be indexed separately (indexer not included in this minimal setup)
- For production, consider adding proper error logging and monitoring

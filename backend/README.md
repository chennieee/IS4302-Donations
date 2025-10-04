# Simplified Donations Backend

A minimal backend service for the blockchain donations platform - Team 3 implementation.

## What This Does

1. **IPFS /pin endpoint** - Used ONLY by Team 1 during deployment for uploading campaign metadata
2. **Event indexing** - Backfills and live-subscribes to blockchain events (all events marked finalized immediately)
3. **Simple API** - Two endpoints for frontend consumption

## Database

**Single table: `events`** (denormalized)
- tx_hash, log_index, campaign_addr, event_name, args_json, block_number, timestamp, finalized

Frontend reads campaign data directly from contract! No complex aggregation tables.

## API Endpoints

### GET /api/events/:campaignAddress?limit=5
Returns last 5 events for ONE campaign, ordered by block_number DESC

Example:
```bash
curl "http://localhost:3001/api/events/0x1234567890123456789012345678901234567890?limit=5"
```

Response:
```json
[
  {
    "eventName": "DonationReceived",
    "args": { "donor": "0x...", "amount": "1000000" },
    "blockNumber": 12345,
    "txHash": "0x...",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
]
```

### GET /api/health
Simple health check

Response:
```json
{ "status": "ok", "lastBlock": 12345 }
```

### POST /api/pin
For Team 1 deployment only. Pins JSON or files to IPFS via Pinata.

## Setup

1. Copy environment file:
```bash
cp .env.example .env
```

2. Configure for Sepolia in `.env`:
```bash
RPC_URL=https://sepolia.infura.io/v3/your-key
CHAIN_ID=11155111
FACTORY_ADDRESS=0x... # From Team 1
START_BLOCK=12345678
PINATA_API_KEY=your-key
PINATA_SECRET_API_KEY=your-secret
```

3. Install and run:
```bash
npm install
npm run migrate
npm run dev  # or npm start
```

4. Run indexer (separate terminal):
```bash
npm run indexer
```

## Architecture

- **No authentication** (except IPFS endpoint used by Team 1)
- **No pagination** (just limit=5)
- **No complex validation** (basic address format check)
- **No reorg handling** (mark all events finalized immediately)
- **SQLite only** (no Postgres)

This is intentionally simplified for the course project!
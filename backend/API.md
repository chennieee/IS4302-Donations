# Donations Backend API Documentation

Base URL: `http://localhost:3001/api`

## Authentication

Protected endpoints require an API key in the header:
```
X-API-Key: your-api-key-here
```

## Response Format

All responses follow this format:

### Success Response
```json
{
  "data": { ... },
  "success": true
}
```

### Error Response
```json
{
  "error": "Error message",
  "success": false
}
```

### Paginated Response
```json
{
  "data": [...],
  "nextCursor": "base64-encoded-cursor",
  "hasMore": true
}
```

## Endpoints

### Public Endpoints

#### GET /campaigns

List all donation campaigns with optional filtering.

**Query Parameters:**
- `organizer` (string): Filter by organizer address (0x...)
- `verifier` (string): Filter by verifier address (0x...)
- `status` (string): Filter by status (active, completed, expired)
- `limit` (number): Number of results (1-100, default: 20)
- `cursor` (string): Base64 encoded pagination cursor

**Example Request:**
```bash
curl "http://localhost:3001/api/campaigns?status=active&limit=10"
```

**Example Response:**
```json
{
  "campaigns": [
    {
      "address": "0x1234...",
      "organizer": "0x5678...",
      "verifier": "0x9abc...",
      "token": "0xdef0...",
      "trancheBps": [5000, 3000, 2000],
      "deadline": 1672531200,
      "ipfsCid": "QmHash123...",
      "createdBlock": 12345,
      "totalRaised": "1000000000000000000",
      "totalReleased": "500000000000000000",
      "donorCount": 42,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "nextCursor": "eyJibG9ja051bWJlciI6MTIzNDV9",
  "hasMore": true
}
```

#### GET /campaign/:address

Get detailed information about a specific campaign.

**Path Parameters:**
- `address` (string): Campaign contract address

**Example Request:**
```bash
curl "http://localhost:3001/api/campaign/0x1234567890123456789012345678901234567890"
```

**Example Response:**
```json
{
  "address": "0x1234...",
  "organizer": "0x5678...",
  "verifier": "0x9abc...",
  "token": "0xdef0...",
  "trancheBps": [5000, 3000, 2000],
  "deadline": 1672531200,
  "ipfsCid": "QmHash123...",
  "createdBlock": 12345,
  "totalRaised": "1000000000000000000",
  "totalReleased": "500000000000000000",
  "donorCount": 42,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "milestones": [
    {
      "index": 0,
      "status": "Released",
      "approvedAt": "2024-01-15T10:00:00.000Z",
      "releasedAt": "2024-01-15T11:00:00.000Z",
      "amountReleased": "500000000000000000"
    },
    {
      "index": 1,
      "status": "Approved",
      "approvedAt": "2024-01-20T09:00:00.000Z",
      "releasedAt": null,
      "amountReleased": "0"
    },
    {
      "index": 2,
      "status": "Pending",
      "approvedAt": null,
      "releasedAt": null,
      "amountReleased": "0"
    }
  ],
  "recentActivity": [
    {
      "eventName": "MilestoneApproved",
      "args": { "milestoneIndex": "1" },
      "blockNumber": 12500,
      "txHash": "0xabc123...",
      "timestamp": "2024-01-20T09:00:00.000Z"
    }
  ]
}
```

#### GET /campaign/:address/events

Get paginated list of events for a specific campaign.

**Path Parameters:**
- `address` (string): Campaign contract address

**Query Parameters:**
- `limit` (number): Number of results (1-100, default: 20)
- `cursor` (string): Base64 encoded pagination cursor

**Example Request:**
```bash
curl "http://localhost:3001/api/campaign/0x1234567890123456789012345678901234567890/events?limit=5"
```

**Example Response:**
```json
{
  "events": [
    {
      "eventName": "DonationReceived",
      "args": {
        "donor": "0x1111...",
        "amount": "1000000000000000000"
      },
      "blockNumber": 12400,
      "txHash": "0xdef456...",
      "logIndex": 2,
      "timestamp": "2024-01-10T12:00:00.000Z"
    },
    {
      "eventName": "MilestoneApproved",
      "args": {
        "milestoneIndex": "0"
      },
      "blockNumber": 12450,
      "txHash": "0x789abc...",
      "logIndex": 1,
      "timestamp": "2024-01-15T10:00:00.000Z"
    }
  ],
  "nextCursor": "eyJibG9ja051bWJlciI6MTI0MDB9",
  "hasMore": true
}
```

#### GET /health

Comprehensive health check of all backend services.

**Example Request:**
```bash
curl "http://localhost:3001/api/health"
```

**Example Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "version": "1.0.0",
  "environment": "development",
  "services": {
    "database": {
      "healthy": true,
      "message": "Connected",
      "stats": {
        "campaigns": 5,
        "donations": 123,
        "milestones": 15,
        "refunds": 2,
        "totalRaised": 5000000000000000000
      }
    },
    "blockchain": {
      "healthy": true,
      "message": "Connected",
      "currentBlock": 12600,
      "chainId": 80002,
      "factoryDeployed": true
    },
    "pinata": {
      "healthy": true,
      "message": "Authenticated",
      "totalPins": 10
    }
  },
  "indexer": {
    "lastProcessedBlock": 12599,
    "currentBlock": 12600,
    "blocksBehind": 1,
    "lastUpdated": "2024-01-01T11:59:30.000Z",
    "healthy": true
  },
  "responseTime": 150,
  "errors": []
}
```

#### GET /health/simple

Simple health check for load balancers.

**Example Response:**
```json
{
  "status": "ok"
}
```

### Protected Endpoints

#### POST /pin

Pin JSON content or files to IPFS via Pinata.

**Headers:**
```
X-API-Key: your-api-key
Content-Type: application/json (for JSON) or multipart/form-data (for files)
```

**For JSON Content:**
```json
{
  "content": {
    "title": "Campaign Metadata",
    "description": "Important campaign information"
  },
  "metadata": {
    "name": "Campaign Title",
    "keyvalues": {
      "type": "campaign",
      "version": "1.0"
    }
  }
}
```

**For File Upload:**
Use multipart/form-data with `files` field containing the files to upload.

**Example Response:**
```json
{
  "success": true,
  "cid": "QmHash123456789",
  "size": 1024,
  "type": "json"
}
```

#### POST /pin/campaign

Pin campaign metadata with validation.

**Headers:**
```
X-API-Key: your-api-key
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Save the Rainforest",
  "summary": "Help us protect 1000 acres of rainforest through community-based conservation.",
  "images": ["QmImageHash1", "QmImageHash2"],
  "milestones": [
    {
      "name": "Land Acquisition",
      "description": "Purchase 500 acres of threatened rainforest",
      "docsCid": "QmDocsHash1"
    },
    {
      "name": "Conservation Setup",
      "description": "Establish protection measures and community programs",
      "docsCid": "QmDocsHash2"
    }
  ],
  "verifier": "0x1234567890123456789012345678901234567890",
  "tokenAddr": "0x0987654321098765432109876543210987654321",
  "trancheBps": [6000, 4000],
  "deadline": "2024-12-31T23:59:59.000Z"
}
```

**Example Response:**
```json
{
  "success": true,
  "cid": "QmCampaignHash123",
  "size": 2048,
  "type": "campaign",
  "data": {
    "title": "Save the Rainforest",
    "summary": "Help us protect 1000 acres...",
    "milestones": [...],
    "verifier": "0x1234...",
    "tokenAddr": "0x0987...",
    "trancheBps": [6000, 4000],
    "deadline": "2024-12-31T23:59:59.000Z",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### GET /pin/list

List pinned content from Pinata.

**Headers:**
```
X-API-Key: your-api-key
```

**Query Parameters:**
- `status` (string): Filter by status (pinned, unpinned)
- `pageLimit` (number): Number of results (1-1000, default: 10)
- `pageOffset` (number): Offset for pagination (default: 0)

**Example Response:**
```json
{
  "success": true,
  "pins": [
    {
      "id": "pin123",
      "ipfs_pin_hash": "QmHash123",
      "size": 1024,
      "user_id": "user456",
      "date_pinned": "2024-01-01T12:00:00.000Z",
      "date_unpinned": null,
      "metadata": {
        "name": "Campaign Metadata",
        "keyvalues": {
          "type": "campaign"
        }
      }
    }
  ],
  "count": 1
}
```

#### DELETE /pin/:cid

Remove content from IPFS.

**Headers:**
```
X-API-Key: your-api-key
```

**Path Parameters:**
- `cid` (string): IPFS content identifier

**Example Response:**
```json
{
  "success": true,
  "message": "Content QmHash123 unpinned successfully"
}
```

## Error Codes

- `400` - Bad Request (validation errors, invalid parameters)
- `401` - Unauthorized (missing or invalid API key)
- `404` - Not Found (campaign not found)
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error
- `503` - Service Unavailable (external service failures)

## Rate Limiting

API endpoints may be rate-limited based on:
- API key usage
- IP address
- Endpoint-specific limits

Current limits:
- Public endpoints: 100 requests/minute per IP
- Authenticated endpoints: 1000 requests/minute per API key
- File uploads: 10 uploads/minute per API key

## IPFS Gateway

Pinned content can be accessed via IPFS gateways:
- `https://gateway.pinata.cloud/ipfs/{cid}`
- `https://ipfs.io/ipfs/{cid}`

## WebSocket Support

Real-time updates are planned for future releases:
- New campaign notifications
- Donation events
- Milestone status changes

## SDK/Client Libraries

Official client libraries coming soon:
- JavaScript/TypeScript
- Python
- Go

## Support

For API support:
- Create an issue in the GitHub repository
- Check the health endpoint for service status
- Review logs for detailed error information
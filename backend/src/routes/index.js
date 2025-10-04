const express = require('express');
const Database = require('../models/database');
const IPFSController = require('../controllers/ipfsController');
const Indexer = require('../indexer');

const router = express.Router();

// Initialize database
const db = new Database();
const ipfsController = new IPFSController();

let indexer;

// Initialize services
router.use(async (req, res, next) => {
  if (!db.db) {
    await db.initialize();
  }
  next();
});

// MINIMAL REST ENDPOINTS

// GET /events/:campaignAddress?limit=5
// Return last 5 events for ONE campaign, ordered by block_number DESC
router.get('/events/:campaignAddress', async (req, res) => {
  try {
    const { campaignAddress } = req.params;
    const limit = parseInt(req.query.limit) || 5;

    // Validate campaign address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(campaignAddress)) {
      return res.status(400).json({ error: 'Invalid campaign address' });
    }

    const events = await db.all(
      `SELECT event_name, args_json, block_number, tx_hash, timestamp
       FROM events
       WHERE campaign_addr = ?
       ORDER BY block_number DESC
       LIMIT ?`,
      [campaignAddress.toLowerCase(), limit]
    );

    const formattedEvents = events.map(event => ({
      eventName: event.event_name,
      args: JSON.parse(event.args_json),
      blockNumber: event.block_number,
      txHash: event.tx_hash,
      timestamp: event.timestamp
    }));

    res.json(formattedEvents);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET /health
// { status: "ok", lastBlock: 12345 }
router.get('/health', async (req, res) => {
  try {
    // Get indexer status if available
    let lastBlock = null;
    try {
      if (!indexer) {
        indexer = new Indexer();
      }
      const status = await indexer.getStatus();
      lastBlock = status.lastProcessedBlock;
    } catch (error) {
      console.warn('Could not get indexer status:', error.message);
    }

    res.json({
      status: 'ok',
      lastBlock
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// POST /pin (for Team 1 deployment only)
router.post('/pin', ipfsController.pinContent.bind(ipfsController));

module.exports = router;
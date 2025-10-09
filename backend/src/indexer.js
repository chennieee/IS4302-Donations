const Database = require('./models/database');
const BlockchainService = require('./services/blockchainService');
const config = require('../config');

class Indexer {
  constructor() {
    this.db = new Database();
    this.blockchain = new BlockchainService();
    this.isRunning = false;
    this.lastProcessedBlock = null;
  }

  async initialize() {
    await this.db.initialize();
    await this.loadLastProcessedBlock();
    console.log(`Indexer initialized. Starting from block ${this.lastProcessedBlock + 1}`);
  }

  async loadLastProcessedBlock() {
    const state = await this.db.get('SELECT last_processed_block FROM indexer_state WHERE id = 1');
    this.lastProcessedBlock = state ? state.last_processed_block : config.blockchain.startBlock - 1;
  }

  async saveLastProcessedBlock(blockNumber) {
    await this.db.run(
      'UPDATE indexer_state SET last_processed_block = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
      [blockNumber]
    );
    this.lastProcessedBlock = blockNumber;
  }

  async start() {
    if (this.isRunning) {
      console.log('Indexer is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting simplified indexer...');

    try {
      await this.initialize();
      await this.backfill();
      await this.subscribe();
    } catch (error) {
      console.error('Indexer error:', error);
      this.isRunning = false;
      throw error;
    }
  }

  async backfill() {
    const currentBlock = await this.blockchain.getCurrentBlock();
    const startBlock = this.lastProcessedBlock + 1;

    if (startBlock > currentBlock) {
      console.log('No blocks to backfill');
      return;
    }

    console.log(`Backfilling from block ${startBlock} to ${currentBlock}...`);

    // Process in batches
    const batchSize = 100;

    for (let fromBlock = startBlock; fromBlock <= currentBlock; fromBlock += batchSize) {
      const toBlock = Math.min(fromBlock + batchSize - 1, currentBlock);

      try {
        await this.processBlockRange(fromBlock, toBlock);
        await this.saveLastProcessedBlock(toBlock);

        console.log(`Processed blocks ${fromBlock} to ${toBlock}`);

        // Small delay to avoid overwhelming the RPC
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error processing blocks ${fromBlock} to ${toBlock}:`, error);
        throw error;
      }
    }

    console.log('Backfill completed');
  }

  async processBlockRange(fromBlock, toBlock) {
    // Get all factory events (campaign creation)
    const factoryLogs = await this.blockchain.getFactoryLogs(fromBlock, toBlock);

    // Process factory events first
    for (const log of factoryLogs) {
      await this.storeEvent(log);
    }

    // Get all campaign addresses from our database
    const campaigns = await this.db.all(
      'SELECT DISTINCT campaign_addr FROM events WHERE event_name = "CampaignCreated"'
    );

    // Process campaign events for each known campaign
    for (const { campaign_addr } of campaigns) {
      try {
        const campaignLogs = await this.blockchain.getCampaignLogs(campaign_addr, fromBlock, toBlock);

        for (const log of campaignLogs) {
          await this.storeEvent(log);
        }
      } catch (error) {
        console.error(`Error processing campaign ${campaign_addr}:`, error);
        // Continue with other campaigns
      }
    }
  }

  async storeEvent(eventLog) {
    try {
      // Store event in simplified events table (all events marked as finalized=true immediately)
      await this.db.run(
        `INSERT OR REPLACE INTO events
         (tx_hash, log_index, campaign_addr, event_name, args_json, block_number, finalized)
         VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
        [
          eventLog.txHash,
          eventLog.logIndex,
          eventLog.address.toLowerCase(),
          eventLog.eventName,
          JSON.stringify(eventLog.args),
          eventLog.blockNumber
        ]
      );

      console.log(`Stored event: ${eventLog.eventName} in tx ${eventLog.txHash}`);
    } catch (error) {
      console.error(`Error storing event ${eventLog.eventName}:`, error);
      throw error;
    }
  }

  async subscribe() {
    console.log('Starting live subscription...');

    const pollForNewBlocks = async () => {
      if (!this.isRunning) return;

      try {
        const currentBlock = await this.blockchain.getCurrentBlock();
        const nextBlock = this.lastProcessedBlock + 1;

        if (nextBlock <= currentBlock) {
          await this.processBlockRange(nextBlock, currentBlock);
          await this.saveLastProcessedBlock(currentBlock);
        }
      } catch (error) {
        console.error('Error in subscription loop:', error);
      }

      // Schedule next poll (every 5 seconds)
      setTimeout(pollForNewBlocks, 5000);
    };

    // Start polling
    setTimeout(pollForNewBlocks, 5000);
  }

  async stop() {
    this.isRunning = false;
    await this.db.close();
    console.log('Indexer stopped');
  }

  async getStatus() {
    const currentBlock = await this.blockchain.getCurrentBlock();
    const eventCount = await this.db.get('SELECT COUNT(*) as count FROM events');

    return {
      isRunning: this.isRunning,
      lastProcessedBlock: this.lastProcessedBlock,
      currentBlock,
      blocksBehind: currentBlock - this.lastProcessedBlock,
      totalEvents: eventCount.count,
      chainId: config.blockchain.chainId
    };
  }
}

// Run indexer if this file is executed directly
if (require.main === module) {
  const indexer = new Indexer();

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    await indexer.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    await indexer.stop();
    process.exit(0);
  });

  indexer.start().catch(error => {
    console.error('Failed to start indexer:', error);
    process.exit(1);
  });
}

module.exports = Indexer;
const EventProcessor = require('./eventProcessor');
const BlockchainService = require('./blockchainService');
const Database = require('../models/database');
const config = require('../../config');

class Indexer {
  constructor() {
    this.processor = new EventProcessor();
    this.blockchain = new BlockchainService();
    this.db = new Database();
    this.isRunning = false;
    this.lastProcessedBlock = null;
    this.pollInterval = config.blockchain?.pollInterval || 5000;
  }

  async initialize() {
    await this.processor.initialize();
    await this.db.initialize();

    // Get last processed block from state
    const state = await this.db.get(
      'SELECT last_processed_block FROM indexer_state WHERE id = 1'
    );

    if (state && state.last_processed_block) {
      this.lastProcessedBlock = state.last_processed_block;
      console.log(`Resuming from block ${this.lastProcessedBlock}`);
    } else {
      this.lastProcessedBlock = config.blockchain?.startBlock || 0;
      console.log(`Starting from block ${this.lastProcessedBlock}`);

      // Initialize state
      await this.db.run(
        'INSERT OR REPLACE INTO indexer_state (id, last_processed_block) VALUES (1, ?)',
        [this.lastProcessedBlock]
      );
    }
  }

  async start() {
    if (this.isRunning) {
      console.log('Indexer is already running');
      return;
    }

    this.isRunning = true;
    console.log('🔍 Blockchain indexer started');

    // Start polling loop
    this.poll();
  }

  async poll() {
    while (this.isRunning) {
      try {
        await this.indexNewBlocks();
      } catch (error) {
        console.error('Error in indexer poll:', error);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, this.pollInterval));
    }
  }

  async indexNewBlocks() {
    try {
      const currentBlock = await this.blockchain.getCurrentBlock();
      const toBlock = currentBlock;
      const fromBlock = this.lastProcessedBlock + 1;

      if (fromBlock > toBlock) {
        // No new blocks
        return;
      }

      console.log(`Indexing blocks ${fromBlock} to ${toBlock}...`);

      // Get all campaigns to monitor
      const campaigns = await this.db.all('SELECT addr FROM campaigns');
      const campaignAddresses = campaigns.map(c => c.addr);

      // First, index factory events (new campaigns)
      await this.indexFactoryEvents(fromBlock, toBlock);

      // Then index campaign events for all known campaigns
      for (const campaignAddr of campaignAddresses) {
        await this.indexCampaignEvents(campaignAddr, fromBlock, toBlock);
      }

      // Index plain ETH transfers to campaigns (for campaigns without contracts)
      for (const campaignAddr of campaignAddresses) {
        await this.indexEthTransfers(campaignAddr, fromBlock, toBlock);
      }

      // Update last processed block
      this.lastProcessedBlock = toBlock;
      await this.db.run(
        'UPDATE indexer_state SET last_processed_block = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
        [toBlock]
      );

      // Finalize events that have enough confirmations
      await this.processor.finalizeEvents(currentBlock);

      console.log(`✓ Indexed blocks up to ${toBlock}`);
    } catch (error) {
      console.error('Error indexing blocks:', error);
      throw error;
    }
  }

  async indexFactoryEvents(fromBlock, toBlock) {
    try {
      const factoryLogs = await this.blockchain.getFactoryLogs(fromBlock, toBlock);

      for (const log of factoryLogs) {
        await this.processor.processEvent(log);
      }

      if (factoryLogs.length > 0) {
        console.log(`  ✓ Processed ${factoryLogs.length} factory event(s)`);
      }
    } catch (error) {
      console.error('Error indexing factory events:', error);
      throw error;
    }
  }

  async indexCampaignEvents(campaignAddr, fromBlock, toBlock) {
    try {
      const campaignLogs = await this.blockchain.getCampaignLogs(
        campaignAddr,
        fromBlock,
        toBlock
      );

      for (const log of campaignLogs) {
        await this.processor.processEvent(log);
      }

      if (campaignLogs.length > 0) {
        console.log(`  ✓ Processed ${campaignLogs.length} event(s) for ${campaignAddr}`);
      }
    } catch (error) {
      // If contract doesn't exist or isn't a campaign, skip
      if (error.message.includes('invalid address') || error.message.includes('no code')) {
        return;
      }
      console.error(`Error indexing campaign ${campaignAddr}:`, error);
      throw error;
    }
  }

  async indexEthTransfers(campaignAddr, fromBlock, toBlock) {
    try {
      const { ethers } = require('ethers');
      const provider = this.blockchain.provider;

      // Get all transactions in the block range and check for transfers to campaign
      for (let blockNum = fromBlock; blockNum <= toBlock; blockNum++) {
        const block = await provider.getBlock(blockNum, false);
        if (!block || !block.transactions) continue;

        for (const txHash of block.transactions) {
          // Fetch full transaction details
          const tx = await provider.getTransaction(txHash);
          if (!tx) continue;

          const value = tx.value || 0n;

          // Check if transaction is to the campaign address
          if (tx.to && tx.to.toLowerCase() === campaignAddr.toLowerCase() && value > 0n) {
            console.log(`  ✓ Found ETH transfer: ${ethers.formatEther(value)} ETH to ${campaignAddr}`);

            // Convert wei to ETH to match what the contract emits
            // The contract emits donation amounts in ETH units, not wei
            const ethAmount = value / 10n ** 18n; // Convert from wei to ETH

            // Create a synthetic donation event
            const syntheticEvent = {
              txHash: tx.hash,
              logIndex: 0,
              blockNumber: blockNum,
              address: campaignAddr,
              eventName: 'DonationReceived',
              args: {
                donor: tx.from,
                amount: ethAmount.toString() // Store as ETH units
              }
            };

            // Process as if it were a real event
            await this.processor.processEvent(syntheticEvent);
          }
        }
      }
    } catch (error) {
      console.error(`Error indexing ETH transfers for ${campaignAddr}:`, error);
      // Don't throw - just log and continue
    }
  }

  async stop() {
    console.log('Stopping indexer...');
    this.isRunning = false;
  }

  async close() {
    await this.stop();
    await this.processor.close();
    await this.db.close();
  }
}

module.exports = Indexer;

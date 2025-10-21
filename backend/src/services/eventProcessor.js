const Database = require('../models/database');
const BlockchainService = require('./blockchainService');
const config = require('../../config');

class EventProcessor {
  constructor() {
    this.db = new Database();
    this.blockchain = new BlockchainService();
    this.isProcessing = false;
  }

  async initialize() {
    await this.db.initialize();
  }

  async processEvent(eventLog) {
    try {
      await this.db.beginTransaction();

      // Store raw event log
      await this.storeEventLog(eventLog);

      // Process specific event type
      switch (eventLog.eventName) {
        case 'CampaignCreated':
          await this.processCampaignCreated(eventLog);
          break;
        case 'DonationReceived':
          await this.processDonationReceived(eventLog);
          break;
        case 'MilestoneAdded':
          await this.processMilestoneAdded(eventLog);
          break;
        case 'MilestoneProposed':
          await this.processMilestoneProposed(eventLog);
          break;
        case 'MilestoneAccepted':
          await this.processMilestoneAccepted(eventLog);
          break;
        case 'MilestoneRejected':
          await this.processMilestoneRejected(eventLog);
          break;
        case 'FundsReleased':
          await this.processFundsReleased(eventLog);
          break;
        case 'FundsReturned':
          await this.processFundsReturned(eventLog);
          break;
        default:
          console.warn(`Unknown event type: ${eventLog.eventName}`);
      }

      await this.db.commit();
      console.log(`Processed event: ${eventLog.eventName} in tx ${eventLog.txHash}`);
    } catch (error) {
      await this.db.rollback();
      console.error(`Error processing event ${eventLog.eventName}:`, error);
      throw error;
    }
  }

  async storeEventLog(eventLog) {
    await this.db.run(
      `INSERT OR REPLACE INTO event_log
       (tx_hash, log_index, block_number, address, event_name, args_json, chain_id, finalized)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        eventLog.txHash,
        eventLog.logIndex,
        eventLog.blockNumber,
        eventLog.address,
        eventLog.eventName,
        JSON.stringify(eventLog.args),
        config.blockchain.chainId,
        false
      ]
    );
  }

  async processCampaignCreated(eventLog) {
    const { organizer, campaign, name, deadline, milestones, verifiers } = eventLog.args;

    // Insert campaign
    await this.db.run(
      `INSERT OR REPLACE INTO campaigns
       (addr, organizer, name, deadline, milestones_json, created_block, chain_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        campaign.toLowerCase(),
        organizer.toLowerCase(),
        name,
        parseInt(deadline),
        JSON.stringify(milestones),
        eventLog.blockNumber,
        config.blockchain.chainId
      ]
    );

    // Insert verifiers if provided
    if (verifiers && verifiers.length > 0) {
      for (const verifier of verifiers) {
        await this.db.run(
          `INSERT OR REPLACE INTO verifiers (campaign_addr, verifier_addr) VALUES (?, ?)`,
          [campaign.toLowerCase(), verifier.toLowerCase()]
        );
      }
    }

    // Initialize milestones tracking
    for (let i = 0; i < milestones.length; i++) {
      await this.db.run(
        `INSERT OR REPLACE INTO milestones (campaign_addr, idx, target_amount, status) VALUES (?, ?, ?, ?)`,
        [campaign.toLowerCase(), i, milestones[i], 'Pending']
      );
    }

    // Initialize aggregates
    await this.db.run(
      `INSERT OR REPLACE INTO aggregates
       (campaign_addr, total_raised, current_proposal, donor_count)
       VALUES (?, ?, ?, ?)`,
      [campaign.toLowerCase(), '0', '0', 0]
    );
  }

  async processDonationReceived(eventLog) {
    const { donor, amount } = eventLog.args;
    const campaignAddr = eventLog.address.toLowerCase();

    // Insert donation
    await this.db.run(
      `INSERT OR REPLACE INTO donations
       (tx_hash, log_index, campaign_addr, donor, amount, block_number, chain_id, finalized)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        eventLog.txHash,
        eventLog.logIndex,
        campaignAddr,
        donor.toLowerCase(),
        amount,
        eventLog.blockNumber,
        config.blockchain.chainId,
        false
      ]
    );

    // Update aggregates
    await this.updateAggregates(campaignAddr);
  }

  async processMilestoneProposed(eventLog) {
    const { milestone } = eventLog.args;
    const campaignAddr = eventLog.address.toLowerCase();

    // Update current proposal in aggregates
    await this.db.run(
      `UPDATE aggregates
       SET current_proposal = ?
       WHERE campaign_addr = ?`,
      [milestone, campaignAddr]
    );
  }

  async processMilestoneAccepted(eventLog) {
    const campaignAddr = eventLog.address.toLowerCase();

    // The accepted milestone will trigger a MilestoneAdded event
    // So we just need to clear the current proposal here
    // The actual milestone will be added by processMilestoneAdded

    // Clear current proposal
    await this.db.run(
      `UPDATE aggregates SET current_proposal = '0' WHERE campaign_addr = ?`,
      [campaignAddr]
    );
  }

  async processMilestoneAdded(eventLog) {
    const { milestone, index } = eventLog.args;
    const campaignAddr = eventLog.address.toLowerCase();

    // Insert or update milestone tracking
    // If this was from a proposal acceptance, it will already have 'Accepted' status
    // Otherwise it's a new milestone being added
    const existingMilestone = await this.db.get(
      `SELECT status FROM milestones WHERE campaign_addr = ? AND idx = ?`,
      [campaignAddr, parseInt(index)]
    );

    if (existingMilestone) {
      // Update the target amount but keep the status
      await this.db.run(
        `UPDATE milestones SET target_amount = ? WHERE campaign_addr = ? AND idx = ?`,
        [milestone, campaignAddr, parseInt(index)]
      );
    } else {
      // New milestone
      await this.db.run(
        `INSERT INTO milestones (campaign_addr, idx, target_amount, status) VALUES (?, ?, ?, ?)`,
        [campaignAddr, parseInt(index), milestone, 'Pending']
      );
    }
  }

  async processMilestoneRejected(eventLog) {
    const campaignAddr = eventLog.address.toLowerCase();

    // Just clear the current proposal
    await this.db.run(
      `UPDATE aggregates SET current_proposal = '0' WHERE campaign_addr = ?`,
      [campaignAddr]
    );
  }

  async processFundsReleased(eventLog) {
    const { amount, milestoneIndex } = eventLog.args;
    const campaignAddr = eventLog.address.toLowerCase();

    // Update milestone status to Released
    await this.db.run(
      `UPDATE milestones
       SET status = 'Released', amount_released = ?, released_at = CURRENT_TIMESTAMP
       WHERE campaign_addr = ? AND idx = ?`,
      [amount, campaignAddr, milestoneIndex]
    );

    // Update aggregates
    await this.updateAggregates(campaignAddr);
  }

  async processFundsReturned(eventLog) {
    const { donor, amount } = eventLog.args;
    const campaignAddr = eventLog.address.toLowerCase();

    // Insert refund record
    await this.db.run(
      `INSERT OR REPLACE INTO refunds
       (tx_hash, log_index, campaign_addr, donor, amount, block_number, chain_id, finalized)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        eventLog.txHash,
        eventLog.logIndex,
        campaignAddr,
        donor.toLowerCase(),
        amount,
        eventLog.blockNumber,
        config.blockchain.chainId,
        false
      ]
    );

    // Update aggregates
    await this.updateAggregates(campaignAddr);
  }

  async updateAggregates(campaignAddr) {
    // Calculate total raised
    const totalRaisedResult = await this.db.get(
      `SELECT COALESCE(SUM(CAST(amount AS INTEGER)), 0) as total
       FROM donations
       WHERE campaign_addr = ? AND finalized = true`,
      [campaignAddr]
    );

    // Calculate total released
    const totalReleasedResult = await this.db.get(
      `SELECT COALESCE(SUM(CAST(amount_released AS INTEGER)), 0) as total
       FROM milestones
       WHERE campaign_addr = ? AND status = 'Released'`,
      [campaignAddr]
    );

    // Calculate donor count
    const donorCountResult = await this.db.get(
      `SELECT COUNT(DISTINCT donor) as count
       FROM donations
       WHERE campaign_addr = ? AND finalized = true`,
      [campaignAddr]
    );

    // Update aggregates
    await this.db.run(
      `UPDATE aggregates
       SET total_raised = ?, total_released = ?, donor_count = ?, updated_at = CURRENT_TIMESTAMP
       WHERE campaign_addr = ?`,
      [
        totalRaisedResult.total.toString(),
        totalReleasedResult.total.toString(),
        donorCountResult.count,
        campaignAddr
      ]
    );
  }

  async finalizeEvents(blockNumber) {
    const confirmationBlock = blockNumber - config.blockchain.confirmations;

    // Finalize event logs
    await this.db.run(
      `UPDATE event_log
       SET finalized = true
       WHERE block_number <= ? AND finalized = false`,
      [confirmationBlock]
    );

    // Finalize donations
    await this.db.run(
      `UPDATE donations
       SET finalized = true
       WHERE block_number <= ? AND finalized = false`,
      [confirmationBlock]
    );

    // Finalize refunds
    await this.db.run(
      `UPDATE refunds
       SET finalized = true
       WHERE block_number <= ? AND finalized = false`,
      [confirmationBlock]
    );

    // Update aggregates for affected campaigns
    const affectedCampaigns = await this.db.all(
      `SELECT DISTINCT campaign_addr
       FROM donations
       WHERE block_number <= ? AND block_number > ?`,
      [confirmationBlock, confirmationBlock - 100] // Update last 100 blocks worth
    );

    for (const { campaign_addr } of affectedCampaigns) {
      await this.updateAggregates(campaign_addr);
    }

    console.log(`Finalized events up to block ${confirmationBlock}`);
  }

  async handleReorg(fromBlock) {
    console.log(`Handling reorg from block ${fromBlock}`);

    await this.db.beginTransaction();
    try {
      // Delete all non-finalized events from the reorg point
      await this.db.run(
        `DELETE FROM event_log WHERE block_number >= ? AND finalized = false`,
        [fromBlock]
      );

      await this.db.run(
        `DELETE FROM donations WHERE block_number >= ? AND finalized = false`,
        [fromBlock]
      );

      await this.db.run(
        `DELETE FROM refunds WHERE block_number >= ? AND finalized = false`,
        [fromBlock]
      );

      // Reset milestone states that might have been affected
      await this.db.run(
        `UPDATE milestones
         SET status = 'Pending', approved_at = NULL, released_at = NULL, amount_released = '0'
         WHERE campaign_addr IN (
           SELECT DISTINCT address FROM event_log
           WHERE block_number >= ? AND finalized = false
         )`,
        [fromBlock]
      );

      await this.db.commit();
      console.log(`Cleaned up reorg data from block ${fromBlock}`);
    } catch (error) {
      await this.db.rollback();
      throw error;
    }
  }

  async close() {
    await this.db.close();
  }
}

module.exports = EventProcessor;
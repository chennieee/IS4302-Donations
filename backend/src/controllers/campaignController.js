const Database = require('../models/database');
const Joi = require('joi');

class CampaignController {
  constructor() {
    this.db = new Database();
  }

  async initialize() {
    await this.db.initialize();
  }

  // GET /campaigns
  async getCampaigns(req, res) {
    try {
      const { error, value } = this.validateCampaignsQuery(req.query);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { organizer, verifier, status, limit, cursor } = value;

      let query = `
        SELECT c.*, a.total_raised, a.total_released, a.donor_count
        FROM campaigns c
        LEFT JOIN aggregates a ON c.addr = a.campaign_addr
        WHERE 1=1
      `;
      const params = [];

      // Add filters
      if (organizer) {
        query += ' AND c.organizer = ?';
        params.push(organizer.toLowerCase());
      }

      if (verifier) {
        query += ' AND c.verifier = ?';
        params.push(verifier.toLowerCase());
      }

      // Cursor pagination
      if (cursor) {
        const decodedCursor = this.decodeCursor(cursor);
        if (decodedCursor) {
          query += ' AND (c.created_block < ? OR (c.created_block = ? AND c.addr > ?))';
          params.push(decodedCursor.blockNumber, decodedCursor.blockNumber, decodedCursor.address);
        }
      }

      // Status filter (requires checking milestone states)
      if (status) {
        switch (status) {
          case 'active':
            query += ' AND c.deadline > unixepoch() AND NOT EXISTS (SELECT 1 FROM milestones WHERE campaign_addr = c.addr AND status = "Released")';
            break;
          case 'completed':
            query += ' AND EXISTS (SELECT 1 FROM milestones WHERE campaign_addr = c.addr AND status = "Released")';
            break;
          case 'expired':
            query += ' AND c.deadline <= unixepoch() AND NOT EXISTS (SELECT 1 FROM milestones WHERE campaign_addr = c.addr AND status = "Released")';
            break;
        }
      }

      query += ' ORDER BY c.created_block DESC, c.addr ASC LIMIT ?';
      params.push(limit);

      const campaigns = await this.db.all(query, params);

      // Generate next cursor
      let nextCursor = null;
      if (campaigns.length === limit) {
        const lastCampaign = campaigns[campaigns.length - 1];
        nextCursor = this.encodeCursor({
          blockNumber: lastCampaign.created_block,
          address: lastCampaign.addr
        });
      }

      // Format response
      const formattedCampaigns = campaigns.map(campaign => ({
        address: campaign.addr,
        organizer: campaign.organizer,
        verifier: campaign.verifier,
        token: campaign.token,
        trancheBps: JSON.parse(campaign.tranche_bps_json),
        deadline: campaign.deadline,
        ipfsCid: campaign.ipfs_cid,
        createdBlock: campaign.created_block,
        totalRaised: campaign.total_raised || '0',
        totalReleased: campaign.total_released || '0',
        donorCount: campaign.donor_count || 0,
        createdAt: campaign.created_at
      }));

      res.json({
        campaigns: formattedCampaigns,
        nextCursor,
        hasMore: nextCursor !== null
      });
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /campaign/:address
  async getCampaign(req, res) {
    try {
      const { address } = req.params;

      if (!this.isValidAddress(address)) {
        return res.status(400).json({ error: 'Invalid campaign address' });
      }

      const campaign = await this.db.get(`
        SELECT c.*, a.total_raised, a.total_released, a.donor_count
        FROM campaigns c
        LEFT JOIN aggregates a ON c.addr = a.campaign_addr
        WHERE c.addr = ?
      `, [address.toLowerCase()]);

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      // Get milestone states
      const milestones = await this.db.all(`
        SELECT idx, status, approved_at, released_at, amount_released
        FROM milestones
        WHERE campaign_addr = ?
        ORDER BY idx ASC
      `, [address.toLowerCase()]);

      // Get recent activity (last 10 events)
      const recentActivity = await this.db.all(`
        SELECT event_name, args_json, block_number, tx_hash, created_at
        FROM event_log
        WHERE address = ? AND finalized = true
        ORDER BY block_number DESC, log_index DESC
        LIMIT 10
      `, [address.toLowerCase()]);

      const response = {
        address: campaign.addr,
        organizer: campaign.organizer,
        verifier: campaign.verifier,
        token: campaign.token,
        trancheBps: JSON.parse(campaign.tranche_bps_json),
        deadline: campaign.deadline,
        ipfsCid: campaign.ipfs_cid,
        createdBlock: campaign.created_block,
        totalRaised: campaign.total_raised || '0',
        totalReleased: campaign.total_released || '0',
        donorCount: campaign.donor_count || 0,
        createdAt: campaign.created_at,
        milestones: milestones.map(m => ({
          index: m.idx,
          status: m.status,
          approvedAt: m.approved_at,
          releasedAt: m.released_at,
          amountReleased: m.amount_released
        })),
        recentActivity: recentActivity.map(activity => ({
          eventName: activity.event_name,
          args: JSON.parse(activity.args_json),
          blockNumber: activity.block_number,
          txHash: activity.tx_hash,
          timestamp: activity.created_at
        }))
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching campaign:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /campaign/:address/events
  async getCampaignEvents(req, res) {
    try {
      const { address } = req.params;
      const { error, value } = this.validateEventsQuery(req.query);

      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      if (!this.isValidAddress(address)) {
        return res.status(400).json({ error: 'Invalid campaign address' });
      }

      const { limit, cursor } = value;

      let query = `
        SELECT event_name, args_json, block_number, tx_hash, log_index, created_at
        FROM event_log
        WHERE address = ? AND finalized = true
      `;
      const params = [address.toLowerCase()];

      // Cursor pagination
      if (cursor) {
        const decodedCursor = this.decodeCursor(cursor);
        if (decodedCursor) {
          query += ' AND (block_number < ? OR (block_number = ? AND log_index < ?))';
          params.push(decodedCursor.blockNumber, decodedCursor.blockNumber, decodedCursor.logIndex);
        }
      }

      query += ' ORDER BY block_number DESC, log_index DESC LIMIT ?';
      params.push(limit);

      const events = await this.db.all(query, params);

      // Generate next cursor
      let nextCursor = null;
      if (events.length === limit) {
        const lastEvent = events[events.length - 1];
        nextCursor = this.encodeCursor({
          blockNumber: lastEvent.block_number,
          logIndex: lastEvent.log_index
        });
      }

      const formattedEvents = events.map(event => ({
        eventName: event.event_name,
        args: JSON.parse(event.args_json),
        blockNumber: event.block_number,
        txHash: event.tx_hash,
        logIndex: event.log_index,
        timestamp: event.created_at
      }));

      res.json({
        events: formattedEvents,
        nextCursor,
        hasMore: nextCursor !== null
      });
    } catch (error) {
      console.error('Error fetching campaign events:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  validateCampaignsQuery(query) {
    const schema = Joi.object({
      organizer: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/),
      verifier: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/),
      status: Joi.string().valid('active', 'completed', 'expired'),
      limit: Joi.number().integer().min(1).max(100).default(20),
      cursor: Joi.string()
    });

    return schema.validate(query);
  }

  validateEventsQuery(query) {
    const schema = Joi.object({
      limit: Joi.number().integer().min(1).max(100).default(20),
      cursor: Joi.string()
    });

    return schema.validate(query);
  }

  encodeCursor(data) {
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }

  decodeCursor(cursor) {
    try {
      return JSON.parse(Buffer.from(cursor, 'base64').toString());
    } catch {
      return null;
    }
  }

  isValidAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}

module.exports = CampaignController;
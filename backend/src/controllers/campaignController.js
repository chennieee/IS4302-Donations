const Database = require('../models/database');
const Joi = require('joi');

class CampaignController {
  constructor() {
    this.db = new Database();
  }

  async initialize() {
    await this.db.initialize();
    await this.db.createTables();
  }

  // GET all campaigns --> /campaigns
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
        query += ' AND EXISTS (SELECT 1 FROM verifiers v WHERE v.campaign_addr = c.addr AND v.verifier_addr = ?)';
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
        name: campaign.name,
        description: campaign.description || '',
        image: campaign.image || null,
        milestones: JSON.parse(campaign.milestones_json),
        deadline: campaign.deadline,
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

  // GET 1 campaign --> /campaign/:address
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

      // Get verifiers
      const verifiers = await this.db.all(`
        SELECT verifier_addr
        FROM verifiers
        WHERE campaign_addr = ?
      `, [address.toLowerCase()]);

      // Get milestone states
      const milestones = await this.db.all(`
        SELECT idx, target_amount, status, accepted_at, released_at, amount_released
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
        verifiers: verifiers.map(v => v.verifier_addr),
        name: campaign.name,
        description: campaign.description || '',
        image: campaign.image || null,
        deadline: campaign.deadline,
        createdBlock: campaign.created_block,
        totalRaised: campaign.total_raised || '0',
        totalReleased: campaign.total_released || '0',
        donorCount: campaign.donor_count || 0,
        createdAt: campaign.created_at,
        milestones: milestones.map(m => ({
          index: m.idx,
          targetAmount: m.target_amount,
          status: m.status,
          acceptedAt: m.accepted_at,
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

  // GET 1 campaign's events --> /campaign/:address/events
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

  // POST 1 campaign (Create a new campaign) --> /campaigns
  async createCampaign(req, res) {
    try {
      const { error, value } = this.validateCreateCampaign(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { name, description, image, organizer, deadline, milestones } = value;

      // Require user profile (username + wallet address) to create campaign
      const organizerRow = await this.db.get(
        `SELECT username FROM users WHERE wallet_addr = ?`, [organizer.toLowerCase()]
      );
      if (!organizerRow || !organizerRow.username) {
        return res.status(400).json({ error: 'Complete profile (username + wallet address) required'});
      }

      // Generate a mock campaign address (in production, this would come from blockchain)
      const campaignAddress = '0x' + Math.random().toString(16).substring(2, 42).padEnd(40, '0');
      const createdBlock = Math.floor(Date.now() / 1000);

      // First, try to add description and image columns if they don't exist (migration)
      try {
        await this.db.run(`ALTER TABLE campaigns ADD COLUMN description TEXT`);
      } catch (e) {
        // Column already exists, ignore error
      }
      try {
        await this.db.run(`ALTER TABLE campaigns ADD COLUMN image TEXT`);
      } catch (e) {
        // Column already exists, ignore error
      }

      // Insert campaign into database
      await this.db.run(`
        INSERT INTO campaigns (addr, organizer, name, description, image, milestones_json, deadline, created_block, created_at, chain_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        campaignAddress.toLowerCase(),
        organizer.toLowerCase(),
        name,
        description || '',
        image || null,
        JSON.stringify(milestones),
        deadline,
        createdBlock,
        new Date().toISOString(),
        Number(process.env.CHAIN_ID || 31337) // Default chain ID (local hardhat network)
      ]);

      // Insert milestones
      for (let i = 0; i < milestones.length; i++) {
        await this.db.run(`
          INSERT INTO milestones (campaign_addr, idx, target_amount, status)
          VALUES (?, ?, ?, ?)
        `, [
          campaignAddress.toLowerCase(),
          i,
          milestones[i].toString(),
          'Pending'
        ]);
      }

      // Initialize aggregates
      await this.db.run(`
        INSERT INTO aggregates (campaign_addr, total_raised, total_released, donor_count)
        VALUES (?, ?, ?, ?)
      `, [
        campaignAddress.toLowerCase(),
        '0',
        '0',
        0
      ]);

      res.status(201).json({
        success: true,
        campaign: {
          address: campaignAddress,
          organizer,
          name,
          milestones,
          deadline,
          createdBlock
        }
      });
    } catch (error) {
      console.error('Error creating campaign:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  validateCreateCampaign(data) {
    const schema = Joi.object({
      name: Joi.string().min(3).max(200).required(),
      description: Joi.string().max(1000).optional().allow('', null).default(''),
      image: Joi.string().optional().allow(null, ''),
      organizer: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
      deadline: Joi.number().integer().min(Math.floor(Date.now() / 1000)).required(),
      milestones: Joi.array().items(
        Joi.alternatives().try(
          Joi.number().positive(),
          Joi.string().pattern(/^[0-9]+$/)
        )
      ).min(1).max(10).required()
    });
    return schema.validate(data);
  }

  // POST 1 donation --> /campaigns/:address/donate
  async recordDonation(req, res) {
    try {
      const addr = (req.params.address || '').toLowerCase();
      if (!this.isValidAddress(addr)) {
        return res.status(400).json({ error: 'Invalid campaign address' });
      }

      const { error, value } = this.validateDonationPayload(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const { txHash, logIndex, donor, amount, blockNumber, chainId, finalized } = value;

      await this.db.beginTransaction();

      // Ensure campaign exists
      const campaign = await this.db.get(
        `SELECT addr FROM campaigns WHERE addr = ?`, [addr]
      );
      if (!campaign) {
        await this.db.rollback();
        return res.status(404).json({ error: 'Campaign not found' });
      }

      // Donor must have complete profile (username + wallet address)
      const donorRow = await this.db.get(
        `SELECT username FROM users WHERE wallet_addr = ?`,
        [donor.toLowerCase()]
      );
      if (!donorRow || !donorRow.username) {
        await this.db.rollback();
        return res.status(400).json({ error: 'Complete profile (username + wallet address) required' });
      }

      // Upsert donor into users (username may be set later by PUT /api/users/:address)
      await this.db.run(
        `INSERT INTO users (wallet_addr, username, avatar_url, created_at, updated_at)
        VALUES (?, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(wallet_addr) DO NOTHING`,
        [donor.toLowerCase()]
      );

      // Insert donation
      await this.db.run(
        `INSERT INTO donations (tx_hash, log_index, campaign_addr, donor, amount,
                                block_number, chain_id, finalized)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(tx_hash, log_index) DO UPDATE SET
          finalized = excluded.finalized`,
        [txHash, logIndex, addr, donor.toLowerCase(), amount, blockNumber, chainId, finalized ? 1 : 0]
      );

      // Event log for recent activity panel
      await this.db.run(
        `INSERT INTO event_log (tx_hash, log_index, block_number, address, event_name, args_json, chain_id, finalized)
        VALUES (?, ?, ?, ?, 'Donation', ?, ?, ?)
        ON CONFLICT(tx_hash, log_index) DO UPDATE SET finalized = excluded.finalized`,
        [
          txHash,
          logIndex,
          blockNumber,
          addr,
          JSON.stringify({ donor: donor.toLowerCase(), amount }),
          chainId,
          finalized ? 1 : 0
        ]
      );

      // Recompute aggregates (total and distinct donors)
      const totals = await this.db.get(
        `SELECT
            COALESCE((SELECT SUM(CAST(amount AS INTEGER)) FROM donations WHERE campaign_addr = ?), 0) AS total_raised,
            COALESCE((SELECT COUNT(DISTINCT donor) FROM donations WHERE campaign_addr = ?), 0) AS donor_count`,
        [addr, addr]
      );

      await this.db.run(
        `INSERT INTO aggregates (campaign_addr, total_raised, donor_count, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(campaign_addr) DO UPDATE SET
          total_raised = excluded.total_raised,
          donor_count = excluded.donor_count,
          updated_at = CURRENT_TIMESTAMP`,
        [addr, String(totals.total_raised), totals.donor_count]
      );

      await this.db.commit();

      return res.status(200).json({
        success: true,
        campaign: addr,
        updated: {
          totalRaised: String(totals.total_raised),
          donorCount: totals.donor_count
        }
      });
    } catch (e) {
      console.error('recordDonation error:', e);
      try { await this.db.rollback(); } catch {}
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  validateDonationPayload(body) {
    const schema = Joi.object({
      txHash: Joi.string().pattern(/^0x([A-Fa-f0-9]{64})$/).required(),
      logIndex: Joi.number().integer().min(0).required(),
      donor: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
      amount: Joi.string().pattern(/^[0-9]+$/).required(), // store as string (wei)
      blockNumber: Joi.number().integer().min(0).required(),
      chainId: Joi.number().integer().min(1).required(),
      finalized: Joi.boolean().default(true)
    });
    return schema.validate(body);
  }



}

module.exports = CampaignController;
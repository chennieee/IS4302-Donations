const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const config = require('../../config');

class Database {
  constructor() {
    this.db = null;
  }

  async initialize() {
    const dbPath = path.resolve(config.database.url);
    const dbDir = path.dirname(dbPath);

    // Ensure directory exists
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          resolve();
        }
      });
    });
  }

  async createTables() {
    // Event log table (raw blockchain events)
    const createEventLogTable = `
      CREATE TABLE IF NOT EXISTS event_log (
        tx_hash TEXT NOT NULL,
        log_index INTEGER NOT NULL,
        block_number INTEGER NOT NULL,
        address TEXT NOT NULL,
        event_name TEXT NOT NULL,
        args_json TEXT NOT NULL,
        chain_id INTEGER NOT NULL,
        finalized BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (tx_hash, log_index)
      )
    `;
    await this.run(createEventLogTable);

    // Campaigns table
    const createCampaignsTable = `
      CREATE TABLE IF NOT EXISTS campaigns (
        addr TEXT PRIMARY KEY,
        organizer TEXT NOT NULL,
        name TEXT NOT NULL,
        deadline INTEGER NOT NULL,
        milestones_json TEXT NOT NULL,
        created_block INTEGER NOT NULL,
        chain_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await this.run(createCampaignsTable);

    // Verifiers table (many-to-many relationship)
    const createVerifiersTable = `
      CREATE TABLE IF NOT EXISTS verifiers (
        campaign_addr TEXT NOT NULL,
        verifier_addr TEXT NOT NULL,
        PRIMARY KEY (campaign_addr, verifier_addr),
        FOREIGN KEY (campaign_addr) REFERENCES campaigns(addr)
      )
    `;
    await this.run(createVerifiersTable);

    // Milestones table
    const createMilestonesTable = `
      CREATE TABLE IF NOT EXISTS milestones (
        campaign_addr TEXT NOT NULL,
        idx INTEGER NOT NULL,
        target_amount TEXT NOT NULL,
        status TEXT NOT NULL,
        accepted_at DATETIME,
        released_at DATETIME,
        amount_released TEXT DEFAULT '0',
        PRIMARY KEY (campaign_addr, idx),
        FOREIGN KEY (campaign_addr) REFERENCES campaigns(addr)
      )
    `;
    await this.run(createMilestonesTable);

    // Donations table
    const createDonationsTable = `
      CREATE TABLE IF NOT EXISTS donations (
        tx_hash TEXT NOT NULL,
        log_index INTEGER NOT NULL,
        campaign_addr TEXT NOT NULL,
        donor TEXT NOT NULL,
        amount TEXT NOT NULL,
        block_number INTEGER NOT NULL,
        chain_id INTEGER NOT NULL,
        finalized BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (tx_hash, log_index),
        FOREIGN KEY (campaign_addr) REFERENCES campaigns(addr)
      )
    `;
    await this.run(createDonationsTable);

    // Refunds table
    const createRefundsTable = `
      CREATE TABLE IF NOT EXISTS refunds (
        tx_hash TEXT NOT NULL,
        log_index INTEGER NOT NULL,
        campaign_addr TEXT NOT NULL,
        donor TEXT NOT NULL,
        amount TEXT NOT NULL,
        block_number INTEGER NOT NULL,
        chain_id INTEGER NOT NULL,
        finalized BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (tx_hash, log_index),
        FOREIGN KEY (campaign_addr) REFERENCES campaigns(addr)
      )
    `;
    await this.run(createRefundsTable);

    // Aggregates table (for quick queries)
    const createAggregatesTable = `
      CREATE TABLE IF NOT EXISTS aggregates (
        campaign_addr TEXT PRIMARY KEY,
        total_raised TEXT DEFAULT '0',
        total_released TEXT DEFAULT '0',
        current_proposal TEXT DEFAULT '0',
        donor_count INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (campaign_addr) REFERENCES campaigns(addr)
      )
    `;
    await this.run(createAggregatesTable);

    // Indexer state table
    const createIndexerState = `
      CREATE TABLE IF NOT EXISTS indexer_state (
        id INTEGER PRIMARY KEY,
        last_processed_block INTEGER NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await this.run(createIndexerState);

    // Create indexes for better performance
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_event_log_address ON event_log(address)',
      'CREATE INDEX IF NOT EXISTS idx_event_log_block ON event_log(block_number)',
      'CREATE INDEX IF NOT EXISTS idx_event_log_name ON event_log(event_name)',
      'CREATE INDEX IF NOT EXISTS idx_campaigns_organizer ON campaigns(organizer)',
      'CREATE INDEX IF NOT EXISTS idx_verifiers_verifier ON verifiers(verifier_addr)',
      'CREATE INDEX IF NOT EXISTS idx_verifiers_campaign ON verifiers(campaign_addr)',
      'CREATE INDEX IF NOT EXISTS idx_donations_campaign ON donations(campaign_addr)',
      'CREATE INDEX IF NOT EXISTS idx_donations_donor ON donations(donor)',
      'CREATE INDEX IF NOT EXISTS idx_refunds_campaign ON refunds(campaign_addr)',
      'CREATE INDEX IF NOT EXISTS idx_refunds_donor ON refunds(donor)'
    ];

    for (const query of indexQueries) {
      await this.run(query);
    }
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async beginTransaction() {
    return this.run('BEGIN TRANSACTION');
  }

  async commit() {
    return this.run('COMMIT');
  }

  async rollback() {
    return this.run('ROLLBACK');
  }

  async close() {
    return new Promise((resolve) => {
      this.db.close(() => {
        console.log('Database connection closed');
        resolve();
      });
    });
  }

}

module.exports = Database;
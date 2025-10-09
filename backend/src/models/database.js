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
    // Only one table: events (denormalized)
    const createEventsTable = `
      CREATE TABLE IF NOT EXISTS events (
        tx_hash TEXT NOT NULL,
        log_index INTEGER NOT NULL,
        campaign_addr TEXT NOT NULL,
        event_name TEXT NOT NULL,
        args_json TEXT NOT NULL,
        block_number INTEGER NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        finalized BOOLEAN DEFAULT TRUE,
        PRIMARY KEY (tx_hash, log_index)
      )
    `;

    await this.run(createEventsTable);

    // Create indexes for better performance
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_events_campaign ON events(campaign_addr)',
      'CREATE INDEX IF NOT EXISTS idx_events_block ON events(block_number)',
      'CREATE INDEX IF NOT EXISTS idx_events_name ON events(event_name)'
    ];

    for (const query of indexQueries) {
      await this.run(query);
    }

    // Indexer state table
    const createIndexerState = `
      CREATE TABLE IF NOT EXISTS indexer_state (
        id INTEGER PRIMARY KEY,
        last_processed_block INTEGER NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await this.run(createIndexerState);
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
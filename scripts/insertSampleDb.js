/*
  Inserts sample data into the SQLite DB used by the backend.
  Run from project root (PowerShell):
    node .\scripts\insertSampleDb.js
  Or set DATABASE_URL to point to your DB file:
    $env:DATABASE_URL="C:\path\to\donations.db"; node .\scripts\insertSampleDb.js
*/
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = process.env.DATABASE_URL ||
  path.join(__dirname, '..', 'backend', 'data', 'donations.db');

// ensure dir exists
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

(async () => {
  try {
    console.log('Opening DB:', dbPath);

    await run('BEGIN TRANSACTION');

    // Sample campaign
    const campaignAddr = '0x1000000000000000000000000000000000001001';
    const organizer = '0x2000000000000000000000000000000000002002';
    const deadline = Math.floor(Date.now() / 1000) + 30 * 24 * 3600; // 30 days
    const milestonesJson = JSON.stringify([
      { title: 'Phase 1', target_amount: '500000000000000000', status: 'open' },
      { title: 'Phase 2', target_amount: '500000000000000000', status: 'locked' }
    ]);

    await run(
      `INSERT OR REPLACE INTO campaigns
        (addr, organizer, name, deadline, milestones_json, created_block, chain_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [campaignAddr, organizer, 'Sample Campaign Alpha', deadline, milestonesJson, 1, 31337]
    );

    // Verifiers
    await run(
      `INSERT OR REPLACE INTO verifiers (campaign_addr, verifier_addr) VALUES (?, ?)`,
      [campaignAddr, '0x3000000000000000000000000000000000003003']
    );
    await run(
      `INSERT OR REPLACE INTO verifiers (campaign_addr, verifier_addr) VALUES (?, ?)`,
      [campaignAddr, '0x3000000000000000000000000000000000003004']
    );

    // Milestones rows (match milestones_json above)
    await run(
      `INSERT OR REPLACE INTO milestones
        (campaign_addr, idx, target_amount, status, accepted_at, released_at, amount_released)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [campaignAddr, 0, '500000000000000000', 'open', null, null, '0']
    );
    await run(
      `INSERT OR REPLACE INTO milestones
        (campaign_addr, idx, target_amount, status, accepted_at, released_at, amount_released)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [campaignAddr, 1, '500000000000000000', 'locked', null, null, '0']
    );

    // Donations (one sample donation)
    await run(
      `INSERT OR REPLACE INTO donations
        (tx_hash, log_index, campaign_addr, donor, amount, block_number, chain_id, finalized)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['0xaaaa000000000000000000000000000000000000000000000000000000000001', 0, campaignAddr, '0x4000000000000000000000000000000000004004', '250000000000000000', 2, 31337, 1]
    );

    // Refunds (none for this campaign) -- optional example entry
    await run(
      `INSERT OR REPLACE INTO refunds
        (tx_hash, log_index, campaign_addr, donor, amount, block_number, chain_id, finalized)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['0xbbb00000000000000000000000000000000000000000000000000000000000002', 0, campaignAddr, '0x5000000000000000000000000000000000005005', '100000000000000000', 3, 31337, 0]
    );

    // Aggregates
    await run(
      `INSERT OR REPLACE INTO aggregates
        (campaign_addr, total_raised, total_released, current_proposal, donor_count)
       VALUES (?, ?, ?, ?, ?)`,
      [campaignAddr, '250000000000000000', '0', '0', 1]
    );

    // Event log (sample CampaignCreated event the indexer could use)
    const argsJson = JSON.stringify({
      organizer,
      name: 'Sample Campaign Alpha',
      campaign: campaignAddr
    });
    await run(
      `INSERT OR REPLACE INTO event_log
        (tx_hash, log_index, block_number, address, event_name, args_json, chain_id, finalized)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['0xeeee0000000000000000000000000000000000000000000000000000000000ee', 0, 1, '0xFActory000000000000000000000000000000fAc', 'CampaignCreated', argsJson, 31337, 1]
    );

    // Indexer state
    await run(
      `INSERT OR REPLACE INTO indexer_state (id, last_processed_block) VALUES (?, ?)`,
      [1, 3]
    );

    await run('COMMIT');
    console.log('Sample data inserted successfully.');
  } catch (err) {
    console.error('Error inserting sample data:', err);
    try { await run('ROLLBACK'); } catch(e) {}
  } finally {
    db.close(() => { console.log('DB closed'); });
  }
})();
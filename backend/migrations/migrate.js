const Database = require('../src/models/database');

async function migrate() {
  const db = new Database();

  try {
    await db.initialize();
    console.log('Starting database migration...');

    await db.createTables();
    console.log('Database tables created successfully');

    // Insert initial indexer state if not exists
    const existingState = await db.get('SELECT * FROM indexer_state WHERE id = 1');
    if (!existingState) {
      const config = require('../config');
      await db.run(
        'INSERT INTO indexer_state (id, last_processed_block) VALUES (?, ?)',
        [1, config.blockchain.startBlock - 1]
      );
      console.log('Initial indexer state created');
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

if (require.main === module) {
  migrate();
}

module.exports = migrate;
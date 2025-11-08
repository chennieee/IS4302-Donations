require('dotenv').config();
const Indexer = require('../src/services/indexer');

async function main() {
  const indexer = new Indexer();

  try {
    console.log('Initializing indexer...');
    await indexer.initialize();

    console.log('Starting indexer (press Ctrl+C to stop)...');
    await indexer.start();

    // Keep running
    process.on('SIGINT', async () => {
      console.log('\nShutting down indexer...');
      await indexer.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('Error running indexer:', error);
    process.exit(1);
  }
}

main();

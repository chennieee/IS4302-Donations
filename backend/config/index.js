const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT) || 3001,

  blockchain: {
    rpcUrl: process.env.RPC_URL,
    chainId: parseInt(process.env.CHAIN_ID),
    factoryAddress: process.env.FACTORY_ADDRESS,
    startBlock: parseInt(process.env.START_BLOCK) || 0,
    confirmations: parseInt(process.env.CONFIRMATIONS) || 0,
    pollInterval: parseInt(process.env.POLL_INTERVAL) || 5000,
  },

  pinata: {
    apiKey: process.env.PINATA_API_KEY,
    secretApiKey: process.env.PINATA_SECRET_API_KEY,
  },

  database: {
    url: process.env.DATABASE_URL || './data/donations.db',
  },
};
const Database = require('../models/database');
const BlockchainService = require('../services/blockchainService');
const PinataService = require('../services/pinataService');
const config = require('../../config');

class HealthController {
  constructor() {
    this.db = new Database();
    this.blockchain = new BlockchainService();
    this.pinataService = new PinataService();
  }

  async initialize() {
    await this.db.initialize();
  }

  // GET /health
  async getHealth(req, res) {
    const startTime = Date.now();
    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: config.env,
      services: {},
      indexer: {},
      errors: []
    };

    try {
      // Check database
      await this.checkDatabase(status);

      // Check blockchain RPC
      await this.checkBlockchain(status);

      // Check Pinata
      await this.checkPinata(status);

      // Check indexer status
      await this.checkIndexer(status);

      // Determine overall status
      const hasErrors = status.errors.length > 0;
      const hasUnhealthyServices = Object.values(status.services).some(service => !service.healthy);

      if (hasErrors || hasUnhealthyServices) {
        status.status = 'unhealthy';
        res.status(503);
      } else {
        status.status = 'healthy';
        res.status(200);
      }

      status.responseTime = Date.now() - startTime;
      res.json(status);
    } catch (error) {
      status.status = 'error';
      status.errors.push({
        service: 'general',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      status.responseTime = Date.now() - startTime;

      res.status(500).json(status);
    }
  }

  async checkDatabase(status) {
    try {
      // Test database connection
      const testQuery = await this.db.get('SELECT 1 as test');

      if (testQuery && testQuery.test === 1) {
        status.services.database = {
          healthy: true,
          message: 'Connected',
          url: config.database.url
        };
      } else {
        throw new Error('Database test query failed');
      }

      // Get database stats
      const stats = await this.getDatabaseStats();
      status.services.database.stats = stats;
    } catch (error) {
      status.services.database = {
        healthy: false,
        message: error.message,
        url: config.database.url
      };
      status.errors.push({
        service: 'database',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  async checkBlockchain(status) {
    try {
      // Test RPC connection
      const currentBlock = await this.blockchain.getCurrentBlock();

      if (typeof currentBlock === 'number' && currentBlock > 0) {
        status.services.blockchain = {
          healthy: true,
          message: 'Connected',
          currentBlock,
          chainId: config.blockchain.chainId,
          rpcUrl: config.blockchain.rpcUrl.replace(/\/[^\/]+$/, '/***') // Hide API key
        };
      } else {
        throw new Error('Invalid block number received');
      }

      // Check if factory contract exists
      const factoryExists = await this.blockchain.isContractDeployed(config.blockchain.factoryAddress);
      status.services.blockchain.factoryDeployed = factoryExists;

      if (!factoryExists) {
        status.errors.push({
          service: 'blockchain',
          message: 'Factory contract not found at configured address',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      status.services.blockchain = {
        healthy: false,
        message: error.message,
        chainId: config.blockchain.chainId
      };
      status.errors.push({
        service: 'blockchain',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  async checkPinata(status) {
    try {
      // Test Pinata authentication
      await this.pinataService.testAuthentication();

      status.services.pinata = {
        healthy: true,
        message: 'Authenticated',
        endpoint: 'https://api.pinata.cloud'
      };

      // Get pin count (optional, might fail if quota exceeded)
      try {
        const pins = await this.pinataService.listPins({ pageLimit: 1 });
        status.services.pinata.totalPins = pins.count;
      } catch (listError) {
        // Non-critical error
        status.services.pinata.note = 'Could not fetch pin count';
      }
    } catch (error) {
      status.services.pinata = {
        healthy: false,
        message: error.message
      };
      status.errors.push({
        service: 'pinata',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  async checkIndexer(status) {
    try {
      // Get indexer state
      const indexerState = await this.db.get('SELECT * FROM indexer_state WHERE id = 1');

      if (indexerState) {
        const currentBlock = status.services.blockchain?.currentBlock;
        const blocksBehind = currentBlock ? currentBlock - indexerState.last_processed_block : null;

        status.indexer = {
          lastProcessedBlock: indexerState.last_processed_block,
          currentBlock,
          blocksBehind,
          lastUpdated: indexerState.updated_at,
          healthy: blocksBehind !== null && blocksBehind < 100 // Consider unhealthy if more than 100 blocks behind
        };

        if (blocksBehind !== null && blocksBehind > 50) {
          status.errors.push({
            service: 'indexer',
            message: `Indexer is ${blocksBehind} blocks behind`,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        status.indexer = {
          healthy: false,
          message: 'Indexer state not found'
        };
        status.errors.push({
          service: 'indexer',
          message: 'Indexer state not initialized',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      status.indexer = {
        healthy: false,
        message: error.message
      };
      status.errors.push({
        service: 'indexer',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  async getDatabaseStats() {
    try {
      const [campaigns, donations, milestones, refunds] = await Promise.all([
        this.db.get('SELECT COUNT(*) as count FROM campaigns'),
        this.db.get('SELECT COUNT(*) as count FROM donations WHERE finalized = true'),
        this.db.get('SELECT COUNT(*) as count FROM milestones'),
        this.db.get('SELECT COUNT(*) as count FROM refunds WHERE finalized = true')
      ]);

      const totalRaised = await this.db.get('SELECT SUM(CAST(total_raised AS INTEGER)) as total FROM aggregates');

      return {
        campaigns: campaigns.count,
        donations: donations.count,
        milestones: milestones.count,
        refunds: refunds.count,
        totalRaised: totalRaised.total || 0
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  // GET /health/simple
  async getSimpleHealth(req, res) {
    try {
      // Quick health check - just test database
      await this.db.get('SELECT 1');
      res.status(200).json({ status: 'ok' });
    } catch (error) {
      res.status(503).json({ status: 'error', message: error.message });
    }
  }
}

module.exports = HealthController;
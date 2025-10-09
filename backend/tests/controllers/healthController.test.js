const HealthController = require('../../src/controllers/healthController');

describe('HealthController', () => {
  let healthController;
  let req;
  let res;

  beforeEach(async () => {
    healthController = new HealthController();
    await healthController.initialize();

    req = global.testUtils.createMockRequest();
    res = global.testUtils.createMockResponse();
  });

  afterEach(async () => {
    if (healthController.db) {
      await healthController.db.close();
    }
  });

  describe('getSimpleHealth', () => {
    it('should return healthy status', async () => {
      await healthController.getSimpleHealth(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ status: 'ok' });
    });
  });

  describe('getHealth', () => {
    it('should return detailed health status', async () => {
      await healthController.getHealth(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: expect.any(String),
          timestamp: expect.any(String),
          services: expect.any(Object),
          indexer: expect.any(Object)
        })
      );
    });

    it('should include response time', async () => {
      await healthController.getHealth(req, res);

      const responseData = res.json.mock.calls[0][0];
      expect(responseData.responseTime).toBeGreaterThan(0);
    });

    it('should check all required services', async () => {
      await healthController.getHealth(req, res);

      const responseData = res.json.mock.calls[0][0];
      expect(responseData.services).toHaveProperty('database');
      expect(responseData.services).toHaveProperty('blockchain');
      expect(responseData.services).toHaveProperty('pinata');
    });
  });
});
const config = require('../config');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = ':memory:';
process.env.LOG_LEVEL = 'silent';

// Mock external services in test environment
if (process.env.NODE_ENV === 'test') {
  // Mock Pinata service
  jest.mock('../src/services/pinataService', () => {
    return jest.fn().mockImplementation(() => ({
      pinJSONToIPFS: jest.fn().mockResolvedValue({
        success: true,
        cid: 'QmTest123456789',
        size: 1024
      }),
      pinFileToIPFS: jest.fn().mockResolvedValue({
        success: true,
        cid: 'QmTestFile123456789',
        size: 2048
      }),
      testAuthentication: jest.fn().mockResolvedValue({ success: true }),
      validateCampaignMetadata: jest.fn().mockReturnValue(true)
    }));
  });

  // Mock blockchain service for most tests
  jest.mock('../src/services/blockchainService', () => {
    return jest.fn().mockImplementation(() => ({
      getCurrentBlock: jest.fn().mockResolvedValue(12345),
      getFactoryLogs: jest.fn().mockResolvedValue([]),
      getCampaignLogs: jest.fn().mockResolvedValue([]),
      isContractDeployed: jest.fn().mockResolvedValue(true)
    }));
  });
}

// Global test utilities
global.testUtils = {
  createMockRequest: (overrides = {}) => ({
    params: {},
    query: {},
    body: {},
    headers: {},
    ...overrides
  }),

  createMockResponse: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  },

  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};
const PinataService = require('../../src/services/pinataService');

// Remove mock for this specific test file
jest.unmock('../../src/services/pinataService');

describe('PinataService', () => {
  let pinataService;

  beforeEach(() => {
    pinataService = new PinataService();
  });

  describe('validateCampaignMetadata', () => {
    it('should validate correct campaign metadata', () => {
      const validMetadata = {
        title: 'Test Campaign',
        summary: 'A test campaign for donations',
        milestones: [
          { name: 'Milestone 1', description: 'First milestone' },
          { name: 'Milestone 2', description: 'Second milestone' }
        ],
        verifier: '0x1234567890123456789012345678901234567890',
        tokenAddr: '0x0987654321098765432109876543210987654321',
        trancheBps: [5000, 5000],
        deadline: new Date(Date.now() + 86400000).toISOString() // Tomorrow
      };

      expect(() => pinataService.validateCampaignMetadata(validMetadata)).not.toThrow();
    });

    it('should reject metadata with missing required fields', () => {
      const invalidMetadata = {
        title: 'Test Campaign',
        // Missing other required fields
      };

      expect(() => pinataService.validateCampaignMetadata(invalidMetadata))
        .toThrow('Missing required fields');
    });

    it('should reject metadata with invalid tranche percentages', () => {
      const invalidMetadata = {
        title: 'Test Campaign',
        summary: 'A test campaign',
        milestones: [{ name: 'Milestone 1', description: 'First milestone' }],
        verifier: '0x1234567890123456789012345678901234567890',
        tokenAddr: '0x0987654321098765432109876543210987654321',
        trancheBps: [6000, 5000], // Total > 10000
        deadline: new Date(Date.now() + 86400000).toISOString()
      };

      expect(() => pinataService.validateCampaignMetadata(invalidMetadata))
        .toThrow('Total tranche basis points cannot exceed 10000');
    });

    it('should reject metadata with past deadline', () => {
      const invalidMetadata = {
        title: 'Test Campaign',
        summary: 'A test campaign',
        milestones: [{ name: 'Milestone 1', description: 'First milestone' }],
        verifier: '0x1234567890123456789012345678901234567890',
        tokenAddr: '0x0987654321098765432109876543210987654321',
        trancheBps: [10000],
        deadline: new Date(Date.now() - 86400000).toISOString() // Yesterday
      };

      expect(() => pinataService.validateCampaignMetadata(invalidMetadata))
        .toThrow('Deadline must be in the future');
    });

    it('should reject metadata with invalid milestone structure', () => {
      const invalidMetadata = {
        title: 'Test Campaign',
        summary: 'A test campaign',
        milestones: [{ name: 'Milestone 1' }], // Missing description
        verifier: '0x1234567890123456789012345678901234567890',
        tokenAddr: '0x0987654321098765432109876543210987654321',
        trancheBps: [10000],
        deadline: new Date(Date.now() + 86400000).toISOString()
      };

      expect(() => pinataService.validateCampaignMetadata(invalidMetadata))
        .toThrow('Milestone 0 missing name or description');
    });
  });
});
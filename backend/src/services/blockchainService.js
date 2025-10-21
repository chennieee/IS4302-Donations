const { ethers } = require('ethers');
const config = require('../../config');

class BlockchainService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);
    this.factoryAddress = config.blockchain.factoryAddress;
    this.chainId = config.blockchain.chainId;

    // Contract ABIs - these would normally come from your contracts build
    this.factoryABI = [
      "event CampaignCreated(address organizer, address campaign, string name, uint256 deadline, uint256[] milestones)",
      "function getAllCampaigns() view returns (address[])",
      "function campaignsCount() view returns (uint256)",
      "function getCampaign(uint256 index) view returns (address)"
    ];

    this.campaignABI = [
      "event DonationReceived(address indexed donor, uint256 amount)",
      "event MilestoneAdded(uint256 milestone, uint256 index)",
      "event MilestoneProposed(uint256 milestone)",
      "event MilestoneAccepted(uint256 milestone)",
      "event MilestoneRejected(uint256 milestone)",
      "event FundsReleased(uint256 amount, uint256 milestoneIndex)",
      "event FundsReturned(address indexed donor, uint256 amount)",
      "function owner() view returns (address)",
      "function verifiers(address) view returns (bool)",
      "function deadline() view returns (uint256)",
      "function name() view returns (string)",
      "function milestones(uint256) view returns (uint256)",
      "function totalRaised() view returns (uint256)",
      "function currentProposal() view returns (uint256)"
    ];

    this.factoryContract = new ethers.Contract(
      this.factoryAddress,
      this.factoryABI,
      this.provider
    );
  }

  async getCurrentBlock() {
    return await this.provider.getBlockNumber();
  }

  async getBlockWithTimestamp(blockNumber) {
    const block = await this.provider.getBlock(blockNumber);
    return {
      number: block.number,
      timestamp: block.timestamp,
      hash: block.hash
    };
  }

  async getLogsInRange(fromBlock, toBlock, addresses = []) {
    try {
      const filter = {
        fromBlock,
        toBlock,
        address: addresses.length > 0 ? addresses : undefined
      };

      const logs = await this.provider.getLogs(filter);
      return logs;
    } catch (error) {
      console.error(`Error fetching logs from block ${fromBlock} to ${toBlock}:`, error);
      throw error;
    }
  }

  async getFactoryLogs(fromBlock, toBlock) {
    try {
      const filter = this.factoryContract.filters.CampaignCreated();
      filter.fromBlock = fromBlock;
      filter.toBlock = toBlock;

      const logs = await this.provider.getLogs(filter);
      return logs.map(log => this.parseFactoryLog(log));
    } catch (error) {
      console.error(`Error fetching factory logs:`, error);
      throw error;
    }
  }

  async getCampaignLogs(campaignAddress, fromBlock, toBlock) {
    try {
      const campaignContract = new ethers.Contract(
        campaignAddress,
        this.campaignABI,
        this.provider
      );

      const eventFilters = [
        campaignContract.filters.DonationReceived(),
        campaignContract.filters.MilestoneAdded(),
        campaignContract.filters.MilestoneProposed(),
        campaignContract.filters.MilestoneAccepted(),
        campaignContract.filters.MilestoneRejected(),
        campaignContract.filters.FundsReleased(),
        campaignContract.filters.FundsReturned()
      ];

      const allLogs = [];
      for (const filter of eventFilters) {
        filter.fromBlock = fromBlock;
        filter.toBlock = toBlock;

        const logs = await this.provider.getLogs(filter);
        const parsedLogs = logs.map(log => this.parseCampaignLog(log, campaignAddress));
        allLogs.push(...parsedLogs);
      }

      // Sort by block number and log index
      return allLogs.sort((a, b) => {
        if (a.blockNumber !== b.blockNumber) {
          return a.blockNumber - b.blockNumber;
        }
        return a.logIndex - b.logIndex;
      });
    } catch (error) {
      console.error(`Error fetching campaign logs for ${campaignAddress}:`, error);
      throw error;
    }
  }

  parseFactoryLog(log) {
    try {
      const iface = new ethers.Interface(this.factoryABI);
      const parsed = iface.parseLog(log);

      return {
        txHash: log.transactionHash,
        logIndex: log.logIndex,
        blockNumber: log.blockNumber,
        address: log.address,
        eventName: 'CampaignCreated',
        args: {
          organizer: parsed.args.organizer,
          campaign: parsed.args.campaign,
          name: parsed.args.name,
          deadline: parsed.args.deadline.toString(),
          milestones: parsed.args.milestones.map(m => m.toString()),
          verifiers: [] // Verifiers are not emitted in the event, need to query contract if needed
        }
      };
    } catch (error) {
      console.error('Error parsing factory log:', error);
      throw error;
    }
  }

  parseCampaignLog(log, campaignAddress) {
    try {
      const iface = new ethers.Interface(this.campaignABI);
      const parsed = iface.parseLog(log);

      const baseLog = {
        txHash: log.transactionHash,
        logIndex: log.logIndex,
        blockNumber: log.blockNumber,
        address: campaignAddress,
        eventName: parsed.name
      };

      switch (parsed.name) {
        case 'DonationReceived':
          return {
            ...baseLog,
            args: {
              donor: parsed.args.donor,
              amount: parsed.args.amount.toString()
            }
          };

        case 'MilestoneAdded':
          return {
            ...baseLog,
            args: {
              milestone: parsed.args.milestone.toString(),
              index: parsed.args.index.toString()
            }
          };

        case 'MilestoneProposed':
          return {
            ...baseLog,
            args: {
              milestone: parsed.args.milestone.toString()
            }
          };

        case 'MilestoneAccepted':
          return {
            ...baseLog,
            args: {
              milestone: parsed.args.milestone.toString()
            }
          };

        case 'MilestoneRejected':
          return {
            ...baseLog,
            args: {
              milestone: parsed.args.milestone.toString()
            }
          };

        case 'FundsReleased':
          return {
            ...baseLog,
            args: {
              amount: parsed.args.amount.toString(),
              milestoneIndex: parsed.args.milestoneIndex.toString()
            }
          };

        case 'FundsReturned':
          return {
            ...baseLog,
            args: {
              donor: parsed.args.donor,
              amount: parsed.args.amount.toString()
            }
          };

        default:
          throw new Error(`Unknown event: ${parsed.name}`);
      }
    } catch (error) {
      console.error('Error parsing campaign log:', error);
      throw error;
    }
  }

  async getTransaction(txHash) {
    return await this.provider.getTransaction(txHash);
  }

  async getTransactionReceipt(txHash) {
    return await this.provider.getTransactionReceipt(txHash);
  }

  async isContractDeployed(address) {
    const code = await this.provider.getCode(address);
    return code !== '0x';
  }

  formatAddress(address) {
    return ethers.getAddress(address);
  }

  isValidAddress(address) {
    try {
      ethers.getAddress(address);
      return true;
    } catch {
      return false;
    }
  }

  async getCampaignDetails(campaignAddress) {
    try {
      const campaign = new ethers.Contract(
        campaignAddress,
        this.campaignABI,
        this.provider
      );

      const [owner, deadline, name, totalRaised, currentProposal] = await Promise.all([
        campaign.owner(),
        campaign.deadline(),
        campaign.name(),
        campaign.totalRaised(),
        campaign.currentProposal()
      ]);

      return {
        owner,
        deadline: deadline.toString(),
        name,
        totalRaised: totalRaised.toString(),
        currentProposal: currentProposal.toString()
      };
    } catch (error) {
      console.error(`Error fetching campaign details for ${campaignAddress}:`, error);
      throw error;
    }
  }

  async isVerifier(campaignAddress, verifierAddress) {
    try {
      const campaign = new ethers.Contract(
        campaignAddress,
        this.campaignABI,
        this.provider
      );
      return await campaign.verifiers(verifierAddress);
    } catch (error) {
      console.error(`Error checking verifier status:`, error);
      return false;
    }
  }
}

module.exports = BlockchainService;
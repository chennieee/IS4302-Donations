const { ethers } = require('ethers');
const config = require('../../config');

class BlockchainService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);
    this.factoryAddress = config.blockchain.factoryAddress;
    this.chainId = config.blockchain.chainId;

    // Contract ABIs - these would normally come from your contracts build
    this.factoryABI = [
      "event CampaignCreated(address indexed campaign, address indexed organizer, string ipfsCid, address token, address verifier, uint256[] trancheBps, uint256 deadline)"
    ];

    this.campaignABI = [
      "event DonationReceived(address indexed donor, uint256 amount)",
      "event MilestoneApproved(uint256 indexed milestoneIndex)",
      "event MilestoneRejected(uint256 indexed milestoneIndex)",
      "event MilestoneReleased(uint256 indexed milestoneIndex, uint256 amount)",
      "event Refunded(address indexed donor, uint256 amount)"
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
        campaignContract.filters.MilestoneApproved(),
        campaignContract.filters.MilestoneRejected(),
        campaignContract.filters.MilestoneReleased(),
        campaignContract.filters.Refunded()
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
          campaign: parsed.args.campaign,
          organizer: parsed.args.organizer,
          ipfsCid: parsed.args.ipfsCid,
          token: parsed.args.token,
          verifier: parsed.args.verifier,
          trancheBps: parsed.args.trancheBps.map(bp => bp.toString()),
          deadline: parsed.args.deadline.toString()
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

        case 'MilestoneApproved':
          return {
            ...baseLog,
            args: {
              milestoneIndex: parsed.args.milestoneIndex.toString()
            }
          };

        case 'MilestoneRejected':
          return {
            ...baseLog,
            args: {
              milestoneIndex: parsed.args.milestoneIndex.toString()
            }
          };

        case 'MilestoneReleased':
          return {
            ...baseLog,
            args: {
              milestoneIndex: parsed.args.milestoneIndex.toString(),
              amount: parsed.args.amount.toString()
            }
          };

        case 'Refunded':
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
}

module.exports = BlockchainService;
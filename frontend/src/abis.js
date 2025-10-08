// === Campaign ===
export const campaignAbi = [
  // Events
  {
    "type":"event","name":"DonationReceived","inputs":[
      {"indexed":true,"name":"donor","type":"address"},
      {"indexed":false,"name":"amount","type":"uint256"}
    ]
  },
  {
    "type":"event","name":"MilestoneApproved","inputs":[
      {"indexed":true,"name":"idx","type":"uint256"}
    ]
  },
  {
    "type":"event","name":"MilestoneRejected","inputs":[
      {"indexed":true,"name":"idx","type":"uint256"}
    ]
  },
  {
    "type":"event","name":"MilestoneReleased","inputs":[
      {"indexed":true,"name":"idx","type":"uint256"},
      {"indexed":false,"name":"amount","type":"uint256"}
    ]
  },
  {
    "type":"event","name":"Refunded","inputs":[
      {"indexed":true,"name":"donor","type":"address"},
      {"indexed":false,"name":"amount","type":"uint256"}
    ]
  },

  // Writes
  {"type":"function","stateMutability":"nonpayable","name":"donateToken","inputs":[{"name":"amt","type":"uint256"}],"outputs":[]},
  {"type":"function","stateMutability":"nonpayable","name":"approveMilestone","inputs":[{"name":"idx","type":"uint256"}],"outputs":[]},
  {"type":"function","stateMutability":"nonpayable","name":"rejectMilestone","inputs":[{"name":"idx","type":"uint256"}],"outputs":[]},
  {"type":"function","stateMutability":"nonpayable","name":"releaseMilestone","inputs":[{"name":"idx","type":"uint256"}],"outputs":[]},
  {"type":"function","stateMutability":"nonpayable","name":"refund","inputs":[],"outputs":[]},

  // Views (explicit)
  {"type":"function","stateMutability":"view","name":"acceptedToken","inputs":[],"outputs":[{"type":"address"}]},
  {"type":"function","stateMutability":"view","name":"milestoneCount","inputs":[],"outputs":[{"type":"uint256"}]},
  {"type":"function","stateMutability":"view","name":"milestoneStatus","inputs":[{"name":"i","type":"uint256"}],"outputs":[{"type":"uint8"}]},
  {"type":"function","stateMutability":"view","name":"contributedOf","inputs":[{"name":"a","type":"address"}],"outputs":[{"type":"uint256"}]},
  {"type":"function","stateMutability":"view","name":"releasedSoFar","inputs":[],"outputs":[{"type":"uint256"}]},
  {"type":"function","stateMutability":"view","name":"pendingToRelease","inputs":[],"outputs":[{"type":"uint256"}]},
  {"type":"function","stateMutability":"view","name":"escrowTokenBalance","inputs":[],"outputs":[{"type":"uint256"}]},
  {"type":"function","stateMutability":"view","name":"isRefundOpen","inputs":[],"outputs":[{"type":"bool"}]},

  // Public immutables/vars (Solidity auto-getters)
  {"type":"function","stateMutability":"view","name":"organizer","inputs":[],"outputs":[{"type":"address"}]},
  {"type":"function","stateMutability":"view","name":"token","inputs":[],"outputs":[{"type":"address"}]},
  {"type":"function","stateMutability":"view","name":"verifier","inputs":[],"outputs":[{"type":"address"}]},
  {"type":"function","stateMutability":"view","name":"deadline","inputs":[],"outputs":[{"type":"uint256"}]},
  {"type":"function","stateMutability":"view","name":"totalRaised","inputs":[],"outputs":[{"type":"uint256"}]},
  {"type":"function","stateMutability":"view","name":"totalReleased","inputs":[],"outputs":[{"type":"uint256"}]},
  {"type":"function","stateMutability":"view","name":"anyReleased","inputs":[],"outputs":[{"type":"bool"}]},
  {"type":"function","stateMutability":"view","name":"anyRejected","inputs":[],"outputs":[{"type":"bool"}]}
];

// === CampaignFactory ===
export const campaignFactoryAbi = [
  // Event
  {
    "type":"event","name":"CampaignCreated","inputs":[
      {"indexed":true,"name":"organizer","type":"address"},
      {"indexed":true,"name":"campaign","type":"address"},
      {"indexed":true,"name":"token","type":"address"},
      {"indexed":false,"name":"verifier","type":"address"},
      {"indexed":false,"name":"ipfsCid","type":"string"},
      {"indexed":false,"name":"deadline","type":"uint256"}
    ]
  },

  // Write
  {
    "type":"function","stateMutability":"nonpayable","name":"create",
    "inputs":[
      {"name":"ipfsCid","type":"string"},
      {"name":"tokenAddr","type":"address"},
      {"name":"verifier","type":"address"},
      {"name":"trancheBps","type":"uint256[]"},
      {"name":"deadline","type":"uint256"}
    ],
    "outputs":[{"name":"campaign","type":"address"}]
  },

  // Views
  {"type":"function","stateMutability":"view","name":"getCampaigns","inputs":[],"outputs":[{"type":"address[]"}]},
  {"type":"function","stateMutability":"view","name":"campaignsCount","inputs":[],"outputs":[{"type":"uint256"}]}
];

// === ERC20 ===
export const erc20Abi = [
  // Events
  {
    "type":"event","name":"Transfer","inputs":[
      {"indexed":true,"name":"from","type":"address"},
      {"indexed":true,"name":"to","type":"address"},
      {"indexed":false,"name":"value","type":"uint256"}
    ]
  },
  {
    "type":"event","name":"Approval","inputs":[
      {"indexed":true,"name":"owner","type":"address"},
      {"indexed":true,"name":"spender","type":"address"},
      {"indexed":false,"name":"value","type":"uint256"}
    ]
  },
  {"type":"event","name":"MintFinished","inputs":[]},

  // Standard ERC-20 reads/writes
  {"type":"function","stateMutability":"view","name":"decimals","inputs":[],"outputs":[{"type":"uint8"}]},
  {"type":"function","stateMutability":"view","name":"totalSupply","inputs":[],"outputs":[{"type":"uint256"}]},
  {"type":"function","stateMutability":"view","name":"balanceOf","inputs":[{"name":"_owner","type":"address"}],"outputs":[{"type":"uint256"}]},
  {"type":"function","stateMutability":"view","name":"allowance","inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"outputs":[{"type":"uint256"}]},
  {"type":"function","stateMutability":"nonpayable","name":"approve","inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"outputs":[{"type":"bool"}]},
  {"type":"function","stateMutability":"nonpayable","name":"transfer","inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"outputs":[{"type":"bool"}]},
  {"type":"function","stateMutability":"nonpayable","name":"transferFrom","inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"outputs":[{"type":"bool"}]},

  // Project-specific extras in ERC20
  {"type":"function","stateMutability":"nonpayable","name":"mint","inputs":[{"name":"_to","type":"address"},{"name":"_amount","type":"uint256"}],"outputs":[]},
  {"type":"function","stateMutability":"nonpayable","name":"finishMinting","inputs":[],"outputs":[]},
  {"type":"function","stateMutability":"view","name":"getOwner","inputs":[],"outputs":[{"type":"address"}]}
];
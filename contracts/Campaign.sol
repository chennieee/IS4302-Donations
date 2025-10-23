// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Campaign is ReentrancyGuard {
    address public owner;
    mapping(address => bool) public verifiers;
    uint256 public deadline;
    string public name;
    uint256[] public milestones;
    mapping(address => uint256) private contributions;
    uint256 public totalRaised = 0;
    uint256 public currentProposal = 0;

    // Events
    event DonationReceived(address indexed donor, uint256 amount);
    event MilestoneAdded(uint256 milestone, uint256 index);
    event MilestoneProposed(uint256 milestone);
    event MilestoneAccepted(uint256 milestone);
    event MilestoneRejected(uint256 milestone);
    event FundsReleased(uint256 amount, uint256 milestoneIndex);
    event FundsReturned(address indexed donor, uint256 amount);

    constructor(
        address _owner,
        address[] memory _verifiers,
        uint256 _deadline,
        string memory _name,
        uint256[] memory _milestones
    ) {
        owner = _owner;
        name = _name;
        deadline = _deadline;

        uint256 len = _verifiers.length;
        for (uint i = 0; i < len; i++) {
            verifiers[_verifiers[i]] = true;
        }

        len = _milestones.length;
        for (uint256 i = 0; i < len; i++) {
            addMilestone(_milestones[i]);
        }
    }

    modifier campaignInProgress() {
        require(block.timestamp < deadline, "Campaign has ended!");
        _;
    }

    modifier campaignEnded() {
        require(block.timestamp >= deadline, "Campaign has ended!");
        _;
    }

    modifier onlyVerifier() {
        require(
            verifiers[msg.sender],
            "Only a verifier is authorized to call this!"
        );
        _;
    }

    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "Only the owner is authorized to call this!"
        );
        _;
    }

    // New milestone must be greater than current milestone and totalRaised must exceed current milestone
    modifier validNewMilestone(uint256 milestone) {
        uint256 len = milestones.length;
        require(
            len == 0 ||
                (milestone > milestones[len - 1] &&
                    milestones[len - 1] <= totalRaised),
            "New milestone should be greater than current milestone!"
        );
        _;
    }

    modifier hasProposal() {
        require(currentProposal != 0, "No proposal in progress!");
        _;
    }

    // Only accept denominations of 1 eth for now
    function donate() external payable nonReentrant campaignInProgress {
        uint256 ethAmount = msg.value / 1 ether;
        require(ethAmount >= 1, "Donations have to be at least 1 eth!");
        contributions[msg.sender] += ethAmount;
        totalRaised += ethAmount;
        emit DonationReceived(msg.sender, ethAmount);
    }

    function addMilestone(
        uint256 newMilestone
    ) public validNewMilestone(newMilestone) campaignInProgress {
        milestones.push(newMilestone);
        emit MilestoneAdded(newMilestone, milestones.length - 1);
    }

    function proposeNewMilestone(
        uint256 newMilestone
    ) external onlyOwner validNewMilestone(newMilestone) {
        require(currentProposal == 0, "Wait for current proposal to complete!");
        currentProposal = newMilestone;
        emit MilestoneProposed(newMilestone);
    }

    function acceptProposal() external onlyVerifier hasProposal nonReentrant {
        uint256 acceptedMilestone = currentProposal;
        addMilestone(currentProposal);
        currentProposal = 0;
        emit MilestoneAccepted(acceptedMilestone);
    }

    function rejectProposal() external onlyVerifier hasProposal {
        uint256 rejectedMilestone = currentProposal;
        currentProposal = 0;
        emit MilestoneRejected(rejectedMilestone);
    }

    function releaseFunds() external onlyVerifier campaignEnded nonReentrant {
        payable(owner).transfer(totalRaised);
        emit FundsReleased(totalRaised, milestones.length);
    }

    // Only allow fund return when first milestone has not been hit
    function returnFunds() external campaignInProgress nonReentrant {
        require(
            milestones.length == 1 && totalRaised < milestones[0],
            "Funds can no longer be returned!"
        );
        uint256 donationAmount = contributions[msg.sender];
        require(donationAmount > 0, "No contribution to return!");
        payable(msg.sender).transfer(donationAmount);
        emit FundsReturned(msg.sender, donationAmount);

        totalRaised -= donationAmount;
        contributions[msg.sender] = 0;
    }

    function getContribution() external view returns (uint256) {
        return contributions[msg.sender];
    }
}

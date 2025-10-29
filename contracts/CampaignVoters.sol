// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract CampaignVoters is ReentrancyGuard {
    address public owner;
    mapping(address => bool) public verifiers;
    // Keep a list to be able to snapshot the current verifier set
    address[] private verifierList;

    uint256 public deadline;
    string public name;
    uint256[] public milestones;

    // Accounting in ETH units (1 unit = 1 ETH)
    mapping(address => uint256) private contributions;
    address[] private contributors;
    uint256 public totalRaised = 0;

    // Proposal voting state
    uint256 public currentProposal; // milestone (in units)
    uint256 public proposalStartTime;
    uint256 public proposalDeadline; // start + 1 days
    uint256 public yesVotes;
    uint256 public noVotes;
    mapping(address => bool) public votedThisProposal;

    // Events
    event DonationReceived(address indexed donor, uint256 amount);
    event MilestoneAdded(uint256 milestone, uint256 index);
    event MilestoneProposed(uint256 milestone);
    event ProposalStarted(uint256 milestone, uint256 startTime, uint256 endTime, uint256 voterCount);
    event VoteCast(address indexed voter, bool support);
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

        // Initialize verifiers list + mapping; include owner
        uint256 vlen = _verifiers.length;
        for (uint i = 0; i < vlen; i++) {
            address v = _verifiers[i];
            if (!verifiers[v]) {
                verifiers[v] = true;
                verifierList.push(v);
            }
        }
        if (!verifiers[owner]) {
            verifiers[owner] = true;
            verifierList.push(owner);
        }

        uint256 mlen = _milestones.length;
        for (uint256 i = 0; i < mlen; i++) {
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

    // New milestone must be greater than current milestone and previous milestone not yet exceeded by totalRaised
    modifier validNewMilestone(uint256 milestone) {
        uint256 len = milestones.length;
        require(
            len == 0 ||
                (milestone > milestones[len - 1] &&
                    milestones[len - 1] >= totalRaised),
            "New milestone should be greater than current milestone!"
        );
        _;
    }

    modifier hasProposal() {
        require(currentProposal != 0, "No proposal in progress!");
        _;
    }

    modifier noProposal() {
        require(currentProposal == 0, "Wait for current proposal to complete!");
        _;
    }

    // Only accept denominations of 1 eth for now
    function donate() external payable nonReentrant campaignInProgress {
        require(msg.value >= 1 ether, "Donations have to be at least 1 eth!");
        require(msg.value % 1 ether == 0, "Donations must be whole ETH multiples");
        uint256 ethAmount = msg.value / 1 ether;
        if (contributions[msg.sender] == 0) {
            contributors.push(msg.sender);
        }
        contributions[msg.sender] += ethAmount;
        totalRaised += ethAmount;
        emit DonationReceived(msg.sender, ethAmount);
    }

    function addMilestone(
        uint256 newMilestone
    ) internal validNewMilestone(newMilestone) campaignInProgress {
        milestones.push(newMilestone);
        emit MilestoneAdded(newMilestone, milestones.length - 1);
    }

    // Owner proposes a new milestone; start 1-day voting among verifiers
    function proposeNewMilestone(
        uint256 newMilestone
    ) external onlyOwner validNewMilestone(newMilestone) {
        require(currentProposal == 0, "Wait for current proposal to complete!");
        currentProposal = newMilestone;
        proposalStartTime = block.timestamp;
        proposalDeadline = block.timestamp + 1 days;

        emit MilestoneProposed(newMilestone);
        emit ProposalStarted(newMilestone, proposalStartTime, proposalDeadline, verifierList.length);
    }

    function getCurrentProposal() public view hasProposal returns(uint256[6] memory) {
        return [currentProposal, proposalStartTime, proposalDeadline, yesVotes, noVotes, verifierList.length];
    }

    // Verifiers vote within the 1-day window. Majority immediately finalizes.
    function voteOnProposal(bool support) external onlyVerifier hasProposal returns(string memory){
        require(!votedThisProposal[msg.sender], "Already voted");
        require(block.timestamp <= proposalDeadline, "Voting ended");

        votedThisProposal[msg.sender] = true;
        if (support) {
            yesVotes += 1;
        } else {
            noVotes += 1;
        }
        emit VoteCast(msg.sender, support);
        return checkFinalize();
    }

    function checkFinalize() public onlyVerifier hasProposal returns(string memory) {
        if ((yesVotes + noVotes == verifierList.length) || block.timestamp > proposalDeadline) {
            if (yesVotes > noVotes) {
                acceptProposal();
                return "Proposal has been accepted!";
            } else {
                rejectProposal();
                return "Proposal has been rejected!";
            }        
        }
        return "Proposal is not finalized yet";
    }

    function acceptProposal() internal {
        uint256 acceptedMilestone = currentProposal;
        addMilestone(currentProposal);
        emit MilestoneAccepted(acceptedMilestone);
        clearProposal();
    }

    function rejectProposal() internal {
        uint256 rejectedMilestone = currentProposal;
        emit MilestoneRejected(rejectedMilestone);
        clearProposal();
    }

    function clearProposal() internal {
        uint256 len = verifierList.length;
        for (uint256 i = 0; i < len; i++) {
            address v = verifierList[i];
            votedThisProposal[v] = false;
        }
        currentProposal = 0;
        proposalStartTime = 0;
        proposalDeadline = 0;
        yesVotes = 0;
        noVotes = 0;
    }

    function releaseFunds() external onlyVerifier campaignEnded nonReentrant {
        payable(owner).transfer(totalRaised * 1 ether);
        emit FundsReleased(totalRaised, milestones.length);
    }

    // Only allow fund return when first milestone has not been hit
    function refund() external campaignInProgress nonReentrant {
        require(
            milestones.length == 1 && totalRaised < milestones[0],
            "Funds can no longer be returned!"
        );
        uint256 donationAmount = contributions[msg.sender];
        require(donationAmount > 0, "No contribution to return!");
        payable(msg.sender).transfer(donationAmount * 1 ether);
        emit FundsReturned(msg.sender, donationAmount);

        totalRaised -= donationAmount;
        contributions[msg.sender] = 0;
    }

    function refundAll() external onlyOwner campaignEnded nonReentrant {
        require(totalRaised > 0, "No contribution to return!");
        uint256 len = contributors.length;
        for (uint256 i = 0; i < len; i++) {
            address donor = contributors[i];
            uint256 amount = contributions[donor];
            if (amount > 0) {
                payable(donor).transfer(amount * 1 ether);
                emit FundsReturned(donor, amount);
                totalRaised -= amount;
                contributions[donor] = 0;
            }
        }
    }

    // Views
    function getContribution(address user) external view returns (uint256) {
        return contributions[user];
    }

    function getContributors() external view returns (address[] memory) {
        return contributors;
    }

    function isVerifier(address newVerifier) public view returns (bool){
        return verifiers[newVerifier];
    }

    function getVerifiers() external view returns (address[] memory) {
        return verifierList;
    }

    // Admin for verifiers
    function addVerifier(address newVerifier) noProposal onlyOwner public {
        require(!isVerifier(newVerifier), "Address is already a verifier");
        verifiers[newVerifier] = true;
        verifierList.push(newVerifier);
    }

    function removeVerifier(address newVerifier) noProposal onlyOwner public {
        require(isVerifier(newVerifier), "Address is already not a verifier");
        verifiers[newVerifier] = false;
        uint256 tempNum = 0;
        while(verifierList[tempNum] != newVerifier){
                tempNum += 1;
        }
        verifierList[tempNum] = verifierList[verifierList.length - 1];
        verifierList.pop();
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Campaign is ReentrancyGuard {
    address owner;
    uint256 deadline; //TODO3
    string name;
    Milestone[] public milestone; // array of milestones and events for the milestones TODO1
    address[] public verifiers; // TODO4
    uint256 goal; // in ether, easier to manage
    uint256 totalRaised = 0;
    campaignStatus status;

    // mapping(address=>uint256) contributed (later do with refund code) TODO2

    constructor(
        address _owner,
        uint256 _deadline,
        string memory _name,
        uint256 _goal
    ) {
        owner = _owner;
        name = _name;
        deadline = _deadline;
        goal = _goal;
        verifiers.push(owner);
        status = campaignStatus.Ongoing;
    }

    modifier isOngoing() {
        if (status == campaignStatus.Ongoing && block.timestamp >= deadline) {
            status = campaignStatus.Terminated;
        }
        require(
            status == campaignStatus.Ongoing,
            "Campaign is not ongoing anymore!"
        );
        _;
    }

    //TODO5 fallback function
    function donate() public payable isOngoing {
        uint256 donationAmount = msg.value / 1 ether;
        require(
            donationAmount >= 1,
            "Minimum donation is 1 ether, donations are in the base value of 1 ether"
        );
        uint256 excess = msg.value % 1 ether;
        payable(msg.sender).transfer(excess);
        totalRaised += donationAmount;
        emit DonationReceived(msg.sender, donationAmount);
        if (totalRaised >= goal) {
            status = campaignStatus.Completed;
            //EMIT CAMPAIGN COMPLETED;
        }
    }

    function getOwner() public view returns (address) {
        return owner;
    }

    function getDeadline() public view returns (uint256) {
        return deadline;
    }

    function getGoal() public view returns (uint256) {
        return goal;
    }

    function getTotalRaised() public view returns (uint256) {
        return totalRaised;
    }

    function getStatus() public view returns (campaignStatus) {
        return status;
    }

    function getName() public view returns (string memory) {
        return name;
    }
}

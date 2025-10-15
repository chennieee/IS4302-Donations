// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Campaign is ReentrancyGuard {
    enum Status {
        Approved,
        Pending,
        Rejected,
        Released
    }

    struct Milestone {
        Status status;
        uint256 goal;
    }

    address public owner;
    mapping(address => bool) public verifiers;
    uint256 public deadline;
    string public name;
    Milestone[] public milestones;
    mapping(address => uint256) private contributions;
    uint256 public totalRaised = 0;

    constructor(
        address _owner,
        address[] memory _verifiers,
        uint256 _deadline,
        string memory _name,
        uint256[] memory _goals
    ) {
        owner = _owner;
        name = _name;
        deadline = _deadline;

        uint256 vLen = _verifiers.length;
        for (uint i = 0; i < vLen; i++) {
            verifiers[_verifiers[i]] = true;
        }

        uint256 gLen = _goals.length;
        for (uint256 i = 0; i < gLen; i++) {
            milestones.push(Milestone(Status.Pending, _goals[i]));
        }
    }

    modifier onlyVerifier() {
        require(
            verifiers[msg.sender],
            "Only the verifier is authorized to call this!"
        );
        _;
    }

    // Check that a selected milestone is within range and, has the expected status
    modifier validMilestoneIdx(uint256 idx) {
        require(idx < milestones.length, "Invalid milestone index!");
        _;
    }

    modifier hasMilestoneStatus(uint256 idx, Status s) {
        require(
            milestones[idx].status == s,
            "Milestone has unexpected status!"
        );
        _;
    }

    // Only accept denominations of 1 eth for now
    function donate() external payable nonReentrant {
        uint256 ethAmount = msg.value / 1 ether;
        require(ethAmount >= 1, "Donations have to be at least 1 eth!");
        contributions[msg.sender] += ethAmount;
        totalRaised += ethAmount;
    }

    function approveMilestone(
        uint256 i
    )
        external
        onlyVerifier
        validMilestoneIdx(i)
        hasMilestoneStatus(i, Status.Pending)
    {
        milestones[i].status = Status.Approved;
    }

    function rejectMilestone(
        uint256 i
    )
        external
        onlyVerifier
        validMilestoneIdx(i)
        hasMilestoneStatus(i, Status.Pending)
    {
        milestones[i].status = Status.Rejected;
    }

    function releaseMilestone(
        uint256 i
    )
        external
        onlyVerifier
        validMilestoneIdx(i)
        hasMilestoneStatus(i, Status.Approved)
    {
        milestones[i].status = Status.Released;

        // TODO: Transfer to owner
    }
}

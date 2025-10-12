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
    address public verifier;
    uint256 public deadline;
    string public name;
    Milestone[] public milestones;
    mapping(address => uint256) private contributions;

    constructor(
        address _owner,
        address _verifier,
        uint256 _deadline,
        string memory _name,
        uint256[] memory _goals
    ) {
        owner = _owner;
        verifier = _verifier;
        name = _name;
        deadline = _deadline;

        uint256 len = _goals.length;
        for (uint256 i = 0; i < len; i++) {
            milestones.push(Milestone(Status.Pending, _goals[i]));
        }
    }

    modifier onlyVerifier() {
        require(
            msg.sender == verifier,
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

    function donate(uint256 sgdAmount) external nonReentrant {
        require(sgdAmount > 0, "Donations have to be greater than 0!");
        contributions[msg.sender] += sgdAmount;
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

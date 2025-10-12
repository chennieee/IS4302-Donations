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
    uint256 public deadline;
    string public name;
    Milestone[] public milestones;
    uint256 public amountRaised;

    constructor(
        address _owner,
        uint256 _deadline,
        string memory _name,
        uint256[] memory _goals
    ) {
        owner = _owner;
        name = _name;
        deadline = _deadline;
        amountRaised = 0;

        for (uint256 i = 0; i < _goals.length; i++) {
            milestones.push(Milestone(Status.Pending, _goals[i]));
        }
    }
}

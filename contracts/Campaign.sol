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

    address owner;
    uint256 deadline; //TODO3
    string name;
    Milestone[] milestones;
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

    function getOwner() public view returns (address) {
        return owner;
    }

    function getDeadline() public view returns (uint256) {
        return deadline;
    }

    function getName() public view returns (string memory) {
        return name;
    }
}

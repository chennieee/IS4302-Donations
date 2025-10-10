// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// for safety 
abstract contract ReentrancyGuardLite {
    uint256 private _status;
    constructor() { _status = 1; }
    modifier nonReentrant() {
        require(_status == 1, "Reentrancy");
        _status = 2;
        _;
        _status = 1;
    }
}

contract Campaign is ReentrancyGuardLite {
    address owner;
    uint256 deadline;
    string name;

    constructor (address _owner, uint256 _deadline, string memory _name) {
        owner = _owner;
        name = _name;
        deadline = _deadline;
    }

    function getOwner() public view returns(address){
        return owner;
    }

    function getDeadline() public view returns(uint256){
        return deadline;
    }

    function getName() public view returns(string memory){
        return name;
    }

}
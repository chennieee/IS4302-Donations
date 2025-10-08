// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function balanceOf(address a) external view returns (uint256);
    function transfer(address to, uint256 v) external returns (bool);
    function transferFrom(address f, address t, uint256 v) external returns (bool);
}

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

    error NativeNotAccepted();

    enum Milestone { Pending, Approved, Released, Rejected }

    event DonationReceived(address indexed donor, uint256 amount);
    event MilestoneApproved(uint256 indexed idx);
    event MilestoneRejected(uint256 indexed idx);
    event MilestoneReleased(uint256 indexed idx, uint256 amount);
    event Refunded(address indexed donor, uint256 amount);

    address public immutable organizer;
    IERC20 public immutable token;
    address public immutable verifier;
    uint256 public immutable deadline; // shld this be immutable? bc of the authority voting thing?

    uint256 public totalRaised;
    uint256 public totalReleased;
    bool public anyReleased;
    bool public anyRejected;

    uint256[] public trancheBps;
    Milestone[] public milestones;
    mapping(address => uint256) public contributed; // user -> contribution

    constructor(
        address _organizer,
        address _token,
        address _verifier,
        uint256[] memory _bps,
        uint256 _deadline
    )
        validAddresses(_organizer, _token, _verifier)
        validDeadline(_deadline)
        validTranches(_bps)
    {
        organizer = _organizer;
        token = IERC20(_token);
        verifier = _verifier;
        deadline = _deadline;
        trancheBps = _bps;
        milestones = new Milestone[](_bps.length);
    }

    modifier onlyVerifier() { 
        require(msg.sender == verifier, "Not verifier"); 
        _; 
    }
    modifier onlyOrganizer() { 
        require(msg.sender == organizer, "Not organizer"); 
        _; 
    }
    modifier validIdx(uint256 i) { 
        require(i < milestones.length, "OOB"); 
        _; 
    }
    modifier beforeDeadline() { 
        require(block.timestamp <= deadline, "Deadline passed"); 
        _; 
    }
    modifier refundOpen() { 
        require(isRefundOpen(), "Refund not open"); 
        _; 
    }
    modifier nonZero(uint256 a) { 
        require(a > 0, "Zero amount"); 
        _; 
    }

    // validation in constructor
    modifier validAddresses(address a, address t, address v) {
        require(a != address(0) && t != address(0) && v != address(0), "Zero address");
        _;
    }

    modifier validDeadline(uint256 d) {
        require(d > block.timestamp, "Bad deadline");
        _;
    }

    modifier validTranches(uint256[] memory bps) {
        require(bps.length > 0, "Empty tranches");
        uint256 s; for (uint256 i; i < bps.length; i++) s += bps[i];
        require(s <= 10_000, "Sum>100%");
        _;
    }

    // native rejection
    receive() external payable { 
        revert NativeNotAccepted(); 
    }
    fallback() external payable { 
        revert NativeNotAccepted(); 
    }

    // transfers (can combine with the action functions but ill leave these here first)
    function _safeTransfer(address t, address to, uint256 v) private returns (bool) {
        return IERC20(t).transfer(to, v);
    }

    function _safeTransferFrom(address t, address f, address to, uint256 v) private returns (bool) {
        return IERC20(t).transferFrom(f, to, v);
    }

    // actions!
    function donateToken(uint256 amt) external nonReentrant nonZero(amt) beforeDeadline {
        require(!anyReleased, "Already released");
        require(_safeTransferFrom(address(token), msg.sender, address(this), amt), "TransferFrom fail");

        contributed[msg.sender] += amt;
        totalRaised += amt;
        emit DonationReceived(msg.sender, amt);
    }

    function approveMilestone(uint256 idx) external onlyVerifier validIdx(idx) {
        require(milestones[idx] == Milestone.Pending, "Not pending");
        milestones[idx] = Milestone.Approved;
        emit MilestoneApproved(idx);
    }

    function rejectMilestone(uint256 idx) external onlyVerifier validIdx(idx) {
        require(milestones[idx] == Milestone.Pending, "Not pending");
        milestones[idx] = Milestone.Rejected;
        anyRejected = true;
        emit MilestoneRejected(idx);
    }

    function releaseMilestone(uint256 idx) external onlyOrganizer validIdx(idx) nonReentrant {
        require(milestones[idx] == Milestone.Approved, "Not approved");
        uint256 amt = (totalRaised * trancheBps[idx]) / 10_000;
        require(totalReleased + amt <= totalRaised, "Over-release");

        milestones[idx] = Milestone.Released;
        totalReleased += amt;
        anyReleased = true;

        require(_safeTransfer(address(token), organizer, amt), "Transfer fail");
        emit MilestoneReleased(idx, amt);
    }

    function refund() external nonReentrant refundOpen {
        uint256 amt = contributed[msg.sender];
        require(amt > 0, "Nothing to refund");

        contributed[msg.sender] = 0;
        require(_safeTransfer(address(token), msg.sender, amt), "Refund fail");
        emit Refunded(msg.sender, amt);
    }

    // view functions 
    function acceptedToken() external view returns (address) { 
        return address(token); 
    }
    function milestoneCount() external view returns (uint256) { 
        return milestones.length; 
    }
    function milestoneStatus(uint256 i) external view validIdx(i) returns (Milestone) { 
        return milestones[i]; 
    }
    function contributedOf(address a) external view returns (uint256) { 
        // no way to check if an address exists as a key in mapping :(
        return contributed[a]; 
    }
    function releasedSoFar() external view returns (uint256) { 
        return totalReleased; 
    }
    function pendingToRelease() external view returns (uint256) { 
        return totalRaised - totalReleased; 
    }
    function escrowTokenBalance() external view returns (uint256) { 
        return token.balanceOf(address(this)); 
    }
    function isRefundOpen() public view returns (bool) {
        return (!anyReleased) && (block.timestamp > deadline || anyRejected);
    }
}
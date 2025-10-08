// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Campaign.sol";

contract CampaignFactory {

    event CampaignCreated(
        address indexed organizer,
        address indexed campaign,
        address indexed token,
        address verifier,
        string ipfsCid,
        uint256 deadline
    );

    // registry of all campaigns
    address[] private _allCampaigns;

    modifier nonZeroAddrs(address tokenAddr, address verifier) {
        require(tokenAddr != address(0) && verifier != address(0), "Zero address");
        _;
    }

    modifier futureDeadline(uint256 deadline) {
        require(deadline > block.timestamp, "Bad deadline");
        _;
    }

    modifier validTranches(uint256[] memory bps) {
        require(bps.length > 0, "Empty tranches");
        uint256 sum;
        for (uint256 i = 0; i < bps.length; i++) sum += bps[i];
        require(sum <= 10_000, "Sum > 100%");
        _;
    }

    /**
     * @param ipfsCid   Metadata CID for off-chain description/media (logged in event)
     * @param tokenAddr ERC-20 accepted by the campaign (must be non-zero)
     * @param verifier  Address authorized to approve/reject milestones (non-zero)
     * @param trancheBps Milestone basis points, sum <= 10000 (length > 0)
     * @param deadline  UNIX timestamp; must be strictly in the future
     *
     * @return campaign The address of the newly created Campaign.
     */
    function create(
        string memory ipfsCid,
        address tokenAddr,
        address verifier,
        uint256[] memory trancheBps,
        uint256 deadline
    )
        external 
        nonZeroAddrs(tokenAddr, verifier) 
        futureDeadline(deadline) 
        validTranches(trancheBps) 
        returns (address campaign)
    {
        // organizer = msg.sender passed into Campaign constructor (matches Campaign.sol)
        Campaign c = new Campaign(msg.sender, tokenAddr, verifier, trancheBps, deadline);
        campaign = address(c);
        _allCampaigns.push(campaign);
        emit CampaignCreated(msg.sender, campaign, tokenAddr, verifier, ipfsCid, deadline);
    }

    // views - get from registry
    function getCampaigns() external view returns (address[] memory) {
        return _allCampaigns;
    }

    function campaignsCount() external view returns (uint256) {
        return _allCampaigns.length;
    }
}

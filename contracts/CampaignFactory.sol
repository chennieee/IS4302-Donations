// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20; // keep >= 0.8.20 for best compiler behavior on HH 2.x

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

    address[] private _allCampaigns;

    // validation helpers as functions instead of modifiers 
    // i tried w modifiers but got stack-too-deep compiler error when running test

    function _checkAddrs(address tokenAddr, address verifier) private pure {
        require(tokenAddr != address(0) && verifier != address(0), "Zero address");
    }

    function _checkDeadline(uint256 d) private view {
        require(d > block.timestamp, "Bad deadline");
    }

    function _checkTranches(uint256[] calldata bps) private pure {
        require(bps.length > 0, "Empty tranches");
        uint256 sum;
        for (uint256 i = 0; i < bps.length; i++) sum += bps[i];
        require(sum <= 10_000, "Sum>100%");
    }

    function create(
        string calldata ipfsCid, // calldata avoids creating extra memory variables that create stack pressure
        address tokenAddr,
        address verifier,
        uint256[] calldata trancheBps,
        uint256 deadline
    ) external returns (address campaign) {
        _checkAddrs(tokenAddr, verifier);
        _checkDeadline(deadline);
        _checkTranches(trancheBps);

        Campaign c = new Campaign(
            msg.sender, // organizer
            tokenAddr,
            verifier,
            trancheBps,
            deadline
        );
        campaign = address(c);
        _allCampaigns.push(campaign);

        emit CampaignCreated(msg.sender, campaign, tokenAddr, verifier, ipfsCid, deadline);
    }

    // -------- Views --------
    function getCampaigns() external view returns (address[] memory) {
        return _allCampaigns;
    }
    function campaignsCount() external view returns (uint256) {
        return _allCampaigns.length;
    }
}

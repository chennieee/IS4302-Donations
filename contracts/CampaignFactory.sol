// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Campaign.sol";

contract CampaignFactory {

    address[] public allCampaigns;

    event CampaignCreated(
        address organizer,
        address campaign,
        string name,
        uint256 deadline
    );
    
    function create(string memory name, uint256 timeDays) public returns(address) {
        require(timeDays > 0, "Input a valid number of days for this campaign to last");
        uint256 deadline = block.timestamp + (timeDays * 24 * 3600);
        Campaign newCampaign = new Campaign(msg.sender, deadline, name);
        address campaignAddress = address(newCampaign);
        allCampaigns.push(campaignAddress);
        emit CampaignCreated(msg.sender, campaignAddress, name, deadline);
        return campaignAddress;
    }

    // -------- Views --------
    function getCampaigns() public view returns (address[] memory) {
        return allCampaigns;
    }
    function campaignsCount() public view returns (uint256) {
        return allCampaigns.length;
    }
}

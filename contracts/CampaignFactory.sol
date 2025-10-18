// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Campaign.sol";

contract CampaignFactory {
    address[] public allCampaigns;

    event CampaignCreated(
        address organizer,
        address campaign,
        string name,
        uint256 deadline,
        uint256[] milestones
    );

    function create(
        string memory name,
        address[] memory verifiers,
        uint256 timeDays,
        uint256[] memory milestones
    ) public returns (address) {
        require(
            timeDays > 0,
            "Input a valid number of days for this campaign to last"
        );
        uint256 deadline = block.timestamp + (timeDays * 24 * 3600);
        Campaign newCampaign = new Campaign(
            msg.sender,
            verifiers,
            deadline,
            name,
            milestones
        );
        address campaignAddress = address(newCampaign);
        allCampaigns.push(campaignAddress);
        emit CampaignCreated(
            msg.sender,
            campaignAddress,
            name,
            deadline,
            milestones
        );
        return campaignAddress;
    }

    // -------- Views --------
    function getAllCampaigns() public view returns (address[] memory) {
        return allCampaigns;
    }

    function campaignsCount() public view returns (uint256) {
        return allCampaigns.length;
    }

    function getCampaign(uint256 index) public view returns (address) {
        require(index < allCampaigns.length, "not a valid index");
        return allCampaigns[index];
    }
}

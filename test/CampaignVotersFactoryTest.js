/* eslint-disable no-undef */
const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

describe("CampaignVotersFactory", function () {
    let CampaignVotersFactory;
    let votersFactory, owner, verifier;

    beforeEach(async () => {
        [owner, verifier] = await ethers.getSigners();
        CampaignVotersFactory = await ethers.getContractFactory("CampaignVotersFactory");
        votersFactory = await CampaignVotersFactory.deploy();
        await votersFactory.waitForDeployment();
    });

    it("campaign creation successful", async () => {
        const campaignName = "cmpgn"
        const tx = await votersFactory.connect(owner).create(campaignName, [verifier], 1, [])
        expect(tx).to.not.be.reverted;
        expect(await tx.wait()).to.emit(votersFactory, "CampaignCreated");

        // Assume we can get contract address, can improve this by parsing event logs instead
        const addr = await votersFactory.getCampaign(0);
        const campaign = await ethers.getContractAt("CampaignVoters", addr);
        expect(await campaign.owner()).to.equal(await owner.getAddress());
        expect(await campaign.name()).to.equal(campaignName);
    });

    it("campaigns are being tracked (added to allCampaigns)", async () => {
        expect((await votersFactory.getAllCampaigns()).length).to.equal(0);
        expect(await votersFactory.campaignsCount()).to.equal(0);

        const t1 = await votersFactory.create("f", [], 1, []);
        expect(await t1.wait()).to.emit(votersFactory, "CampaignCreated");
        const t2 = await votersFactory.create("s", [], 1, []);
        expect(await t2.wait()).to.emit(votersFactory, "CampaignCreated");

        expect((await votersFactory.getAllCampaigns()).length).to.equal(2);
        expect(await votersFactory.campaignsCount()).to.equal(2n);
    });

    it("getCampaign reverts on invalid index", async () => {
        await expect(votersFactory.getCampaign(99)).to.be.reverted;
    });
});

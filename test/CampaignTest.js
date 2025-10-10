/* eslint-disable no-undef */
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CampaignFactory", function () {
  let CampaignFactory;
  let factory, owner, user;
  let campaign0, campaign1, campaign2, campaign3, campaign4, campaign5;


  before(async () => {
    [owner, user] = await ethers.getSigners();
    CampaignFactory = await ethers.getContractFactory("CampaignFactory");
    factory = await CampaignFactory.deploy();
    await factory.waitForDeployment();
    console.log("Campaign Factory deployed at: " + await factory.getAddress());
  });

  it("deploys a Campaign properly and reads its state", async () => {
    const now = (await ethers.provider.getBlock("latest")).timestamp;
    const name = "My First Campaign";
    const days = 7;
    const deadline = now + days * 24 * 3600;
    const tx = await factory.connect(user).create(name, 7);
    await tx.wait();
    campaign0Address = (await factory.getCampaigns())[0];
    campaign0 = await ethers.getContractAt("Campaign", campaign0Address);
    console.log("Campaign0 deployed at: " + campaign0Address);
    expect(await campaign0.getOwner()).to.equal(await user.getAddress(), "campaign's owner is not user");
    expect(await campaign0.getName()).to.equal(name, "campaign's name is not correct");

  });

});

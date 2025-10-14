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

  it("1. deploys a Campaign properly and reads its state", async () => {
    const name = "My First Campaign";
    const tx = await factory.connect(owner).create(name, 7, 10);
    await tx.wait();
    campaign0Address = (await factory.getCampaign(0));
    campaign0 = await ethers.getContractAt("Campaign", campaign0Address);
    console.log("Campaign0 deployed at: " + campaign0Address);
    expect(await campaign0.getOwner()).to.equal(await owner.getAddress(), "campaign's owner is not user");
    expect(await campaign0.getName()).to.equal(name, "campaign's name is not correct");

  });
  it("2. Campaign can allow for donations properly and check status", async () => {
    expect(await campaign0.getTotalRaised()).to.equal(0, "totalRaised amount is incorrect");
    expect(await campaign0.getGoal()).to.equal(10, "goal does not align with previous input");
    const ONE_ETH = ethers.parseEther("1");
    const tx = await campaign0.connect(user).donate({value: ONE_ETH});
    await tx.wait();
    expect(await campaign0.getTotalRaised()).to.equal(1, "new totalRaised amount is incorrect");
  });


});

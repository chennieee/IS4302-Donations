/* eslint-disable no-undef */
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CampaignFactory", function () {
  let CampaignFactory;
  let factory, owner, user, verifier, other;
  let campaign0, campaign1, campaign2;


  before(async () => {
    [owner, user, verifier, other] = await ethers.getSigners();
    CampaignFactory = await ethers.getContractFactory("CampaignFactory");
    factory = await CampaignFactory.deploy();
    await factory.waitForDeployment();
    console.log("Campaign Factory deployed at: " + await factory.getAddress());
  });

  it("1. deploys a Campaign properly and reads its state", async () => {
    const name = "My First Campaign";
    const tx = await factory.connect(owner).create(name, [verifier], 7, [10]);
    await tx.wait();
    campaign0Address = (await factory.getCampaign(0));
    campaign0 = await ethers.getContractAt("Campaign", campaign0Address);
    console.log("Campaign0 deployed at: " + campaign0Address);
    expect(await campaign0.owner()).to.equal(await owner.getAddress(), "campaign's owner is not user");
    expect(await campaign0.name()).to.equal(name, "campaign's name is not correct");

  });
  it("2. Campaign can allow for donations properly and check status", async () => {
    expect(await campaign0.totalRaised()).to.equal(0, "totalRaised amount is incorrect");
    const ONE_ETH = ethers.parseEther("1");
    const tx = await campaign0.connect(user).donate({ value: ONE_ETH });
    await tx.wait();
    expect(await campaign0.totalRaised()).to.equal(1, "new totalRaised amount is incorrect");
  });
  it("3. tracks campaigns in factory getters (count and list length)", async () => {
    // Initially 1 campaign
    const count0 = await factory.campaignsCount();
    const list0 = await factory.getAllCampaigns();
    expect(count0).to.equal(1n, "initial campaignsCount should be 1");
    expect(list0.length).to.equal(1, "initial getAllCampaigns length should be 1");

    // Create two more campaigns
    const t1 = await factory.create("Second", [verifier], 123, [5, 15]);
    await t1.wait();
    const t2 = await factory.create("Third", [verifier], 999, [20]);
    await t2.wait();

    const count = await factory.campaignsCount();
    const list = await factory.getAllCampaigns();
    expect(count).to.equal(3n, "campaignsCount should reflect new deployments");
    expect(list.length).to.equal(3, "getAllCampaigns length should reflect new deployments");
  });

  it("4. getCampaign reverts on invalid index", async () => {
    await expect(factory.getCampaign(99)).to.be.reverted;
  });

  it("5. initial verifier set, add/remove verifier, and revert on duplicates", async () => {
    // initial
    expect(await campaign0.isVerifier(verifier.address)).to.equal(true, "initial verifier should be set");

    // add a new verifier (by owner)
    const addTx = await campaign0.connect(owner).addVerifier(user.address);
    await addTx.wait();
    expect(await campaign0.isVerifier(user.address)).to.equal(true, "newly added verifier should be true");

    // adding same verifier again should revert
    await expect(campaign0.connect(owner).addVerifier(user.address)).to.be.revertedWith("Address is already a verifier");

    // remove verifier (by owner)
    const rmTx = await campaign0.connect(owner).removeVerifier(user.address);
    await rmTx.wait();
    expect(await campaign0.isVerifier(user.address)).to.equal(false, "removed verifier should be false");

    // removing again should revert
    await expect(campaign0.connect(owner).removeVerifier(user.address)).to.be.revertedWith("Address is already not a verifier");
  });

  it("6. only owner can add/remove verifiers", async () => {
    await expect(campaign0.connect(user).addVerifier(other.address)).to.be.reverted;
    await expect(campaign0.connect(user).removeVerifier(verifier.address)).to.be.reverted;
  });

  it("7. donation requires non-zero value; balance increases on donate", async () => {
    await expect(campaign0.connect(user).donate({ value: 0 })).to.be.reverted;

    const beforeBal = await ethers.provider.getBalance(await campaign0.getAddress());
    const oneEth = ethers.parseEther("1");
    const tx = await campaign0.connect(user).donate({ value: oneEth });
    await tx.wait();

    const afterBal = await ethers.provider.getBalance(await campaign0.getAddress());
    expect(afterBal - beforeBal).to.equal(oneEth, "contract balance should increase by donated amount");

    // Refund is allowed before first milestone is hit and only one milestone exists
    const prevTotal = await campaign0.totalRaised();
    const userBefore = await campaign0.connect(user).getContribution();
    expect(userBefore).to.be.greaterThan(0n, "user should have a contribution before refund");

    // Non-contributor cannot refund
    await expect(campaign0.connect(other).refund()).to.be.revertedWith("No contribution to return!");

    const rtx = await campaign0.connect(user).refund();
    await rtx.wait();

    // After refund, user's contribution is zero and totalRaised reduced by that amount (in contract units)
    const userAfter = await campaign0.connect(user).getContribution();
    expect(userAfter).to.equal(0n, "user contribution should be cleared after refund");
    const newTotal = await campaign0.totalRaised();
    expect(newTotal).to.equal(prevTotal - userBefore, "totalRaised should drop by refunded amount");
  });

  it("8. milestones and basic fields are correctly stored per campaign", async () => {
    // Use the second campaign created in test 3
    const addr1 = await factory.getCampaign(1);
    campaign1 = await ethers.getContractAt("Campaign", addr1);
    expect(await campaign1.name()).to.equal("Second");
    // public array getter
    const m0 = await campaign1.milestones(0);
    const m1 = await campaign1.milestones(1);
    expect(m0).to.equal(5n);
    expect(m1).to.equal(15n);

    const addr2 = await factory.getCampaign(2);
    campaign2 = await ethers.getContractAt("Campaign", addr2);
    expect(await campaign2.name()).to.equal("Third");
    const m2 = await campaign2.milestones(0);
    expect(m2).to.equal(20n);
  });

  it("9. owners are set correctly per deployee", async () => {
    expect(await campaign0.owner()).to.equal(await owner.getAddress());
    const c1 = await factory.getCampaign(1);
    const c2 = await factory.getCampaign(2);
    const cmp1 = await ethers.getContractAt("Campaign", c1);
    const cmp2 = await ethers.getContractAt("Campaign", c2);
    // factory.create is called by the same owner here, so owner should be the deployer
    expect(await cmp1.owner()).to.equal(await owner.getAddress());
    expect(await cmp2.owner()).to.equal(await owner.getAddress());
  });

  it("10. proposal flow works: propose, accept/reject, and guards", async () => {
    // Only owner can propose a new milestone
    await expect(campaign0.connect(user).proposeNewMilestone(12)).to.be.reverted;

    // Owner proposes a new milestone greater than the last
    const ptx = await campaign0.connect(owner).proposeNewMilestone(12);
    await ptx.wait();

    // Proposal should be retrievable
    const proposal = await campaign0.getCurrentProposal();
    expect(proposal).to.equal(12n, "current proposal should match proposed milestone");

    // Cannot propose another while one is in progress
    await expect(campaign0.connect(owner).proposeNewMilestone(15)).to.be.revertedWith(
      "Wait for current proposal to complete!"
    );

    // Only verifiers can accept/reject; non-verifier should revert
    await expect(campaign0.connect(user).acceptProposal()).to.be.reverted;

    // Accept the proposal as a verifier; milestone should be appended
    const acc = await campaign0.connect(verifier).acceptProposal();
    await acc.wait();
    const appended = await campaign0.milestones(1);
    expect(appended).to.equal(12n, "accepted milestone should be appended as next milestone");

    // No active proposal now
    await expect(campaign0.getCurrentProposal()).to.be.revertedWith("There is no ongoing proposals");

    // After there are multiple milestones, refunds should no longer be allowed
    const oneEth = ethers.parseEther("1");
    const dtx = await campaign0.connect(user).donate({ value: oneEth });
    await dtx.wait();
    await expect(campaign0.connect(user).refund()).to.be.revertedWith("Funds can no longer be returned!");

    // Propose another milestone and then reject it
    const ptx2 = await campaign0.connect(owner).proposeNewMilestone(20);
    await ptx2.wait();
    const proposal2 = await campaign0.getCurrentProposal();
    expect(proposal2).to.equal(20n);
    // Non-verifier cannot reject
    await expect(campaign0.connect(user).rejectProposal()).to.be.reverted;
    // Verifier rejects; it should not append another milestone
    const rej = await campaign0.connect(verifier).rejectProposal();
    await rej.wait();
    await expect(campaign0.getCurrentProposal()).to.be.revertedWith("There is no ongoing proposals");
    const second = await campaign0.milestones(1);
    expect(second).to.equal(12n, "reject should not change existing milestones");
    await expect(campaign0.milestones(2)).to.be.reverted;
  });

});

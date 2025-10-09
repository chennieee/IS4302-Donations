const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

// LOADFIXTURE: a more efficient way than beforeEach to reuse a pre-deployed environment across multiple tests
// 100_000: underscores (JavaScript numeric literal separator) just for readability 

async function deployFixture() {
  const [deployer, organizer, verifier, alice, bob, random] = await ethers.getSigners();

  // deploy your ERC20 (owner = deployer)
  const ERC20 = await ethers.getContractFactory("ERC20");
  const token = await ERC20.deploy();
  await token.waitForDeployment();
  const tokenAddr = await token.getAddress();

  // mint funds to donors
  const ONE = 10n ** 18n;
  await token.mint(alice.address, 1_000_000n * ONE);
  await token.mint(bob.address, 1_000_000n * ONE);

  // deploy campaign factory 
  const Factory = await ethers.getContractFactory("CampaignFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();

  // create a campaign (3 milestones: 50/30/20)
  const now = await time.latest();
  const deadline = now + 7 * 24 * 60 * 60; // 7 days
  const tranches = [5000, 3000, 2000];

  const tx = await factory
    .connect(organizer)
    .create("ipfs://cid", token.target, verifier.address, tranches, deadline);

  const rc = await tx.wait();
  const event = rc.logs.find((l) => l.fragment && l.fragment.name === "CampaignCreated");
  const campaignAddr = event.args.campaign;

  const Campaign = await ethers.getContractFactory("Campaign");
  const campaign = await Campaign.attach(campaignAddr);

  return { deployer, organizer, verifier, alice, bob, random, token, tokenAddr, factory, campaign, ONE, deadline, tranches };
}

describe("Campaign (token-only escrow)", function () {
  // happy paths!
  it("donate (ERC-20) increases totals and emits", async () => {
    const { campaign, token, alice, ONE } = await loadFixture(deployFixture);

    const amt = 100_000n * ONE;
    await token.connect(alice).approve(campaign.target, amt);

    await expect(campaign.connect(alice).donateToken(amt))
      .to.emit(campaign, "DonationReceived")
      .withArgs(alice.address, amt);

    expect(await campaign.pendingToRelease()).to.equal(amt);
    expect(await campaign.releasedSoFar()).to.equal(0);
    expect(await campaign.contributedOf(alice.address)).to.equal(amt);
    expect(await token.balanceOf(campaign.target)).to.equal(amt);
  });

  it("approve -> release pays out correct tranche and updates totals", async () => {
    const { campaign, token, organizer, verifier, alice, ONE } = await loadFixture(deployFixture);

    const amt = 200_000n * ONE;
    await token.connect(alice).approve(campaign.target, amt);
    await campaign.connect(alice).donateToken(amt);

    // milestone 0 = 50%
    const tranche0 = (amt * 5000n) / 10000n;

    await expect(campaign.connect(verifier).approveMilestone(0))
      .to.emit(campaign, "MilestoneApproved")
      .withArgs(0);

    await expect(campaign.connect(organizer).releaseMilestone(0))
      .to.emit(campaign, "MilestoneReleased")
      .withArgs(0, tranche0);

    expect(await token.balanceOf(organizer.address)).to.equal(tranche0);
    expect(await campaign.releasedSoFar()).to.equal(tranche0);
    expect(await campaign.pendingToRelease()).to.equal(amt - tranche0);
  });

  it("refund after deadline (no releases)", async () => {
    const { campaign, token, alice, ONE, deadline } = await loadFixture(deployFixture);

    const amt = 50_000n * ONE;
    await token.connect(alice).approve(campaign.target, amt);
    await campaign.connect(alice).donateToken(amt);

    await time.increaseTo(deadline + 1); // after deadline

    await expect(campaign.connect(alice).refund())
      .to.emit(campaign, "Refunded")
      .withArgs(alice.address, amt);

    expect(await campaign.contributedOf(alice.address)).to.equal(0);
    expect(await token.balanceOf(campaign.target)).to.equal(0);
  });

  it("refund after reject (no releases)", async () => {
    const { campaign, token, verifier, alice, ONE } = await loadFixture(deployFixture);

    const amt = 10_000n * ONE;
    await token.connect(alice).approve(campaign.target, amt);
    await campaign.connect(alice).donateToken(amt);

    await expect(campaign.connect(verifier).rejectMilestone(0))
      .to.emit(campaign, "MilestoneRejected")
      .withArgs(0);

    await expect(campaign.connect(alice).refund())
      .to.emit(campaign, "Refunded")
      .withArgs(alice.address, amt);

    expect(await token.balanceOf(campaign.target)).to.equal(0);
  });

  // reverts!
  it("reverts: non-verifier approve/reject", async () => {
    const { campaign, alice } = await loadFixture(deployFixture);
    await expect(campaign.connect(alice).approveMilestone(0)).to.be.revertedWith("Not verifier");
    await expect(campaign.connect(alice).rejectMilestone(0)).to.be.revertedWith("Not verifier");
  });

  it("reverts: non-organizer release", async () => {
    const { campaign, token, verifier, alice, bob, ONE } = await loadFixture(deployFixture);

    const amt = 5_000n * ONE;
    await token.connect(alice).approve(campaign.target, amt);
    await campaign.connect(alice).donateToken(amt);

    await campaign.connect(verifier).approveMilestone(0);
    await expect(campaign.connect(bob).releaseMilestone(0)).to.be.revertedWith("Not organizer");
  });

  it("reverts: double release and OOB milestone", async () => {
    const { campaign, token, organizer, verifier, alice, ONE } = await loadFixture(deployFixture);

    const amt = 3_000n * ONE;
    await token.connect(alice).approve(campaign.target, amt);
    await campaign.connect(alice).donateToken(amt);

    await campaign.connect(verifier).approveMilestone(0);
    await campaign.connect(organizer).releaseMilestone(0);

    // double release hits "Not approved" (since status is now Released)
    await expect(campaign.connect(organizer).releaseMilestone(0)).to.be.revertedWith("Not approved");

    // OOB
    await expect(campaign.connect(verifier).approveMilestone(999)).to.be.revertedWith("OOB");
  });

  it("reverts: donate zero amount", async () => {
    const { campaign } = await loadFixture(deployFixture);
    await expect(campaign.donateToken(0)).to.be.revertedWith("Zero amount");
  });

  it("reverts: donate after deadline", async () => {
  const { deployer, organizer, verifier, tokenAddr, factory } = await loadFixture(deployFixture);

  // create a campaign with a valid (near-future) deadline
  const now = await time.latest();
  const nearFuture = now + 60; // 60 seconds from now
  const tranches = [10000];

  const tx = await factory
    .connect(organizer)
    .create("cid", tokenAddr, verifier.address, tranches, nearFuture);

  const rc = await tx.wait();
  const ev = rc.logs.find(l => l.fragment && l.fragment.name === "CampaignCreated");
  const campaignAddr = ev.args.campaign;
  const campaign = await ethers.getContractAt("Campaign", campaignAddr);

  // advance time beyond the deadline
  await time.increaseTo(nearFuture + 1);

  // attempt to donate (no need to approve; check happens before transferFrom)
  await expect(campaign.donateToken(1)).to.be.revertedWith("Deadline passed");
});


  it("reverts: refund before allowed", async () => {
    const { campaign, token, alice, ONE } = await loadFixture(deployFixture);

    const amt = 1_000n * ONE;
    await token.connect(alice).approve(campaign.target, amt);
    await campaign.connect(alice).donateToken(amt);

    await expect(campaign.connect(alice).refund()).to.be.revertedWith("Refund not open");
  });

  it("reverts: tranche sum > 10000 at factory.create", async () => {
    const { factory, token, verifier, organizer } = await loadFixture(deployFixture);
    const now = await time.latest();

    await expect(
      factory.connect(organizer).create("cid", token.target, verifier.address, [8000, 3001], now + 3600)
    ).to.be.revertedWith("Sum>100%");
  });

  // invariants
  it("invariants: totalReleased <= totalRaised; transitions only from Pending", async () => {
    const { campaign, token, organizer, verifier, alice, ONE } = await loadFixture(deployFixture);

    const amt = 77_000n * ONE;
    await token.connect(alice).approve(campaign.target, amt);
    await campaign.connect(alice).donateToken(amt);

    await campaign.connect(verifier).approveMilestone(0);
    await campaign.connect(organizer).releaseMilestone(0);

    const released = await campaign.releasedSoFar();
    const raised = (await campaign.pendingToRelease()) + released;
    expect(released).to.be.lte(raised);

    // cannot approve/reject non-Pending milestone (already Released)
    await expect(campaign.connect(verifier).rejectMilestone(0)).to.be.revertedWith("Not pending");
    await expect(campaign.connect(verifier).approveMilestone(0)).to.be.revertedWith("Not pending");
  });

  it("invariant: refunds never exceed contributed", async () => {
    const { campaign, token, alice, verifier, ONE } = await loadFixture(deployFixture);

    const amt = 12_345n * ONE;
    await token.connect(alice).approve(campaign.target, amt);
    await campaign.connect(alice).donateToken(amt);

    // trigger refunds by rejecting first milestone
    await campaign.connect(verifier).rejectMilestone(0);

    const beforeBal = await token.balanceOf(alice.address);
    await campaign.connect(alice).refund();
    const afterBal = await token.balanceOf(alice.address);

    expect(afterBal - beforeBal).to.equal(amt);
    expect(await campaign.contributedOf(alice.address)).to.equal(0);
    expect(await token.balanceOf(campaign.target)).to.equal(0);
  });
});

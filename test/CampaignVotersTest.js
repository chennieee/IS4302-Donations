/* eslint-disable no-undef */
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CampaignVoters", function () {
  let CampaignVotersFactory;
  let votersFactory, owner, user, verifier, verifier2, verifier3, other;
  let campaign0, campaign1, campaign2, campaign3, campaign4;

  beforeEach(async () => {
    [owner, user, verifier, other] = await ethers.getSigners();
    CampaignVotersFactory = await ethers.getContractFactory("CampaignVotersFactory");
    votersFactory = await CampaignVotersFactory.deploy();
    await votersFactory.waitForDeployment();

    await (await votersFactory.create("First", [verifier], 7, [10])).wait();
    await (await votersFactory.create("Second", [verifier], 123, [5, 15])).wait();
    await (await votersFactory.create("Third", [verifier], 999, [20])).wait();

    const campaign0Address = await votersFactory.getCampaign(0);
    campaign0 = await ethers.getContractAt("CampaignVoters", campaign0Address);

    const campaign1Address = await votersFactory.getCampaign(1);
    campaign1 = await ethers.getContractAt("CampaignVoters", campaign1Address);

    const campaign2Address = await votersFactory.getCampaign(2);
    campaign2 = await ethers.getContractAt("CampaignVoters", campaign2Address);
  });

  it("Campaign can allow for donations properly and check status", async () => {
    expect(await campaign0.totalRaised()).to.equal(0);
    const ONE_ETH = ethers.parseEther("1");
    const tx = await campaign0.connect(user).donate({ value: ONE_ETH });
    await tx.wait();
    expect(await campaign0.totalRaised()).to.equal(1);
  });

  it("initial verifier set, add/remove verifier, and revert on duplicates", async () => {
    expect(await campaign0.isVerifier(verifier.address)).to.equal(true);
    const addTx = await campaign0.connect(owner).addVerifier(user.address);
    await addTx.wait();
    expect(await campaign0.isVerifier(user.address)).to.equal(true);
    await expect(campaign0.connect(owner).addVerifier(user.address)).to.be.revertedWith("Address is already a verifier");
    const rmTx = await campaign0.connect(owner).removeVerifier(user.address);
    await rmTx.wait();
    expect(await campaign0.isVerifier(user.address)).to.equal(false);
    await expect(campaign0.connect(owner).removeVerifier(user.address)).to.be.revertedWith("Address is already not a verifier");
  });

  it("only owner can add/remove verifiers", async () => {
    await expect(campaign0.connect(user).addVerifier(other.address)).to.be.reverted;
    await expect(campaign0.connect(user).removeVerifier(verifier.address)).to.be.reverted;
  });

  it("donation requires non-zero value; balance increases on donate", async () => {
    await expect(campaign0.connect(user).donate({ value: 0 })).to.be.reverted;
    const onePointFive = ethers.parseEther("1.5");
    await expect(campaign0.connect(user).donate({ value: onePointFive }))
      .to.be.revertedWith("Donations must be whole ETH multiples");

    const beforeBal = await ethers.provider.getBalance(await campaign0.getAddress());
    const oneEth = ethers.parseEther("1");
    const tx = await campaign0.connect(user).donate({ value: oneEth });
    await tx.wait();

    const afterBal = await ethers.provider.getBalance(await campaign0.getAddress());
    expect(afterBal - beforeBal).to.equal(oneEth);

    const prevTotal = await campaign0.totalRaised();
    const userBefore = await campaign0.connect(user).getContribution(user.address);
    expect(userBefore).to.be.greaterThan(0n);

    await expect(campaign0.connect(other).refund()).to.be.revertedWith("No contribution to return!");

    const rtx = await campaign0.connect(user).refund();
    await rtx.wait();

    const userAfter = await campaign0.connect(user).getContribution(user.address);
    expect(userAfter).to.equal(0n);
    const newTotal = await campaign0.totalRaised();
    expect(newTotal).to.equal(prevTotal - userBefore);
  });

  it("milestones and basic fields are correctly stored per campaign", async () => {

    expect(await campaign1.name()).to.equal("Second");
    const m0 = await campaign1.milestones(0);
    const m1 = await campaign1.milestones(1);
    expect(m0).to.equal(5n);
    expect(m1).to.equal(15n);

    expect(await campaign2.name()).to.equal("Third");
    const m2 = await campaign2.milestones(0);
    expect(m2).to.equal(20n);
  });

  it("owners are set correctly per deployee", async () => {
    expect(await campaign0.owner()).to.equal(await owner.getAddress());
    const c1 = await votersFactory.getCampaign(1);
    const c2 = await votersFactory.getCampaign(2);
    const cmp1 = await ethers.getContractAt("CampaignVoters", c1);
    const cmp2 = await ethers.getContractAt("CampaignVoters", c2);
    expect(await cmp1.owner()).to.equal(await owner.getAddress());
    expect(await cmp2.owner()).to.equal(await owner.getAddress());
  });

  it("proposal flow works via votes and guards", async () => {
    await expect(campaign0.connect(user).proposeNewMilestone(12)).to.be.reverted;
    const ptx = await campaign0.connect(owner).proposeNewMilestone(12);
    await ptx.wait();
    const info = await campaign0.getCurrentProposal();
    expect(info[0]).to.equal(12n);
    await expect(campaign0.connect(owner).proposeNewMilestone(15)).to.be.revertedWith(
      "Wait for current proposal to complete!"
    );
    // cast all required votes (owner + initial verifier)
    await (await campaign0.connect(verifier).voteOnProposal(true)).wait();
    await (await campaign0.connect(owner).voteOnProposal(true)).wait();
    await expect(campaign0.getCurrentProposal()).to.be.revertedWith("No proposal in progress!");
    const appended = await campaign0.milestones(1);
    expect(appended).to.equal(12n);
    const oneEth = ethers.parseEther("1");
    const dtx = await campaign0.connect(user).donate({ value: oneEth });
    await dtx.wait();
    await expect(campaign0.connect(user).refund()).to.be.revertedWith("Funds can no longer be returned!");
    // propose and then vote reject
    const ptx2 = await campaign0.connect(owner).proposeNewMilestone(20);
    await ptx2.wait();
    await (await campaign0.connect(verifier).voteOnProposal(false)).wait();
    await (await campaign0.connect(owner).voteOnProposal(false)).wait();
    await expect(campaign0.getCurrentProposal()).to.be.revertedWith("No proposal in progress!");
    const second = await campaign0.milestones(1);
    expect(second).to.equal(12n);
    await expect(campaign0.milestones(2)).to.be.reverted;
  });

  it("refundAll onlyOwner after deadline refunds all and zeroes state", async () => {
    const name = "RefundAll";
    const createTx = await votersFactory.connect(owner).create(name, [verifier], 1, [100]);
    await createTx.wait();
    const count = await votersFactory.campaignsCount();
    const lastIdx = count - 1n;
    const addr = await votersFactory.getCampaign(lastIdx);
    const cmp = await ethers.getContractAt("CampaignVoters", addr);
    const ONE_ETH = ethers.parseEther("1");
    await (await cmp.connect(user).donate({ value: ONE_ETH })).wait();
    await (await cmp.connect(other).donate({ value: ONE_ETH })).wait();
    const list = await cmp.getContributors();
    expect(list).to.include.members([user.address, other.address]);
    await expect(cmp.connect(owner).refundAll()).to.be.reverted;
    await ethers.provider.send("evm_increaseTime", [24 * 3600 + 1]);
    await ethers.provider.send("evm_mine", []);
    await expect(cmp.connect(user).refundAll()).to.be.reverted;
    const totalBefore = await cmp.totalRaised();
    const uBefore = await cmp.connect(user).getContribution(user.address);
    const oBefore = await cmp.connect(other).getContribution(other.address);
    expect(uBefore).to.equal(1n);
    expect(oBefore).to.equal(1n);
    const rtx = await cmp.connect(owner).refundAll();
    await rtx.wait();
    const uAfter = await cmp.connect(user).getContribution(user.address);
    const oAfter = await cmp.connect(other).getContribution(other.address);
    const totalAfter = await cmp.totalRaised();
    expect(uAfter).to.equal(0n);
    expect(oAfter).to.equal(0n);
    expect(totalAfter).to.equal(totalBefore - uBefore - oBefore);
    const totalAgainBefore = await cmp.totalRaised();
    await expect(cmp.connect(owner).refundAll()).to.be.revertedWith(
      "No contribution to return!"
    );
    const totalAgainAfter = await cmp.totalRaised();
    expect(totalAgainAfter).to.equal(totalAgainBefore);
  });

  // CampaignVoters-specific tests
  it("CampaignVoters: propose and voting requires all votes or deadline to finalize", async () => {
    // Fetch additional signers for voters
    const all = await ethers.getSigners();
    verifier2 = all[4];
    verifier3 = all[5];
    verifier4 = all[6];

    const tx = await votersFactory.connect(owner).create(
      "Voters A",
      [verifier.address, verifier2.address, verifier3.address],
      7,
      [10]
    );
    await tx.wait();
    const count = await votersFactory.campaignsCount();
    const idx = count - 1n;
    const addr = await votersFactory.getCampaign(idx);
    campaign3 = await ethers.getContractAt("CampaignVoters", addr);

    const p = await campaign3.connect(owner).proposeNewMilestone(12);
    await p.wait();
    const info = await campaign3.getCurrentProposal();
    expect(info[0]).to.equal(12n);
    expect(info[5]).to.equal(4n);

    await (await campaign3.connect(verifier).voteOnProposal(true)).wait();
    await (await campaign3.connect(verifier2).voteOnProposal(true)).wait();
    const stillActive = await campaign3.getCurrentProposal();
    expect(stillActive[0]).to.equal(12n);

    await (await campaign3.connect(verifier3).voteOnProposal(true)).wait();
    const stillActive2 = await campaign3.getCurrentProposal();
    expect(stillActive2[0]).to.equal(12n);

    await (await campaign3.connect(owner).voteOnProposal(true)).wait();
    await expect(campaign3.getCurrentProposal()).to.be.revertedWith("No proposal in progress!");
    const appended = await campaign3.milestones(1);
    expect(appended).to.equal(12n);
  });

  it("CampaignVoters: block add/remove during proposal; allow after finalize", async () => {
    const t = await votersFactory.create("Voters B", [verifier.address, verifier2.address], 7, [10]);
    await t.wait();
    const count = await votersFactory.campaignsCount();
    const idx = count - 1n;
    const addr = await votersFactory.getCampaign(idx);
    campaign4 = await ethers.getContractAt("CampaignVoters", addr);

    await (await campaign4.connect(owner).proposeNewMilestone(15)).wait();

    await expect(campaign4.connect(owner).addVerifier(verifier3.address)).to.be.revertedWith(
      "Wait for current proposal to complete!"
    );
    await expect(campaign4.connect(owner).removeVerifier(verifier.address)).to.be.revertedWith(
      "Wait for current proposal to complete!"
    );

    await (await campaign4.connect(verifier).voteOnProposal(true)).wait();
    await (await campaign4.connect(verifier2).voteOnProposal(false)).wait();
    await (await campaign4.connect(owner).voteOnProposal(true)).wait();

    await expect(campaign4.getCurrentProposal()).to.be.revertedWith("No proposal in progress!");

    await (await campaign4.connect(owner).addVerifier(verifier3.address)).wait();
    expect(await campaign4.isVerifier(verifier3.address)).to.equal(true);
    await (await campaign4.connect(owner).removeVerifier(verifier2.address)).wait();
    expect(await campaign4.isVerifier(verifier2.address)).to.equal(false);
  });

  it("CampaignVoters: finalize after deadline when not all votes are in (tie rejects)", async () => {
    const t = await votersFactory.create("Voters C", [verifier.address, verifier2.address], 1, [10]);
    await t.wait();
    const count = await votersFactory.campaignsCount();
    const idx = count - 1n;
    const addr = await votersFactory.getCampaign(idx);
    campaign4 = await ethers.getContractAt("CampaignVoters", addr);

    await (await campaign4.connect(owner).proposeNewMilestone(20)).wait();
    await (await campaign4.connect(verifier).voteOnProposal(true)).wait();
    await (await campaign4.connect(verifier2).voteOnProposal(false)).wait();

    await ethers.provider.send("evm_increaseTime", [24 * 3600 + 5]);
    await ethers.provider.send("evm_mine", []);

    await (await campaign4.connect(verifier).checkFinalize()).wait();

    await expect(campaign4.getCurrentProposal()).to.be.revertedWith("No proposal in progress!");
    await expect(campaign4.milestones(1)).to.be.reverted;
  });

  it("CampaignVoters: deadline extension accepted updates deadline and emits", async () => {
    // Create a campaign with 3 verifiers total (owner is auto-added)
    const tx = await votersFactory.create(
      "Voters Deadline Accept",
      [verifier.address, verifier2.address],
      3,
      [10]
    );
    await tx.wait();
    const count = await votersFactory.campaignsCount();
    const idx = count - 1n;
    const addr = await votersFactory.getCampaign(idx);
    const cmp = await ethers.getContractAt("CampaignVoters", addr);

    const before = await cmp.deadline();
    const requestedDays = 5n;

    // Propose extension and verify proposal shape
    const ptx = await cmp.connect(owner).proposeNewDeadline(requestedDays);
    await ptx.wait();
    const info = await cmp.getCurrentProposal();
    expect(info[0]).to.equal(1n); // sentinel for deadline proposal
    const proposedDays = await cmp.getNewDeadline();
    expect(proposedDays).to.equal(requestedDays);

    // Votes: verifier + verifier2 + owner (finalizes)
    await (await cmp.connect(verifier).voteOnProposal(true)).wait();
    await (await cmp.connect(verifier2).voteOnProposal(true)).wait();

    const expectedNewDeadline = before + requestedDays * 24n * 3600n;
    const lastVoteTx = await cmp.connect(owner).voteOnProposal(true);
    await expect(lastVoteTx)
      .to.emit(cmp, "DeadlineAccepted")
      .withArgs(expectedNewDeadline);

    await expect(cmp.getCurrentProposal()).to.be.revertedWith("No proposal in progress!");
    await expect(cmp.getNewDeadline()).to.be.revertedWith("No proposal in progress!");

    const after = await cmp.deadline();
    expect(after).to.equal(expectedNewDeadline);
  });

  it("CampaignVoters: deadline extension rejected leaves deadline unchanged", async () => {
    const tx = await votersFactory.create(
      "Voters Deadline Reject",
      [verifier.address, verifier2.address],
      3,
      [10]
    );
    await tx.wait();
    const count = await votersFactory.campaignsCount();
    const idx = count - 1n;
    const addr = await votersFactory.getCampaign(idx);
    const cmp = await ethers.getContractAt("CampaignVoters", addr);

    const before = await cmp.deadline();
    const requestedDays = 7n;

    const ptx = await cmp.connect(owner).proposeNewDeadline(requestedDays);
    await ptx.wait();
    const info = await cmp.getCurrentProposal();
    expect(info[0]).to.equal(1n);
    const proposedDays = await cmp.getNewDeadline();
    expect(proposedDays).to.equal(requestedDays);

    // Cast majority NO
    await (await cmp.connect(verifier).voteOnProposal(false)).wait();
    await (await cmp.connect(verifier2).voteOnProposal(false)).wait();
    await (await cmp.connect(owner).voteOnProposal(false)).wait();

    await expect(cmp.getCurrentProposal()).to.be.revertedWith("No proposal in progress!");
    const after = await cmp.deadline();
    expect(after).to.equal(before);
  });
});

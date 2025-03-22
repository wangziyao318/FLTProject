import { expect } from "chai";
import { ethers, network } from "hardhat";

describe("Transaction Contract", function () {
  let flt: any;
  let transaction: any;
  let deployer: any, creator: any, fan: any;

  // Constants
  const metadataUri = "ipfs://projectMetadata";
  const milestoneMetadataUri = "ipfs://milestoneMetadata";
  const totalMilestones = 4;
  const targetAmount = ethers.parseEther("1");

  beforeEach(async function () {
    [deployer, creator, fan] = await ethers.getSigners();

    // Deploy the FLT contract.
    const FLTFactory = await ethers.getContractFactory("FLT");
    flt = await FLTFactory.deploy("ipfs://fltMetadata");
    await flt.waitForDeployment();

    // Deploy the Transaction contract with the FLT token address.
    const TransactionFactory = await ethers.getContractFactory("Transaction");
    transaction = await TransactionFactory.deploy(await flt.getAddress());
    await transaction.waitForDeployment();

    // Transfer ownership of FLT to Transaction so it can mint and burn tokens.
    await flt.transferOwnership(await transaction.getAddress());
  });

  it("should create a project", async function () {
    const tx = await transaction.connect(creator).createProject(totalMilestones, targetAmount, metadataUri);
    const receipt = await tx.wait();

    // Query for the ProjectCreated event.
    // queryFilter is an ether.js v6 feature.
    const events = await transaction.queryFilter(
      "ProjectCreated",
      receipt.blockNumber,
      receipt.blockNumber
    );
    expect(events.length).to.be.greaterThan(0);
    const event = events[0];
    expect(event.args.projectId).to.equal(1);
    expect(event.args.creator).to.equal(creator.address);
    expect(event.args.metadataUri).to.equal(metadataUri);
  });

  it("should allow contributions and mint FLT tokens", async function () {
    // Creator launches a project.
    await transaction.connect(creator).createProject(totalMilestones, targetAmount, metadataUri);

    // Fan contributes 0.5 ETH.
    const contributionAmount = ethers.parseEther("0.5");
    const tx = await transaction.connect(fan).contribute(1, { value: contributionAmount });
    const receipt = await tx.wait();

    // Query for the ContributionReceived event.
    const events = await transaction.queryFilter(
      "ContributionReceived",
      receipt.blockNumber,
      receipt.blockNumber
    );
    expect(events.length).to.be.greaterThan(0);
    const event = events[0];
    // Adjust the event argument names as defined in the contract.
    expect(event.args.projectId).to.equal(1);
    expect(event.args.fan).to.equal(fan.address);
    expect(event.args.amount).to.equal(contributionAmount);

    // Verify that the fan's FLT balance equals the contributed amount.
    const fanBalance = await flt.balanceOf(fan.address, 1);
    expect(fanBalance).to.equal(contributionAmount);

    // Verify that the project's fundsCollected is updated.
    const project = await transaction.projects(1);
    expect(project.fundsCollected).to.equal(contributionAmount);
  });

  it("should mark the campaign as successful when the target is met", async function () {
    await transaction.connect(creator).createProject(totalMilestones, targetAmount, metadataUri);

    // Fan contributes 1 ETH to meet the target.
    const contributionAmount = ethers.parseEther("1");
    await transaction.connect(fan).contribute(1, { value: contributionAmount });

    // Check that campaignSuccessful and campaignEnded flags are set.
    const project = await transaction.projects(1);
    expect(project.campaignSuccessful).to.be.true;
    expect(project.campaignEnded).to.be.true;
  });

  it("should allow withdrawal (if milestones not exceeded) and apply FLT penalty", async function () {
    await transaction.connect(creator).createProject(totalMilestones, targetAmount, metadataUri);

    // Fan contributes 1 ETH.
    const contributionAmount = ethers.parseEther("1");
    await transaction.connect(fan).contribute(1, { value: contributionAmount });

    // Perform withdrawal (no milestones released).
    const txWithdraw = await transaction.connect(fan).withdraw(1);
    const receiptWithdraw = await txWithdraw.wait();

    // Query for the Withdrawal event.
    const events = await transaction.queryFilter(
      "Withdrawal",
      receiptWithdraw.blockNumber,
      receiptWithdraw.blockNumber
    );
    expect(events.length).to.be.greaterThan(0);
    const event = events[0];
    expect(event.args.projectId).to.equal(1);
    expect(event.args.fan).to.equal(fan.address);

    // Verify that the fan's FLT balance is burnt by the penalty.
    const penalty = await transaction.fanWithdrawPenalty();
    const fanNewFLT = await flt.balanceOf(fan.address, 1);
    expect(fanNewFLT).to.equal(contributionAmount - penalty);
  });

  it("should release a milestone, transfer funds to creator, and mint FLT reward", async function () {
    await transaction.connect(creator).createProject(totalMilestones, targetAmount, metadataUri);

    // Fan contributes 1 ETH to meet the target.
    const contributionAmount = ethers.parseEther("1");
    await transaction.connect(fan).contribute(1, { value: contributionAmount });

    // Capture creator's ETH balance before milestone release.
    const initialCreatorBalance = await ethers.provider.getBalance(creator.address);

    // Release milestone.
    const txRelease = await transaction.connect(deployer).releaseMilestone(1, milestoneMetadataUri);
    const receiptRelease = await txRelease.wait();

    // Query for the MilestoneReleased event.
    const events = await transaction.queryFilter(
      "MilestoneReleased",
      receiptRelease.blockNumber,
      receiptRelease.blockNumber
    );
    expect(events.length).to.be.greaterThan(0);
    const event = events[0];
    expect(event.args.projectId).to.equal(1);
    expect(event.args.milestoneIndex).to.equal(1);

    // Calculate the expected release amount.
    const releaseAmount = targetAmount / BigInt(totalMilestones);

    // Verify that the creator's ETH balance increased accordingly.
    const finalCreatorBalance = await ethers.provider.getBalance(creator.address);
    expect(finalCreatorBalance - initialCreatorBalance).to.equal(releaseAmount);

    // Verify that the creator received the FLT reward.
    const reward = await transaction.creatorRewardAmount();
    const creatorFLT = await flt.balanceOf(creator.address, 1);
    expect(creatorFLT).to.equal(reward);
  });

  it("should allow project cancellation with FLT penalty", async function () {
    await transaction.connect(creator).createProject(totalMilestones, targetAmount, metadataUri);

    // Fan contributes 1 ETH to meet the target.
    const contributionAmount = ethers.parseEther("1");
    await transaction.connect(fan).contribute(1, { value: contributionAmount });

    // Confirm that the creator's FLT balance is zero.
    const creatorFLT = await flt.balanceOf(creator.address, 1);
    expect(creatorFLT).to.equal(0);

    // Creator cancels the project.
    const txCancel = await transaction.connect(creator).cancelProject(1);
    const receiptCancel = await txCancel.wait();

    // Query for the ProjectCancelled event.
    const events = await transaction.queryFilter(
      "ProjectCancelled",
      receiptCancel.blockNumber,
      receiptCancel.blockNumber
    );
    expect(events.length).to.be.greaterThan(0);
    const event = events[0];
    expect(event.args.projectId).to.equal(1);
    expect(event.args.creator).to.equal(creator.address);

    // Verify that the project is marked as cancelled.
    const project = await transaction.projects(1);
    expect(project.cancelled).to.be.true;

    // Since the creator had insufficient FLT, his address should be blacklisted.
    const isBlacklisted = await transaction.blacklist(creator.address);
    expect(isBlacklisted).to.be.true;
  });
});

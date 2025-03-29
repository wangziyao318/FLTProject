import { ethers } from "hardhat";
import { expect } from "chai";

describe("Crowdfunding dApp", function () {
  let fltToken: any;
  let transaction: any;
  let governance: any;
  let deployer: any;
  let creator: any;
  let fan1: any;
  let fan2: any;

  beforeEach(async function () {
    // Retrieve test accounts.
    [deployer, creator, fan1, fan2] = await ethers.getSigners();

    // Deploy FLT token contract.
    // Assumes FLT.sol implements a non-transferable ERC5484 token with mint and burn.
    const FLT = await ethers.getContractFactory("FLT");
    fltToken = await FLT.deploy("ipfs://test");

    // Deploy Governance contract.
    // Assumes Governance.sol accepts the FLT token and Transaction contract addresses.
    const Governance = await ethers.getContractFactory("Governance");
    governance = await Governance.deploy(fltToken.getAddress());

    // Deploy Transaction contract.
    // Assumes Transaction.sol accepts the FLT token address in the constructor.
    const Transaction = await ethers.getContractFactory("Transaction");
    transaction = await Transaction.deploy(fltToken.getAddress(), governance.getAddress());
    // await transaction.waitForDeployment();

    // Set up cross-contract relations, default .connect(deployer) is admin
    await governance.connect(deployer).setTransaction(transaction.getAddress());
  });

  describe("FLT Token", function () {
    // it("should mint FLT tokens for a fan contribution", async function () {
    //   // Assume that when a fan contributes ETH via the Transaction contract,
    //   // the platform mints FLT tokens as rewards.
    //   const contributionAmount = ethers.parseEther("1.0"); // returns a bigint in v6
    //   await transaction.connect(fan1).contribute({ value: contributionAmount });

    //   // Check that fan1 received FLT tokens.
    //   const balance = await fltToken.balanceOf(fan1.address);
    //   expect(balance).to.be.gt(0n);
    // });

    it("should be non-transferable", async function () {
      await fltToken.mint(fan1.address, ethers.parseEther("1"), false);
      const balance = await fltToken.balanceOf(fan1.address, 1);

      // Attempt a token transfer from fan1 to fan2; should revert.
      await expect(
        fltToken.connect(fan1).safeTransferFrom(fan1.address, fan2.address, 1, balance, ethers.toUtf8Bytes(""))
      ).to.be.revertedWith("Non-transferable token");
    });
  });

  // describe("Campaign Operations", function () {
  //   it("should launch a campaign and record contributions", async function () {
  //     // Assume Transaction contract provides launchCampaign(fundingGoal, numMilestones).
  //     const fundingGoal = ethers.parseEther("10.0");
  //     const numMilestones = 5;
  //     await transaction.connect(creator).launchCampaign(fundingGoal, numMilestones);

  //     // Two fans contribute.
  //     await transaction.connect(fan1).contribute({ value: ethers.parseEther("4.0") });
  //     await transaction.connect(fan2).contribute({ value: ethers.parseEther("6.0") });

  //     // Check that the campaign funded amount equals the funding goal.
  //     // Assumes campaigns(0) returns an object with fundedAmount and state.
  //     const campaign = await transaction.campaigns(0);
  //     expect(campaign.fundedAmount).to.equal(ethers.parseEther("10.0"));
  //     // For example, state "1" might represent a succeeded campaign.
  //     expect(campaign.state).to.equal(1);
  //   });

  //   it("should lock ETH funds and allocate them equally to milestones", async function () {
  //     const fundingGoal = ethers.parseEther("10.0");
  //     const numMilestones = 5;
  //     await transaction.connect(creator).launchCampaign(fundingGoal, numMilestones);
  //     await transaction.connect(fan1).contribute({ value: ethers.parseEther("5.0") });
  //     await transaction.connect(fan2).contribute({ value: ethers.parseEther("5.0") });

  //     // Verify ETH is locked in the Transaction contract.
  //     const contractBalance = await ethers.provider.getBalance(transaction.target);
  //     expect(contractBalance).to.equal(ethers.parseEther("10.0"));

  //     // Each milestone should receive an equal portion (e.g. 10 ETH / 5 = 2 ETH per milestone).
  //     const milestoneAmount = ethers.parseEther("2.0");
  //     const milestone = await transaction.getMilestone(0);
  //     expect(milestone.amount).to.equal(milestoneAmount);
  //   });
  // });

  // describe("Governance Voting", function () {
  //   it("should allow fans with sufficient FLT to vote on a milestone", async function () {
  //     const fundingGoal = ethers.parseEther("10.0");
  //     const numMilestones = 5;
  //     await transaction.connect(creator).launchCampaign(fundingGoal, numMilestones);
  //     await transaction.connect(fan1).contribute({ value: ethers.parseEther("5.0") });
  //     await transaction.connect(fan2).contribute({ value: ethers.parseEther("5.0") });

  //     // Fans vote on milestone index 0.
  //     await governance.connect(fan1).voteMilestone(0, true);
  //     await governance.connect(fan2).voteMilestone(0, true);

  //     // Voting power is proportional to FLT balance.
  //     const votes = await governance.getVotes(0);
  //     const fan1FLT = await fltToken.balanceOf(fan1.address);
  //     const fan2FLT = await fltToken.balanceOf(fan2.address);
  //     expect(votes).to.equal(fan1FLT + fan2FLT);

  //     // Finalize the vote and check milestone approval (if >50% approved).
  //     await governance.finalizeVoting(0);
  //     const approved = await governance.isMilestoneApproved(0);
  //     expect(approved).to.equal(true);
  //   });

  //   it("should release ETH and mint rewards to the creator when a milestone is approved", async function () {
  //     const fundingGoal = ethers.parseEther("10.0");
  //     const numMilestones = 5;
  //     await transaction.connect(creator).launchCampaign(fundingGoal, numMilestones);
  //     await transaction.connect(fan1).contribute({ value: ethers.parseEther("5.0") });
  //     await transaction.connect(fan2).contribute({ value: ethers.parseEther("5.0") });

  //     // Voting process for milestone 0.
  //     await governance.connect(fan1).voteMilestone(0, true);
  //     await governance.connect(fan2).voteMilestone(0, true);
  //     await governance.finalizeVoting(0);

  //     // Record creator’s ETH balance before milestone release.
  //     const balanceBefore = await ethers.provider.getBalance(creator.address);
  //     await transaction.connect(creator).releaseMilestone(0);
  //     const balanceAfter = await ethers.provider.getBalance(creator.address);
  //     expect(balanceAfter).to.be.gt(balanceBefore);

  //     // Check that the creator received FLT reward tokens.
  //     const rewardFLT = await fltToken.balanceOf(creator.address);
  //     expect(rewardFLT).to.be.gt(0n);
  //   });
  // });

  // describe("Abnormal Operations", function () {
  //   it("should allow a fan to withdraw his contribution and burn FLT tokens", async function () {
  //     const fundingGoal = ethers.parseEther("10.0");
  //     const numMilestones = 5;
  //     await transaction.connect(creator).launchCampaign(fundingGoal, numMilestones);
      
  //     const contribution = ethers.parseEther("2.0");
  //     await transaction.connect(fan1).contribute({ value: contribution });

  //     // Record fan1’s ETH balance before withdrawal.
  //     const balanceBefore = await ethers.provider.getBalance(fan1.address);
  //     const txWithdraw = await transaction.connect(fan1).withdrawContribution(0);
  //     await txWithdraw.wait();
  //     const balanceAfter = await ethers.provider.getBalance(fan1.address);

  //     // Allowing for gas, fan1's balance should increase.
  //     expect(balanceAfter).to.be.gt(balanceBefore - ethers.parseEther("0.1"));
  //     // Verify that FLT tokens are burned.
  //     const remainingFLT = await fltToken.balanceOf(fan1.address);
  //     expect(remainingFLT).to.equal(0n);
  //   });

  //   it("should blacklist the creator if a milestone fails and FLT burning is not affordable", async function () {
  //     const fundingGoal = ethers.parseEther("10.0");
  //     const numMilestones = 5;
  //     await transaction.connect(creator).launchCampaign(fundingGoal, numMilestones);
  //     await transaction.connect(fan1).contribute({ value: ethers.parseEther("5.0") });
  //     await transaction.connect(fan2).contribute({ value: ethers.parseEther("5.0") });

  //     // Simulate the creator failing milestone 0.
  //     await transaction.connect(creator).failMilestone(0);

  //     // Optionally check creator’s FLT balance if needed.
  //     const creatorFLT = await fltToken.balanceOf(creator.address);
  //     // Check that the creator has been blacklisted.
  //     const blacklisted = await transaction.isBlacklisted(creator.address);
  //     expect(blacklisted).to.equal(true);
  //   });
  // });
});

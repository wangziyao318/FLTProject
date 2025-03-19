const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Transaction Contract", function () {
  let Transaction;
  let FLTToken;
  let transaction;
  let fltToken;
  let owner;
  let admin;
  let creator;
  let fan1;
  let fan2;
  
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  
  beforeEach(async function () {
    // Deploy FLT Token mock contract first
    const FLTTokenFactory = await ethers.getContractFactory("FLTToken");
    fltToken = await FLTTokenFactory.deploy();
    await fltToken.deployed();
    
    // Deploy Transaction contract
    const TransactionFactory = await ethers.getContractFactory("Transaction");
    transaction = await TransactionFactory.deploy(fltToken.address);
    await transaction.deployed();
    
    // Assign roles
    [owner, admin, creator, fan1, fan2] = await ethers.getSigners();
    
    // Add admin to the Transaction contract
    await transaction.connect(owner).addAdmin(admin.address);
    
    // Set proper minting permissions on FLT token
    await fltToken.connect(owner).setMinter(transaction.address, true);
  });
  
  describe("Initialization", function () {
    it("Should set the correct owner", async function () {
      // Since owner is private, we'll verify through admin status
      expect(await transaction.connect(owner).setPlatformFeePercent(10))
        .to.emit(transaction, "PlatformFeeUpdated") // Assuming this event exists
        .withArgs(10);
    });
    
    it("Should set the FLT token address correctly", async function () {
      expect(await transaction.fltTokenAddress()).to.equal(fltToken.address);
    });
    
    it("Should set default token multipliers correctly", async function () {
      expect(await transaction.fanMintMultiplier()).to.equal(10);
      expect(await transaction.creatorMintMultiplier()).to.equal(5);
      expect(await transaction.burnMultiplier()).to.equal(15);
    });
  });
  
  describe("Campaign Creation and Management", function () {
    it("Should create a campaign successfully", async function () {
      const ipfsHash = "Qm123456789";
      const isPrivate = false;
      const totalGoal = ethers.utils.parseEther("10");
      
      await expect(transaction.connect(creator).createCampaign(ipfsHash, isPrivate, totalGoal))
        .to.emit(transaction, "CampaignCreated")
        .withArgs(0, creator.address, ipfsHash, isPrivate, totalGoal);
      
      const campaign = await transaction.getCampaignBasicInfo(0);
      expect(campaign.id).to.equal(0);
      expect(campaign.creator).to.equal(creator.address);
      expect(campaign.ipfsHash).to.equal(ipfsHash);
      expect(campaign.isPrivate).to.equal(isPrivate);
      expect(campaign.totalGoal).to.equal(totalGoal);
      expect(campaign.state).to.equal(0); // CampaignState.ACTIVE
    });
    
    it("Should not create a campaign with empty IPFS hash", async function () {
      const emptyIpfsHash = "";
      const isPrivate = false;
      const totalGoal = ethers.utils.parseEther("10");
      
      await expect(transaction.connect(creator).createCampaign(emptyIpfsHash, isPrivate, totalGoal))
        .to.be.revertedWith("IPFS hash cannot be empty");
    });
    
    it("Should not create a campaign with zero goal", async function () {
      const ipfsHash = "Qm123456789";
      const isPrivate = false;
      const zeroGoal = ethers.utils.parseEther("0");
      
      await expect(transaction.connect(creator).createCampaign(ipfsHash, isPrivate, zeroGoal))
        .to.be.revertedWith("Total goal must be greater than zero");
    });
    
    it("Should update campaign metadata successfully", async function () {
      // First create a campaign
      const ipfsHash = "Qm123456789";
      const isPrivate = false;
      const totalGoal = ethers.utils.parseEther("10");
      
      await transaction.connect(creator).createCampaign(ipfsHash, isPrivate, totalGoal);
      
      // Now update the metadata
      const newIpfsHash = "Qm987654321";
      await expect(transaction.connect(creator).updateCampaignMetadata(0, newIpfsHash))
        .to.emit(transaction, "CampaignMetadataUpdated")
        .withArgs(0, newIpfsHash);
      
      const campaign = await transaction.getCampaignBasicInfo(0);
      expect(campaign.ipfsHash).to.equal(newIpfsHash);
    });
    
    it("Should not allow non-creator to update campaign metadata", async function () {
      // First create a campaign
      const ipfsHash = "Qm123456789";
      const isPrivate = false;
      const totalGoal = ethers.utils.parseEther("10");
      
      await transaction.connect(creator).createCampaign(ipfsHash, isPrivate, totalGoal);
      
      // Attempt to update the metadata as non-creator
      const newIpfsHash = "Qm987654321";
      await expect(transaction.connect(fan1).updateCampaignMetadata(0, newIpfsHash))
        .to.be.revertedWith("Only campaign creator can call this function");
    });
  });
  
  describe("Milestone Creation and Management", function () {
    beforeEach(async function () {
      // Create a campaign for milestone tests
      const ipfsHash = "Qm123456789";
      const isPrivate = false;
      const totalGoal = ethers.utils.parseEther("10");
      
      await transaction.connect(creator).createCampaign(ipfsHash, isPrivate, totalGoal);
    });
    
    it("Should create a milestone successfully", async function () {
      const ipfsHash = "QmMilestone1";
      const amount = ethers.utils.parseEther("5");
      const deadline = Math.floor(Date.now() / 1000) + 86400; // 1 day from now
      
      await expect(transaction.connect(creator).createMilestone(0, ipfsHash, amount, deadline))
        .to.emit(transaction, "MilestoneCreated")
        .withArgs(0, 0, ipfsHash, amount, deadline);
      
      const milestone = await transaction.getMilestoneBasicInfo(0, 0);
      expect(milestone.id).to.equal(0);
      expect(milestone.ipfsHash).to.equal(ipfsHash);
      expect(milestone.amount).to.equal(amount);
      expect(milestone.deadline).to.equal(deadline);
      expect(milestone.state).to.equal(0); // MilestoneState.PENDING
    });
    
    it("Should not create milestone with future deadline", async function () {
      const ipfsHash = "QmMilestone1";
      const amount = ethers.utils.parseEther("5");
      const pastDeadline = Math.floor(Date.now() / 1000) - 86400; // 1 day ago
      
      await expect(transaction.connect(creator).createMilestone(0, ipfsHash, amount, pastDeadline))
        .to.be.revertedWith("Deadline must be in the future");
    });
    
    it("Should not create milestone exceeding campaign goal", async function () {
      const ipfsHash = "QmMilestone1";
      const excessiveAmount = ethers.utils.parseEther("15"); // Campaign goal is 10 ETH
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      
      await expect(transaction.connect(creator).createMilestone(0, ipfsHash, excessiveAmount, deadline))
        .to.be.revertedWith("Total milestone amounts exceed campaign goal");
    });
    
    it("Should activate a milestone successfully", async function () {
      // Create a milestone first
      const ipfsHash = "QmMilestone1";
      const amount = ethers.utils.parseEther("5");
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      
      await transaction.connect(creator).createMilestone(0, ipfsHash, amount, deadline);
      
      // Activate the milestone
      await transaction.connect(creator).activateMilestone(0, 0);
      
      const milestone = await transaction.getMilestoneBasicInfo(0, 0);
      expect(milestone.state).to.equal(1); // MilestoneState.ACTIVE
    });
  });
  
  describe("Fan Contributions", function () {
    beforeEach(async function () {
      // Create a campaign with a milestone
      await transaction.connect(creator).createCampaign("QmCampaign", false, ethers.utils.parseEther("10"));
      await transaction.connect(creator).createMilestone(
        0, 
        "QmMilestone", 
        ethers.utils.parseEther("5"),
        Math.floor(Date.now() / 1000) + 86400
      );
      await transaction.connect(creator).activateMilestone(0, 0);
    });
    
    it("Should allow fan to contribute to milestone", async function () {
      const contributionAmount = ethers.utils.parseEther("1");
      
      await expect(transaction.connect(fan1).contributeToMilestone(0, 0, { value: contributionAmount }))
        .to.emit(transaction, "FanToplatform")
        .withArgs(0, 0, fan1.address, contributionAmount);
      
      // Check that contribution was recorded
      const contribution = await transaction.getContribution(0, fan1.address);
      expect(contribution).to.equal(contributionAmount);
      
      // Check campaign raised amount
      const campaign = await transaction.getCampaignBasicInfo(0);
      expect(campaign.raisedAmount).to.equal(contributionAmount);
      
      // Check that FLT tokens were minted to fan
      const fltAmount = contributionAmount.mul(await transaction.fanMintMultiplier()).div(ethers.utils.parseEther("1"));
      expect(await fltToken.balanceOf(fan1.address)).to.equal(fltAmount);
    });
    
    it("Should not allow creator to contribute to own campaign", async function () {
      const contributionAmount = ethers.utils.parseEther("1");
      
      await expect(transaction.connect(creator).contributeToMilestone(0, 0, { value: contributionAmount }))
        .to.be.revertedWith("Creator cannot contribute to own campaign");
    });
    
    it("Should not allow contribution to inactive milestone", async function () {
      // Create another milestone but don't activate it
      await transaction.connect(creator).createMilestone(
        0, 
        "QmMilestone2", 
        ethers.utils.parseEther("5"),
        Math.floor(Date.now() / 1000) + 86400
      );
      
      const contributionAmount = ethers.utils.parseEther("1");
      
      await expect(transaction.connect(fan1).contributeToMilestone(0, 1, { value: contributionAmount }))
        .to.be.revertedWith("Milestone is not active");
    });
  });
  
  describe("Milestone Completion and Approval", function () {
    beforeEach(async function () {
      // Setup: Create campaign, milestone, and add contribution
      await transaction.connect(creator).createCampaign("QmCampaign", false, ethers.utils.parseEther("10"));
      await transaction.connect(creator).createMilestone(
        0, 
        "QmMilestone", 
        ethers.utils.parseEther("5"),
        Math.floor(Date.now() / 1000) + 86400
      );
      await transaction.connect(creator).activateMilestone(0, 0);
      
      // Fan contributes
      await transaction.connect(fan1).contributeToMilestone(0, 0, { value: ethers.utils.parseEther("5") });
    });
    
    it("Should allow creator to mark milestone as completed", async function () {
      await transaction.connect(creator).completeMilestone(0, 0);
      
      const milestone = await transaction.getMilestoneBasicInfo(0, 0);
      expect(milestone.state).to.equal(2); // MilestoneState.COMPLETED
    });
    
    it("Should allow admin to approve completed milestone", async function () {
      await transaction.connect(creator).completeMilestone(0, 0);
      
      const creatorBalanceBefore = await ethers.provider.getBalance(creator.address);
      
      // Admin approves milestone
      await expect(transaction.connect(admin).approveMilestone(0, 0))
        .to.emit(transaction, "PlatformToCreator")
        .withArgs(0, 0, creator.address, ethers.utils.parseEther("5"));
      
      // Check milestone state changed
      const milestone = await transaction.getMilestoneBasicInfo(0, 0);
      expect(milestone.state).to.equal(3); // MilestoneState.APPROVED
      
      // Check campaign data updated
      const campaign = await transaction.getCampaignBasicInfo(0);
      expect(campaign.completedMilestones).to.equal(1);
      expect(campaign.releasedAmount).to.equal(ethers.utils.parseEther("5"));
      
      // Check creator received funds
      const creatorBalanceAfter = await ethers.provider.getBalance(creator.address);
      expect(creatorBalanceAfter.sub(creatorBalanceBefore)).to.equal(ethers.utils.parseEther("5"));
      
      // Check FLT tokens minted to creator
      const fltAmount = ethers.utils.parseEther("5").mul(await transaction.creatorMintMultiplier()).div(ethers.utils.parseEther("1"));
      expect(await fltToken.balanceOf(creator.address)).to.equal(fltAmount);
    });
    
    it("Should not allow admin to approve non-completed milestone", async function () {
      // Try to approve active (not completed) milestone
      await expect(transaction.connect(admin).approveMilestone(0, 0))
        .to.be.revertedWith("Milestone is not completed");
    });
    
    it("Should mark campaign as completed when all milestones are approved", async function () {
      // Complete and approve the milestone
      await transaction.connect(creator).completeMilestone(0, 0);
      await transaction.connect(admin).approveMilestone(0, 0);
      
      // Check if campaign is marked as completed (it should be since we've only created one milestone with the full amount)
      const campaign = await transaction.getCampaignBasicInfo(0);
      expect(campaign.state).to.equal(1); // CampaignState.COMPLETED
    });
  });
  
  describe("Fan Withdrawals", function () {
    beforeEach(async function () {
      // Setup: Create campaign with two milestones
      await transaction.connect(creator).createCampaign("QmCampaign", false, ethers.utils.parseEther("10"));
      
      // Create two milestones with 5 ETH each
      await transaction.connect(creator).createMilestone(
        0, 
        "QmMilestone1", 
        ethers.utils.parseEther("5"),
        Math.floor(Date.now() / 1000) + 86400
      );
      await transaction.connect(creator).createMilestone(
        0, 
        "QmMilestone2", 
        ethers.utils.parseEther("5"),
        Math.floor(Date.now() / 1000) + 86400 * 2
      );
      
      // Activate first milestone
      await transaction.connect(creator).activateMilestone(0, 0);
      
      // Fan contributes 2 ETH
      await transaction.connect(fan1).contributeToMilestone(0, 0, { value: ethers.utils.parseEther("2") });
    });
    
    it("Should allow fan to withdraw contribution", async function () {
      const platformFeePercent = await transaction.getPlatformFeePercent();
      const contribution = await transaction.getContribution(0, fan1.address);
      const platformFee = contribution.mul(platformFeePercent).div(100);
      const returnAmount = contribution.sub(platformFee);
      
      const fanBalanceBefore = await ethers.provider.getBalance(fan1.address);
      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
      
      // Withdraw contribution
      const tx = await transaction.connect(fan1).withdrawContribution(0);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      
      // Check balances updated correctly
      const fanBalanceAfter = await ethers.provider.getBalance(fan1.address);
      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
      
      expect(fanBalanceAfter).to.be.closeTo(
        fanBalanceBefore.add(returnAmount).sub(gasUsed),
        ethers.utils.parseEther("0.0001") // Allow for small rounding errors
      );
      
      expect(ownerBalanceAfter).to.equal(
        ownerBalanceBefore.add(platformFee)
      );
      
      // Check contribution reset to 0
      expect(await transaction.getContribution(0, fan1.address)).to.equal(0);
      
      // Check campaign raised amount decreased
      const campaign = await transaction.getCampaignBasicInfo(0);
      expect(campaign.raisedAmount).to.equal(0);
      
      // Check that FLT tokens were burned from fan
      // Assuming fan received 20 FLT tokens (2 ETH * 10) and burn should be 30 FLT (2 ETH * 15)
      // Since fan doesn't have enough tokens, they should be blacklisted
      expect(await fltToken.isBlacklisted(fan1.address)).to.equal(true);
    });
    
    it("Should not allow withdrawal after milestone completion", async function () {
      // Complete and approve the first milestone
      await transaction.connect(creator).completeMilestone(0, 0);
      await transaction.connect(admin).approveMilestone(0, 0);
      
      // Try to withdraw
      await expect(transaction.connect(fan1).withdrawContribution(0))
        .to.be.revertedWith("Cannot withdraw: Creator has completed at least half of milestones");
    });
  });
  
  describe("FLT Token Integration", function () {
    beforeEach(async function () {
      // Create a campaign with a milestone
      await transaction.connect(creator).createCampaign("QmCampaign", false, ethers.utils.parseEther("10"));
      await transaction.connect(creator).createMilestone(
        0, 
        "QmMilestone", 
        ethers.utils.parseEther("5"),
        Math.floor(Date.now() / 1000) + 86400
      );
      await transaction.connect(creator).activateMilestone(0, 0);
    });
    
    it("Should mint FLT tokens to fan upon contribution", async function () {
      const contributionAmount = ethers.utils.parseEther("1");
      await transaction.connect(fan1).contributeToMilestone(0, 0, { value: contributionAmount });
      
      const expectedFLT = contributionAmount.mul(await transaction.fanMintMultiplier()).div(ethers.utils.parseEther("1"));
      expect(await fltToken.balanceOf(fan1.address)).to.equal(expectedFLT);
    });
    
    it("Should mint FLT tokens to creator upon milestone approval", async function () {
      // Fan contributes
      await transaction.connect(fan1).contributeToMilestone(0, 0, { value: ethers.utils.parseEther("5") });
      
      // Complete and approve milestone
      await transaction.connect(creator).completeMilestone(0, 0);
      await transaction.connect(admin).approveMilestone(0, 0);
      
      const milestoneAmount = ethers.utils.parseEther("5");
      const expectedFLT = milestoneAmount.mul(await transaction.creatorMintMultiplier()).div(ethers.utils.parseEther("1"));
      expect(await fltToken.balanceOf(creator.address)).to.equal(expectedFLT);
    });
    
    it("Should burn FLT tokens from fan upon withdrawal", async function () {
      // Fan contributes
      await transaction.connect(fan1).contributeToMilestone(0, 0, { value: ethers.utils.parseEther("1") });
      
      // Get initial FLT balance
      const initialFLT = await fltToken.balanceOf(fan1.address);
      expect(initialFLT).to.be.gt(0);
      
      // Withdraw contribution
      await transaction.connect(fan1).withdrawContribution(0);
      
      // Check tokens were burned
      const finalFLT = await fltToken.balanceOf(fan1.address);
      expect(finalFLT).to.be.lt(initialFLT);
    });
    
    it("Should blacklist fan if they don't have enough FLT for burning", async function () {
      // Fan contributes
      await transaction.connect(fan1).contributeToMilestone(0, 0, { value: ethers.utils.parseEther("1") });
      
      // Burn some of fan's tokens to simulate spending them
      const fanBalance = await fltToken.balanceOf(fan1.address);
      await fltToken.connect(owner).burn(fan1.address, fanBalance.div(2));
      
      // Withdraw contribution - should try to burn more than available
      await transaction.connect(fan1).withdrawContribution(0);
      
      // Check if fan is blacklisted
      expect(await fltToken.isBlacklisted(fan1.address)).to.equal(true);
    });
  });
  
  describe("Admin Functions", function () {
    it("Should allow owner to add admin", async function () {
      await transaction.connect(owner).addAdmin(fan2.address);
      
      // Verify admin status by attempting admin function
      await expect(transaction.connect(fan2).approveMilestone(0, 0))
        .to.be.revertedWith("Campaign does not exist");
      // If it reverts with campaign not existing rather than "Only admin", we know they are admin
    });
    
    it("Should allow owner to remove admin", async function () {
      await transaction.connect(owner).removeAdmin(admin.address);
      
      // Verify admin status revoked by attempting admin function
      await expect(transaction.connect(admin).approveMilestone(0, 0))
        .to.be.revertedWith("Only admin can call this function");
    });
    
    it("Should not allow removing owner as admin", async function () {
      await expect(transaction.connect(owner).removeAdmin(owner.address))
        .to.be.revertedWith("Cannot remove owner as admin");
    });
    
    it("Should allow owner to change platform fee percent", async function () {
      const newFeePercent = 15;
      await transaction.connect(owner).setPlatformFeePercent(newFeePercent);
      
      expect(await transaction.getPlatformFeePercent()).to.equal(newFeePercent);
    });
    
    it("Should not allow fee percent above 20%", async function () {
      const tooHighFee = 25;
      await expect(transaction.connect(owner).setPlatformFeePercent(tooHighFee))
        .to.be.revertedWith("Fee percent cannot exceed 20%");
    });
  });
  
  describe("Edge Cases", function () {
    it("Should handle campaign cancellation properly", async function () {
      // Create campaign and milestone
      await transaction.connect(creator).createCampaign("QmCampaign", false, ethers.utils.parseEther("10"));
      await transaction.connect(creator).createMilestone(
        0, 
        "QmMilestone", 
        ethers.utils.parseEther("5"),
        Math.floor(Date.now() / 1000) + 86400
      );
      await transaction.connect(creator).activateMilestone(0, 0);
      
      // Fan contributes
      await transaction.connect(fan1).contributeToMilestone(0, 0, { value: ethers.utils.parseEther("2") });
      
      // Creator cancels campaign
      await transaction.connect(creator).cancelCampaign(0);
      
      // Check campaign state
      const campaign = await transaction.getCampaignBasicInfo(0);
      expect(campaign.state).to.equal(2); // CampaignState.CANCELLED
      
      // Check milestone state
      const milestone = await transaction.getMilestoneBasicInfo(0, 0);
      expect(milestone.state).to.equal(5); // MilestoneState.CANCELLED
      
      // Process refunds
      await transaction.connect(admin).processRefunds(0);
      
      // Check contribution is reset
      expect(await transaction.getContribution(0, fan1.address)).to.equal(0);
      
      // Check campaign raised amount is reset
      const updatedCampaign = await transaction.getCampaignBasicInfo(0);
      expect(updatedCampaign.raisedAmount).to.equal(0);
    });
    
    it("Should fail milestone properly", async function () {
      // Create campaign and milestone
      await transaction.connect(creator).createCampaign("QmCampaign", false, ethers.utils.parseEther("10"));
      await transaction.connect(creator).createMilestone(
        0, 
        "QmMilestone", 
        ethers.utils.parseEther("5"),
        Math.floor(Date.now() / 1000) + 86400
      );
      await transaction.connect(creator).activateMilestone(0, 0);
      
      // Admin fails the milestone
      await expect(transaction.connect(admin).failMilestone(0, 0, "Project abandoned"))
        .to.emit(transaction, "MilestoneFailed")
        .withArgs(0, 0, "Project abandoned");
      
      // Check milestone state
      const milestone = await transaction.getMilestoneBasicInfo(0, 0);
      expect(milestone.state).to.equal(4); // MilestoneState.FAILED
    });
    
    it("Should handle voting on completed milestone", async function () {
      // Create campaign and milestone
      await transaction.connect(creator).createCampaign("QmCampaign", false, ethers.utils.parseEther("10"));
      await transaction.connect(creator).createMilestone(
        0, 
        "QmMilestone", 
        ethers.utils.parseEther("5"),
        Math.floor(Date.now() / 1000) + 86400
      );
      await transaction.connect(creator).activateMilestone(0, 0);
      
      // Fan contributes
      await transaction.connect(fan1).contributeToMilestone(0, 0, { value: ethers.utils.parseEther("2") });
      
      // Complete milestone
      await transaction.connect(creator).completeMilestone(0, 0);
      
      // Fan votes on milestone
      await transaction.connect(fan1).voteOnMilestone(0, 0, true);
      
      // Check vote was recorded
      const milestone = await transaction.getMilestoneBasicInfo(0, 0);
      expect(milestone.votesFor).to.equal(1);
      expect(milestone.votesAgainst).to.equal(0);
      
      // Fan shouldn't be able to vote twice
      await expect(transaction.connect(fan1).voteOnMilestone(0, 0, false))
        .to.be.revertedWith("Already voted on this milestone");
    });
  });
});
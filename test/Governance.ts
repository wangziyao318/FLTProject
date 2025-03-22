import { expect } from "chai";
import { ethers, network } from "hardhat";

describe("Governance Contract", function () {
  let flt: any;
  let governance: any;
  let deployer: any, voter: any;

  beforeEach(async function () {
    [deployer, voter] = await ethers.getSigners();

    // Deploy the FLT contract.
    const FLTFactory = await ethers.getContractFactory("FLT");
    flt = await FLTFactory.deploy("ipfs://fltMetadata");
    await flt.waitForDeployment();

    // Deploy the Governance contract with the FLT token address.
    const GovernanceFactory = await ethers.getContractFactory("Governance");
    governance = await GovernanceFactory.deploy(await flt.getAddress());
    await governance.waitForDeployment();

    // Mint tokens to the voter so that voting power is sufficient.
    const mintAmount = ethers.parseEther("2000");
    await flt.mint(voter.address, mintAmount);
  });

  it("should return the correct clock, CLOCK_MODE, and COUNTING_MODE", async function () {
    const currentBlock = await ethers.provider.getBlockNumber();
    expect(await governance.clock()).to.equal(currentBlock);
    expect(await governance.CLOCK_MODE()).to.equal("mode=blocknumber");
    expect(await governance.COUNTING_MODE()).to.equal("support=bravo&quorum=for,against,abstain");
  });

  it("should return the correct voting power via getVotes", async function () {
    const blockNumber = await ethers.provider.getBlockNumber();
    const votes = await governance.getVotes(voter.address, blockNumber);
    expect(votes).to.equal(ethers.parseEther("2000"));
  });

  it("should allow proposal creation, voting, and result in a succeeded proposal", async function () {
    // Prepare dummy proposal parameters.
    const targets = [await governance.getAddress()]; // dummy target
    const values = [0];
    const calldatas = ["0x"];
    const description = "ipfs://proposalMetadata";

    // Create a proposal.
    const tx = await governance.connect(voter).propose(targets, values, calldatas, description);
    const receipt = await tx.wait();

    // Query for ProposalCreated events from the block where the proposal was created.
    const events = await governance.queryFilter(
      "ProposalCreated",
      receipt.blockNumber,
      receipt.blockNumber
    );
    expect(events.length).to.be.greaterThan(0);
    const proposalCreatedEvent = events[0];
    const proposalId = proposalCreatedEvent.args.proposalId;

    // Wait for one block (voting delay is 1 block).
    await network.provider.send("evm_mine", []);

    // Cast a "For" vote (support = 1).
    await expect(governance.connect(voter).castVote(proposalId, 1))
      .to.emit(governance, "VoteCast")
      .withArgs(voter.address, proposalId, 1, ethers.parseEther("2000"), "");

    expect(await governance.hasVoted(proposalId, voter.address)).to.be.true;

    // Fast-forward blocks for the entire voting period.
    const votingPeriod = await governance.votingPeriod();
    for (let i = 0; i < votingPeriod; i++) {
      await network.provider.send("evm_mine", []);
    }

    // Check that the proposal state is "Succeeded" (state 4).
    const state = await governance.state(proposalId);
    expect(state).to.equal(4);
  });
});

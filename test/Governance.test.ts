import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { ignition } from "hardhat";
import DeployModule from "../ignition/modules/DeployModule";

describe("Governance", function () {
  let transaction: any;
  let governance: any;
  let platform: Signer, creator: Signer, fan1: Signer, fan2: Signer;
  
  beforeEach(async () => {
    [platform, creator, fan1, fan2] = await ethers.getSigners();

    const deployment = await ignition.deploy(DeployModule);
    transaction = deployment.transaction;
    governance = deployment.governance;
  });

  it("should allow proposal creation", async () => {
    await transaction.connect(creator).createProject(
      ethers.parseEther("1.0"),
      2,
      "ipfs://project-metadata"
    );
    await transaction.connect(fan1).contribute(1, { value: ethers.parseEther("1.0") });
    await transaction.connect(creator).submitMilestone(1, "ipfs://milestone-metadata");

    const proposal = await governance.proposals(1);
    expect(proposal.projectId).to.equal(1);
    expect(proposal.creator).to.equal(await creator.getAddress());
    expect(proposal.uri).to.equal("ipfs://milestone-metadata");
  });

  it("should allow voting on proposals", async () => {
    await transaction.connect(creator).createProject(
      ethers.parseEther("1.0"),
      2,
      "ipfs://project-metadata"
    );
    await transaction.connect(fan1).contribute(1, { value: ethers.parseEther("1.0") });
    await transaction.connect(creator).submitMilestone(1, "ipfs://milestone-metadata");

    await governance.connect(fan1).castVote(1, 1);
    const proposal = await governance.proposals(1);
    expect(proposal.forVotes).to.equal(ethers.parseEther("1.0"));
  });

  it("should allow executing proposals", async () => {
    await transaction.connect(creator).createProject(
      ethers.parseEther("1.0"),
      2,
      "ipfs://project-metadata"
    );
    await transaction.connect(fan1).contribute(1, { value: ethers.parseEther("1.0") });
    await transaction.connect(creator).submitMilestone(1, "ipfs://milestone-metadata");

    await governance.connect(fan1).castVote(1, 1);
    for (let i = 0; i < 10; i++) {
      await ethers.provider.send("evm_mine", []);
    }
    expect(await governance.connect(creator).execute(1)).to.be.not.reverted;
  });
});

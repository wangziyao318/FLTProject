import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { ignition } from "hardhat";
import DeployModule from "../ignition/modules/DeployModule";

describe("Transaction", function () {
  let transaction: any;
  let platform: Signer, creator: Signer, fan1: Signer, fan2: Signer;

  beforeEach(async () => {
    [platform, creator, fan1, fan2] = await ethers.getSigners();

    const deployment = await ignition.deploy(DeployModule);
    transaction = deployment.transaction;
  });

  it("should allow project creation", async () => {
    await transaction.connect(creator).createProject(
      ethers.parseEther("1.0"),
      2,
      "ipfs://project-metadata"
    );

    const project = await transaction.projects(1);
    expect(project.creator).to.equal(await creator.getAddress());
    expect(project.targetFunds).to.equal(ethers.parseEther("1.0"));
    expect(project.totalMilestones).to.equal(2);
    expect(project.uri).to.equal("ipfs://project-metadata");
  });

  it("should allow ETH contribution", async () => {
    await transaction.connect(creator).createProject(
      ethers.parseEther("1.0"),
      2,
      "ipfs://project-metadata"
    );

    await transaction.connect(fan1).contribute(1, { value: ethers.parseEther("0.3") });
    expect(await transaction.getContributions(1, fan1.getAddress())).to.equal(ethers.parseEther("0.3"));
  });

  it("should allow milestone submission", async () => {
    await transaction.connect(creator).createProject(
      ethers.parseEther("1.0"),
      2,
      "ipfs://project-metadata"
    );

    await transaction.connect(fan1).contribute(1, { value: ethers.parseEther("1.0") });
    expect(await transaction.connect(creator).submitMilestone(1, "ipfs://milestone-metadata")).to.be.not.reverted;

    const milestone = await transaction.getMilestone(1, 0);
    expect(milestone.status).to.equal(3);
    expect(milestone.uri).to.equal("ipfs://milestone-metadata");
  });
});

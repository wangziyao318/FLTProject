import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { ignition } from "hardhat";
import DeployModule from "../ignition/modules/DeployModule";

describe("FLT", function () {
  let flt: any;
  let platform: Signer, creator: Signer, fan1: Signer, fan2: Signer;

  beforeEach(async () => {
    [platform, creator, fan1, fan2] = await ethers.getSigners();

    const deployment = await ignition.deploy(DeployModule);
    flt = deployment.flt;
  });

  it("should set platform as default admin", async () => {
    expect(await flt.hasRole(await flt.DEFAULT_ADMIN_ROLE(), await platform.getAddress())).to.be.true;
  });

  it("should mint FLT only by platform", async () => {
    await expect(
      flt.connect(fan1).mint(await fan2.getAddress(), 100, false)
    ).to.be.revertedWith("Not platform");

    await expect(flt.connect(platform).mint(await fan1.getAddress(), 100, false)).to.not.be.reverted;
  });

  it("should burn FLT only by platform", async () => {
    await expect(
      flt.connect(fan1).burn(await fan2.getAddress(), 100, false)
    ).to.be.revertedWith("Not platform");

    flt.connect(platform).mint(await fan1.getAddress(), 10, false);
    await expect(flt.connect(platform).burn(await fan1.getAddress(), 1, false)).to.not.be.reverted;
  });

  it("should be non-transferable", async () => {
    flt.connect(platform).mint(await fan1.getAddress(), 10, false);
    await expect(
      flt.connect(fan1).safeTransferFrom(await fan1.getAddress(), await fan2.getAddress(), 1, 5, ethers.getBytes("0x00"))
    ).to.be.revertedWith("Non-transferable token");
  });
});

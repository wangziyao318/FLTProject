import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("DeployModule", (m) => {
    // Deploy FLT contract.
    const flt = m.contract("FLT", ["ipfs://CID"]);
    // Deploy Governance contract.
    const governance = m.contract("Governance", [flt]);
    // Deploy Transaction contract.
    const transaction = m.contract("Transaction", [flt, governance]);
    // One-time cross-reference call.
    m.call(governance, "setTransaction", [transaction]);
    // Grant Transaction minter role.
    const PLATFORM_ROLE = m.staticCall(flt, "DEFAULT_ADMIN_ROLE");
    m.call(flt, "grantRole", [PLATFORM_ROLE, transaction]);

    return { flt, governance, transaction };
});

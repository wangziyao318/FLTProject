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
    // Grant Transaction and Governance platform role.
    const PLATFORM_ROLE = m.staticCall(flt, "DEFAULT_ADMIN_ROLE");
    m.call(flt, "grantRole", [PLATFORM_ROLE, transaction], {id: "GrantToTx"});
    m.call(flt, "grantRole", [PLATFORM_ROLE, governance], {id: "GrantToGov"});

    return { flt, governance, transaction };
});

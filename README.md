# Crowdfunding dApp

A crowdfunding dApp for fans and creators, using FLT (Fan Loyalty Token) as reputation.

## Usage

```sh
# Install Node Version Manager (nvm) from https://github.com/nvm-sh/nvm
nvm alias default lts/*
nvm install --lts
nvm use default

# Backend
git clone https://github.com/wangziyao318/FLTProject.git
cd FLTProject
npm install
npx hardhat typechain

# Frontend
cd frontend

# "Copy" (soft link) artifacts and typechain-types
cd src
ln -s ../../artifacts .
ln -s ../../typechain-types .
cd ..

npm install
npm start
```

## FLT Token

FLT (Fan Loyalty Token) == reputation

- non-transferable, based on ERC-5484
- mint to
  - FAN_ETH: when fans transfer ETH to creators
  - CREATOR: when creators completed milestones of their projects be approved
- burn
  - FAN_WITHDRAW: f(withdrawn_ETH) and blacklist if not affordable
  - DEFAULT: when creators fail to complete milestones, or milestones not approved, or creators cancel their projects

Creators and fans receive different types of FLT
- Fans use FLT to vote
- Creators' FLT can't be used to vote, their FLT only indicates their reputation

## ETH Transactions

Normal transactions

- FAN_to_PLATFORM: fan transfer ETH to creators during compaign, locked by the platform after compaign closed
- PLATFORM_to_CREATORS: when creators completed milestones be approved

Abnormal transactions

- PLATFORM_to_FANS: 10% reserved by the platform in all cases
  - FAN_WITHDRAW: fan wants to withdraw his contributed ETH
    - withdraw only possible when compaign not closed (compaign auto close when sufficient funds is raised)
  - CREATORS_PROJECT_CANCELLED: all ETH back to fans
    - as long as no milestone is approved
    - can cancel the project when compaign is active or closed
  - CREATORS_MILESTONE_FAILED: corresponding portion of ETH back to fans
    - creator's milestone failed to complete
    - creator's milestone not approved by voting
    - creator should continue his project and try to succeed in the next milestone

## Governance

- voting power based on fan's FLT balance
- blacklist a wallet address if burning amount exceeds its balance.

## Back-end Deployment

1. Deploy FLT.sol
2. Use FLT address to deploy Governance.sol
3. Use FLT address and Governance address to deploy Transaction.sol
4. Reference Transaction address in Governance (cross reference)
   - call Governance.setTransaction(transactionAddress)

```typescript
import { ethers } from "hardhat";
import { FLT, Governance, Transaction } from "../typechain-types";

let fltToken: FLT;
let transaction: Transaction;
let governance: Governance;

[deployer, creator, fan1, fan2] = await ethers.getSigners();

// Deploy FLT contract.
const FLT = await ethers.getContractFactory("FLT");
flt = await FLT.deploy("ipfs://sampleUri");

// Deploy Governance contract.
const Governance = await ethers.getContractFactory("Governance");
governance = await Governance.deploy(flt.getAddress());

// Deploy Transaction contract.
const Transaction = await ethers.getContractFactory("Transaction");
transaction = await Transaction.deploy(flt.getAddress(), governance.getAddress());

// Set up cross reference.
await governance.connect(deployer).setTransaction(transaction.getAddress());
```

## Front-end

1. login with metamask account
2. creators
   1. create project: targetFunds, totalMilestones, project metadata form ("ipfs://sampleUri"), submit button
   2. list all projects of the creator, including projectId
      1. cancel project: projectId, cancel button
      2. submit milestone: projectId, milestone metadata form ("ipfs://sampleUri"), submit milestone button
      3. get the proposalId from submitted milstone from project
         1. list proposal using proposalId
         2. execute proposal: proposalId, execute button
3. fans
   1. list all projects and their creators address, including projectId
      1. contribute ETH to project: projectId, ETH alue, contribute button
      2. withdraw previously contributed ETH: projectId, withdraw button (only withdraw all of them)
      3. list submitted milestone of all projects
         1. vote milestone: proposalId, 3 button (abstain=0, approve=1, against=2)
<!-- 4. IPFS -->

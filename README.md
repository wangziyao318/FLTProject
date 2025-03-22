# Crowdfunding dApp


## Usage

```sh
nvm alias default lts/*

nvm install --lts

nvm use default

npm install

npx hardhat test
```

## FLT Token

FLT - Fan Loyalty Token (no-transferable) == reputation

- based on ERC-5484

- mint to
  - FAN_ETH: when fans transfer ETH to creators
  - CREATOR: when creators completed milestones of their projects be approved
  - PROTOCOL: as stake (ownership) interest
- burn
  - FAN_WITHDRAW: f(withdrawn_ETH) and blacklist if not affordable
  - DEFAULT: when creators fail to complete milestones, or milestones not approved, or creators cancel their projects


## ETH Transactions

#### normal transactions

- FAN_to_PLATFORM: fan transfer ETH to creators, locked by the platform
- PLATFORM_to_CREATORS: when creators completed milestones be approved

#### abnormal transactions

- PLATFORM_to_FANS: fan's contributed ETH that is still locked by the platform can be withdrawn (10% goes to platform)
  - FAN_WITHDRAW: fan wants to withdraw his contributed ETH
    - **if the creator has completed half of all milestones, withdrawal not possible**
  - CREATORS_MILESTONE_FAILED: 3 cases
    - creator's milestone failed to complete
    - creator's milestone not approved by voting
    - creator cancels his project


## Governance

- voting power based on FLT


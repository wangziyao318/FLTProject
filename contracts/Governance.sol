// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "./FLT.sol";

contract MilestoneGovernor is Governor, GovernorSettings, GovernorCountingSimple {
    FLT public immutable flt;
    uint256 public constant MIN_FLT = 100;
    
    constructor(FLT _flt)
        Governor("MilestoneGovernor")
        GovernorSettings(1 /* voting delay (blocks) */, 60480 /* voting period (~1 week at 10s/block) */, 0)
    {
        flt = _flt;
    }

    // Required clock functions for block number mode
    function clock() public view override returns (uint48) {
        return uint48(block.number);
    }

    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=blocknumber&from=default";
    }

    function _getVotes(
        address account,
        uint256 /*timepoint*/,
        bytes memory /*params*/
    ) internal view override returns (uint256) {
        // Use block number corresponding to timepoint for historical lookups
        // In production: implement snapshot mechanism for ERC1155 balances
        uint256 balance = flt.balanceOf(account, flt.FAN_TOKEN_ID());
        return balance >= MIN_FLT ? sqrt(balance) : 0;
    }

    function quorum(uint256) public pure override returns (uint256) {
        return 0; // No quorum requirements
    }

    // Square root voting power calculation
    function sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }

    // Required overrides
    function votingDelay() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    function votingPeriod() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }
}

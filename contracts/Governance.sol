// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "./FLT.sol";

/**
 * @title Governance
 * @notice A simple governance contract for milestone voting.
 *         Voting power is based on the FLT token balance.
 *         Proposal metadata are stored in description using IPFS URI.
 */
contract Governance is Governor, GovernorSettings {
    FLT public fltToken;
    uint256 public constant FLT_TOKEN_ID = 1;

    /// @dev Taken from GovernorCountingSimple; 0 = Against, 1 = For, 2 = Abstain.
    enum VoteType {
        Against,
        For,
        Abstain
    }

    // Tracks vote counts for each proposal.
    struct ProposalVote {
        uint256 againstVotes;
        uint256 forVotes;
        uint256 abstainVotes;
    }
    mapping(uint256 => ProposalVote) public proposalVotes;

    // Tracks whether an address has voted on a proposal.
    mapping(uint256 => mapping(address => bool)) private _hasVoted;

    /**
     * @dev Initializes the Governor.
     * @param _fltToken The address of the FLT token contract.
     */
    constructor(FLT _fltToken)
        Governor("PlatformGovernor")
        GovernorSettings(
            1, // voting delay: 1 block
            100, // voting period: 100 blocks
            0 // proposal threshold: 0 FLT token, subject to change
        )
    { fltToken = _fltToken; }

    /**
     * @notice Defines the minimum votes needed for a proposal to pass.
     * blockNumber ignored for simplicity, use fixed quorum.
     * @return The quorum in FLT.
     */
    function quorum(uint256 /* blockNumber */) public pure override returns (uint256) {
        return 1000e18; // require a quorum of 1000 ether FLT
    }



    // --- Overridding Governor and GovernorSettings ---

    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    /**
     * @notice Returns the current "clock" used for proposals (block number).
     * @dev uint256 to uint48 cast, expect precision loss.
     *      No need to use the new timestamp feature which is over-complicated.
     */
    function clock() public view override returns (uint48) {
        return uint48(block.number);
    }

    /**
     * @notice Returns the clock mode used by this Governor.
     * @dev Use the old mode block number "mode=blocknumber".
     */
    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=blocknumber";
    }

    /**
     * @notice Indicates the voting counting mode.
     * @dev The governor uses Bravo-style counting with for, against, and abstain.
     *      This is simple and widely-adopted mode in dApps.
     */
    function COUNTING_MODE() public pure override returns (string memory) {
        return "support=bravo&quorum=for,against,abstain";
    }

    /**
     * @notice Return true if the account has voted on the proposal.
     * @param proposalId The proposal ID.
     * @param account The acount address.
     */
    function hasVoted(
        uint256 proposalId,
        address account
    ) public view override returns (bool) {
        return _hasVoted[proposalId][account];
    }

    /**
     * @notice Determine if the quorum has been reached for the proposal.
     * @param proposalId The proposal ID.
     * @return True if the total votes meets or exceeds the quorum.
     */
    function _quorumReached(
        uint256 proposalId
    ) internal view override returns (bool) {
        ProposalVote storage vote = proposalVotes[proposalId];
        return
            (vote.forVotes + vote.againstVotes + vote.abstainVotes) >=
            quorum(block.number);
    }

    /**
     * @notice Determines if a proposal has succeeded.
     * @param proposalId The proposal ID.
     * @return True if the "For" votes exceed the "Against" votes.
     */
    function _voteSucceeded(
        uint256 proposalId
    ) internal view override returns (bool) {
        ProposalVote storage vote = proposalVotes[proposalId];
        return vote.forVotes > vote.againstVotes;
    }

    /**
     * @notice Returns the voting power of an account.
     * @param account The address which votes.
     * blockNumber The block number.
     * params Additional parameters.
     * @return The voting power based on the FLT balance.
     */
    function _getVotes(
        address account,
        uint256 /* blockNumber */,
        bytes memory /* params */
    ) internal view override returns (uint256) {
        return fltToken.balanceOf(account, FLT_TOKEN_ID);
    }

    /**
     * @notice Records a vote on a proposal.
     * @param proposalId The proposal ID.
     * @param account The address which votes.
     * @param support The vote type (0 = Against, 1 = For, 2 = Abstain).
     * @param weight The weight of the vote.
     * params Additional parameters.
     * @return The weight of the vote.
     */
    function _countVote(
        uint256 proposalId,
        address account,
        uint8 support,
        uint256 weight,
        bytes memory /* params */
    ) internal override returns (uint256) {
        require(!_hasVoted[proposalId][account], "Governor: vote already cast");
        _hasVoted[proposalId][account] = true;

        ProposalVote storage vote = proposalVotes[proposalId];
        if (support == uint8(VoteType.For)) {
            vote.forVotes += weight;
        } else if (support == uint8(VoteType.Against)) {
            vote.againstVotes += weight;
        } else if (support == uint8(VoteType.Abstain)) {
            vote.abstainVotes += weight;
        }
        return weight;
    }
}

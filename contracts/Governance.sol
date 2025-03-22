// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "./FLT.sol";

/**
 * @title Governance
 * @notice A simplified governance contract for milestone voting.
 *         Voting power is based on the FLT token balance (token id 1).
 *         Proposal details are referenced via an IPFS URI (provided in the proposal description).
 *
 * This contract adheres to the newest OpenZeppelin v5.x Governor library, overriding the following eight virtual functions:
 *  - clock()
 *  - CLOCK_MODE()
 *  - COUNTING_MODE()
 *  - hasVoted()
 *  - _quorumReached()
 *  - _voteSucceeded()
 *  - _getVotes()
 *  - _countVote()
 */
contract Governance is Governor, GovernorSettings {
    FLT public fltToken;
    uint256 public constant FLT_TOKEN_ID = 1;

    // --- Vote Counting Structures ---

    // Vote types: 0 = Against, 1 = For, 2 = Abstain.
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
    constructor(
        FLT _fltToken
    )
        Governor("PlatformGovernor")
        GovernorSettings(
            1, // voting delay: 1 block
            45818, // voting period: ~1 week in blocks
            0 // proposal threshold
        )
    {
        fltToken = _fltToken;
    }

    // --- Overrides from Governor and GovernorSettings ---

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
     */
    function clock() public view override returns (uint48) {
        return uint48(block.number);
    }

    /**
     * @notice Returns the clock mode used by this Governor.
     * @dev Since voting delay and period are defined in blocks, we return "mode=blocknumber".
     */
    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=blocknumber";
    }

    /**
     * @notice Indicates the voting counting mode.
     * @dev This string tells interfaces that the governor uses Bravo-style counting with for, against, and abstain.
     */
    function COUNTING_MODE() public pure override returns (string memory) {
        return "support=bravo&quorum=for,against,abstain";
    }

    /**
     * @notice Returns true if the given account has cast a vote on the specified proposal.
     * @param proposalId The proposal identifier.
     * @param account The address to check.
     */
    function hasVoted(
        uint256 proposalId,
        address account
    ) public view override returns (bool) {
        return _hasVoted[proposalId][account];
    }

    /**
     * @notice Determines if the quorum has been reached for a proposal.
     * @param proposalId The proposal identifier.
     * @return True if the sum of for, against, and abstain votes meets or exceeds the quorum.
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
     * @param proposalId The proposal identifier.
     * @return True if the "For" votes exceed the "Against" votes.
     */
    function _voteSucceeded(
        uint256 proposalId
    ) internal view override returns (bool) {
        ProposalVote storage vote = proposalVotes[proposalId];
        return vote.forVotes > vote.againstVotes;
    }

    /**
     * @notice Returns the voting power of an account at a given block.
     * @param account The address whose votes to count.
     * blockNumber The block number at which to fetch the voting power.
     * params Additional parameters (unused in this simple example).
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
     * @param proposalId The proposal identifier.
     * @param account The voter's address.
     * @param support The vote type (0 = Against, 1 = For, 2 = Abstain).
     * @param weight The weight of the vote.
     * params Additional parameters (unused).
     * @return The weight of the vote that was counted.
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

    function quorum(uint256 timepoint) public view override returns (uint256) {}
}

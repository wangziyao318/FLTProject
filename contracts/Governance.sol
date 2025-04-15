// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./IFLT.sol";
import "./IGovernance.sol";
import "./ITransaction.sol";

/**
 * @title Governance
 * @notice A governance contract for milestone voting.
 *         Voting power is based on fan's FLT balance.
 *         Proposal metadata is stored using IPFS URI.
 */
contract Governance is IGovernance, ReentrancyGuard {
    IFLT flt;
    ITransaction transaction;

    /// @dev Proposal duration in number of blocks
    uint256 public constant VOTING_PERIOD = 10;

    /// @dev Minimum FLT balance required to cast a vote
    uint256 public constant MIN_VOTING_BALANCE = 1e18;

    /// @dev Minimum total votes required for a proposal to be valid
    uint256 public constant QUORUM = 1e18;

    /// @dev Total number of proposals, used as proposalId, 0 is reserved
    uint256 public proposalCount;

    struct Proposal {
        uint256 projectId;
        address creator;
        uint256 startBlock;
        uint256 endBlock;
        uint256 abstainVotes;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
        string uri;
        mapping(address => bool) hasVoted;
    }

    ///@dev proposalId => Proposal
    mapping(uint256 => Proposal) public proposals;

    modifier notBlacklisted() {
        require(
            !flt.hasRole(flt.BLACKLIST_ROLE(), msg.sender),
            "Blacklisted account"
        );
        _;
    }

    modifier onlyPlatform() {
        require(flt.hasRole(0x00, msg.sender), "Not platform");
        _;
    }

    /**
     * @param _flt Address of deployed FLT contract
     */
    constructor(address _flt) { flt = IFLT(_flt); }

    // --- Platform's functions: setTransaction(), propose() ---

    /**
     * @dev Set cross reference of Governance to Transaction
     * @param _transaction Address of deployed Transaction contract
     */
    function setTransaction(address _transaction) external onlyPlatform {
        require(address(transaction) == address(0), "Already set");
        transaction = ITransaction(_transaction);
    }

    function propose(
        uint256 projectId,
        address creator,
        string calldata uri
    ) external override onlyPlatform returns (uint256) {
        Proposal storage proposal = proposals[++proposalCount];
        proposal.projectId = projectId;
        proposal.creator = creator;
        proposal.startBlock = block.number;
        proposal.endBlock = block.number + VOTING_PERIOD;
        proposal.uri = uri;

        emit ProposalCreated(proposalCount, creator);

        return proposalCount;
    }

    // --- Fan's function: castVote() ---

    function castVote(
        uint256 proposalId,
        uint8 support
    ) external override notBlacklisted nonReentrant {
        require(proposalId != 0, "Reserved ID");

        Proposal storage proposal = proposals[proposalId];
        require(proposal.creator != msg.sender, "Cannot vote own milestone");
        require(block.number >= proposal.startBlock, "Proposal not started");
        require(block.number < proposal.endBlock, "Proposal ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");
        
        uint256 balance = flt.balanceOf(msg.sender, flt.FAN_TOKEN_ID());
        require(balance >= MIN_VOTING_BALANCE, "Insufficient FLT for voting");

        if (support == 0) proposal.abstainVotes += balance; // abstain
        else if (support == 1) proposal.forVotes += balance; // for
        else if (support == 2) proposal.againstVotes += balance; // against
        else revert("Wrong voting support type");

        proposal.hasVoted[msg.sender] = true;
        emit VoteCasted(proposalId, msg.sender, support);
    }

    // --- Creator's function: execute() ---

    function execute(
        uint256 proposalId
    ) external override notBlacklisted nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.creator == msg.sender, "Not project creator");
        require(block.number >= proposal.endBlock, "Proposal still active");
        require(!proposal.executed, "Proposal already executed");

        /// @dev If quorum is not met, skip execution and refresh voting period
        uint256 totalVotes =
            proposal.abstainVotes + proposal.forVotes + proposal.againstVotes;
        if (totalVotes < QUORUM)
            proposal.endBlock = block.number + VOTING_PERIOD;
        else {
            proposal.executed = true;

            /// @dev Simple majority, with 50% as threshold
            bool approved = proposal.forVotes * 2 > totalVotes;
            emit ProposalExecuted(proposalId, approved);

            /// @dev Call Transaction.sol to release or void current milestone
            if (approved) transaction.releaseMilestone(proposal.projectId);
            else transaction.voidMilestone(proposal.projectId);
        }
    }

    fallback() external {
        revert("Governance: function not implemented");
    }
}

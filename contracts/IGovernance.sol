// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IGovernance {

    // --- Events ---
    
    event ProposalCreated(uint256 proposalId, address creator);

    event VoteCasted(uint256 proposalId, address voter, uint8 support);

    event ProposalExecuted(uint256 proposalId, bool approved);

    // --- Getters ---

    function VOTING_PERIOD() external view returns (uint256);

    function MIN_VOTING_BALANCE() external view returns (uint256);

    function QUORUM() external view returns (uint256);

    // --- Platform's function: propose() ---

    /**
     * @dev Create a new proposal, return the proposal ID
     * @param projectId Project ID
     * @param creator Creator for the project milestone
     * @param uri IPFS metadata URI
     * @return Proposal ID
     */
    function propose(
        uint256 projectId,
        address creator,
        string calldata uri
    ) external returns (uint256);

    // --- Fan's function: castVote() ---

    /**
     * @dev Cast a vote using fan's current FLT balance as voting power
     * @param proposalId Proposal to vote
     * @param support Default 0=abstain, 1=for, 2=against
     */
    function castVote(uint256 proposalId, uint8 support) external;

    // --- Creator's function: execute() ---

    /**
     * @dev Execute a proposal after voting ended, skip if quorum is not met
     * @param proposalId Proposal to execute
     */
    function execute(uint256 proposalId) external;
}

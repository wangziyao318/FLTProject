// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ITransaction {
    
    // --- Events ---

    event ProjectCreated(
        uint256 projectId,
        address creator,
        uint256 targetFunds,
        uint256 totalMilestones,
        string uri
    );

    event ProjectCancelled(uint256 projectId, address creator);

    event CompaignEnded(uint256 projectId, uint256 totalFunds);

    event MilestoneSubmitted(uint256 projectId, uint256 milestoneIndex);

    event MilestoneReleased(
        uint256 projectId,
        uint256 milestoneIndex,
        uint256 amountReleased
    );
    
    event ContributionReceived(uint256 projectId, address fan, uint256 value);
    
    event RefundIssued(uint256 projectId, address fan, uint256 value);
    
    // --- Getters ---

    function projectCount() external view returns (uint256);

    // --- Creator's functions: createProject(), cancelProject(), submitMilestone() ---

    /**
     * @dev Creator launches a project, return the project ID
     * @param targetFunds The funding target for project
     * @param totalMilestones The total number of milestones in the project
     * @param uri The IPFS URI for off-chain project metadata
     * @return The Project ID
     */
    function createProject(
        uint256 targetFunds,
        uint8 totalMilestones,
        string calldata uri
    ) external returns (uint256);

    /**
     * @notice Creator cancels a project
     *         A fixed FLT penalty is applied to creator on cancellation
     *         Creator address is blacklisted if FLT penalty exceeds its balance
     * @param projectId The project ID
     */
    function cancelProject(uint256 projectId) external;

    /**
     * @notice Creator submits a milestone of a project
     *         IPFS URI stores the milestone metadata
     * @param projectId The project ID
     * @param uri Milestone IPFS URI
     */
    function submitMilestone(uint256 projectId, string calldata uri) external;

    // --- Fan's functions: contribute(), withdraw() ---

    /**
     * @dev Fans contribute ETH to a project
     *      Their contribution is recorded and rewarded with FLT
     * @param projectId The project ID
     */
    function contribute(uint256 projectId) external payable;

    /**
     * @dev Allows a fan to withdraw his contribution only when compaign is active
     *      FLT from contribution plus a fixed penalty is applied on withdrawal
     *      Fan address is blacklisted if FLT penalty exceeds its balance
     * @param projectId The project ID
     */
    function withdraw(uint256 projectId) external;

    // --- Platform's functions: releaseMilestone(), voidMilestone() ---

    /**
     * @dev Called by platform after an approved proposal
     *      to release ETH to the creator for a milestone
     *      Also mints reward FLT tokens to the creator
     * @param projectId The project ID
     */
    function releaseMilestone(uint256 projectId) external;

    /**
     * @notice Invalidate a failed milestone and applies a FLT penalty to the creator.
     *         Refund corresponding portion of ETH to fans.
     * @param projectId The project for which the milestone failed.
     */
    function voidMilestone(uint256 projectId) external;
}

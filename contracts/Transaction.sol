// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./FLT.sol";

/* TODO
mint only to those without blacklist
add event CampaignClosed(uint256 totalFunds, uint256 milestoneFund);
nonReentrant for all write functions

access control to replace ownable+blacklist function, blacklisted address cannot do any transactions

fans can only withdraw when the compaign is active (avoid many subsequent issues),
also remove the withdraw mapping so that only withdraw all contribution is possible (fees apply)

creator can only cancel the project when no milestone has been approved

when creator fails a milestone, the corresponding funds are refunded.
this needs a withdraw mapping? no. all funds will be auto refunded by the platform (fees apply)
*/


/**
 * @title Transaction
 * @notice Handle ETH contributions, fund locking/release, and FLT minting/burning.
 *         Off-chain project metadata is stored in JSON format on IPFS.
 */
contract Transaction is Ownable, ReentrancyGuard {
    /// @dev FLT instance for minting and burning
    FLT public fltToken;

    /// @dev Constants for FLT rewards and penalties (subject to change)
    uint256 public creatorRewardAmount = 10e18; // 10 ether FLT reward for approved milestone
    uint256 public fanWithdrawPenalty = 1e18; // 1 ether FLT penalty for fan withdrawal
    uint256 public creatorFailurePenalty = 5e18; // 5 ether FLT penalty for milestone failure
    uint256 public creatorCancelPenalty = 5e18; // 5 ether FLT penalty for project cancellation

    /// @dev Total number of projects, used as projectID
    uint256 public projectCount;

    struct Project {
        address creator;
        uint256 totalMilestones;
        uint256 approvedMilestones;
        uint256 targetAmount;
        uint256 fundsCollected;
        uint256 releasedFunds;
        bool campaignSuccessful;
        bool campaignClosed;
        bool cancelled;
        string metadataUri; // IPFS URI for off-chain project metadata in JSON
    }

    ///@dev projectId => Project
    mapping(uint256 => Project) public projects;
    /// @dev projectId => (fan address => contributed amount)
    mapping(uint256 => mapping(address => uint256)) public contributions;
    /// @dev projectId => (fan address => amount already withdrawn)
    mapping(uint256 => mapping(address => uint256)) public withdrawals;
    /// @dev Blacklist for addresses that fail to afford the FLT penalty amount
    mapping(address => bool) public blacklist;

    event ProjectCreated(
        uint256 projectId,
        address creator,
        uint256 totalMilestones,
        uint256 targetAmount,
        string metadataUri
    );
    event ContributionReceived(uint256 projectId, address fan, uint256 amount);
    event MilestoneReleased(
        uint256 projectId,
        uint256 milestoneIndex,
        uint256 amountReleased,
        string milestoneMetadataUri
    );
    event Withdrawal(uint256 projectId, address fan, uint256 amount); // event RefundIssued
    event ProjectCancelled(uint256 projectId, address creator);

    constructor(FLT _fltToken) Ownable(msg.sender) {
        fltToken = _fltToken;
    }

    /**
     * @notice Creator launches a new project.
     * @param totalMilestones The total number of milestones in the project.
     * @param targetAmount The funding target (in wei) for fundraising campaign.
     * @param metadataUri The IPFS URI for off-chain project metadata.
     * @return projectId The ID of the project.
     */
    function createProject(
        uint256 totalMilestones,
        uint256 targetAmount,
        string calldata metadataUri
    ) external nonReentrant returns (uint256) {
        require(totalMilestones > 0, "Milestones must be > 0");
        require(targetAmount > 0, "Target amount must be > 0");
        projects[++projectCount] = Project({
            creator: msg.sender,
            totalMilestones: totalMilestones,
            approvedMilestones: 0,
            targetAmount: targetAmount,
            fundsCollected: 0,
            releasedFunds: 0,
            campaignSuccessful: false,
            campaignClosed: false,
            cancelled: false,
            metadataUri: metadataUri
        });
        emit ProjectCreated(projectCount, msg.sender, totalMilestones, targetAmount, metadataUri);
        return projectCount;
    }

    /**
     * @notice Fans contribute ETH to a project.
     *         Their contribution is recorded and rewarded with FLT.
     * @param projectId The project fans contribute to.
     */
    function contribute(uint256 projectId) external payable nonReentrant {
        /// @dev storage is required to modify the on-chain data
        Project storage proj = projects[projectId];
        require(!proj.campaignClosed, "Campaign already closed");
        require(msg.value > 0, "Contribution must be > 0");

        uint256 remaining = proj.targetAmount - proj.fundsCollected;
        require(remaining > 0, "Funding target already reached");

        uint256 contribution = msg.value;

        if (msg.value > remaining) {
            (bool success, ) = msg.sender.call{value: (contribution - remaining)}("");
            require(success, "ETH refund failed");
            contribution = remaining;
        }

        proj.fundsCollected += contribution;
        contributions[projectId][msg.sender] += contribution;
        emit ContributionReceived(projectId, msg.sender, contribution);

        /// @dev Mint FLT tokens to fan (1 wei ETH contributes 1 wei FLT)
        fltToken.mint(msg.sender, msg.value);

        // Mark campaign as successful if the target is met or exceeded.
        if (proj.fundsCollected >= proj.targetAmount) {
            proj.campaignSuccessful = true;
            proj.campaignClosed = true;
        }
    }

    /**
     * @notice Allows a fan to withdraw his contribution only when compaign is active,
     *         A fixed FLT penalty is applied to fan on withdrawal.
     * @param projectId The project from which to withdraw.
     */
    function withdraw(uint256 projectId) external nonReentrant {
        Project storage proj = projects[projectId];
        require(!proj.campaignClosed, "Campaign funds locked, cannot withdraw");
        // require(
        //     proj.approvedMilestones * 2 <= proj.totalMilestones,
        //     "Withdrawal not allowed after > half milestones approved"
        // );

        uint256 contributed = contributions[projectId][msg.sender];
        require(contributed > 0, "No contribution found");

        // Calculate fan's locked share based on the remaining locked pool.
        uint256 lockedPool = proj.fundsCollected - proj.releasedFunds;
        uint256 fanLocked = (contributed * lockedPool) / proj.fundsCollected;
        uint256 alreadyWithdrawn = withdrawals[projectId][msg.sender];
        require(fanLocked > alreadyWithdrawn, "No withdrawable balance");
        uint256 withdrawable = fanLocked - alreadyWithdrawn;

        // Update the record and transfer ETH.
        withdrawals[projectId][msg.sender] += withdrawable;
        (bool success, ) = msg.sender.call{value: withdrawable}("");
        require(success, "ETH transfer failed");
        emit Withdrawal(projectId, msg.sender, withdrawable);

        // Apply FLT penalty for withdrawal, blacklist when needed.
        uint256 fanBalance = fltToken.balanceOf(msg.sender, Constants.FLT_TOKEN_ID);
        if (fanBalance < fanWithdrawPenalty) {
            blacklist[msg.sender] = true;
        } else {
            fltToken.burn(msg.sender, fanWithdrawPenalty);
        }
    }

    /**
     * @notice Called by platform after a successful governance vote
     *         to release ETH to the creator for a milestone.
     *         Also mints reward FLT tokens to the creator.
     * @param projectId The project for which to release funds.
     * @param milestoneMetadataUri The IPFS URI for off-chain milestone metadata.
     */
    function releaseMilestone(
        uint256 projectId,
        string calldata milestoneMetadataUri
    ) external onlyOwner {
        Project storage proj = projects[projectId];
        require(proj.campaignSuccessful, "Campaign not successful");
        require(!proj.cancelled, "Project cancelled");
        require(proj.approvedMilestones < proj.totalMilestones, "All milestones already released");

        // Calculate the fixed release amount per milestone.
        uint256 releaseAmount = proj.targetAmount / proj.totalMilestones;
        require(proj.fundsCollected - proj.releasedFunds >= releaseAmount, "Insufficient locked funds");

        proj.releasedFunds += releaseAmount;
        proj.approvedMilestones += 1;

        // Transfer ETH to the creator.
        (bool success, ) = proj.creator.call{value: releaseAmount}("");
        require(success, "Transfer to creator failed");

        // Reward the creator with FLT.
        fltToken.mint(proj.creator, creatorRewardAmount);

        emit MilestoneReleased(projectId, proj.approvedMilestones, releaseAmount, milestoneMetadataUri);
    }

    /**
     * @notice Marks a milestone as failed and applies a FLT penalty to the creator.
     * @param projectId The project for which the milestone failed.
     */
    function markMilestoneFailed(uint256 projectId) external onlyOwner {
        Project storage proj = projects[projectId];
        require(proj.campaignSuccessful, "Campaign not successful");
        require(!proj.cancelled, "Project cancelled");

        uint256 creatorBalance = fltToken.balanceOf(proj.creator, Constants.FLT_TOKEN_ID);
        if (creatorBalance < creatorFailurePenalty) {
            blacklist[proj.creator] = true;
        } else {
            fltToken.burn(proj.creator, creatorFailurePenalty);
        }
    }

    /**
     * @notice Allows the creator to cancel a project that has already succeeded in its campaign.
     *         Cancellation burns FLT from the creator as penalty.
     * @param projectId The project to cancel.
     */
    function cancelProject(uint256 projectId) external {
        Project storage proj = projects[projectId];
        require(msg.sender == proj.creator, "Only creator can cancel");
        require(proj.campaignSuccessful, "Campaign not successful");
        require(!proj.cancelled, "Project already cancelled");

        proj.cancelled = true;
        emit ProjectCancelled(projectId, msg.sender);

        uint256 creatorBalance = fltToken.balanceOf(proj.creator, Constants.FLT_TOKEN_ID);
        if (creatorBalance < creatorCancelPenalty) {
            blacklist[proj.creator] = true;
        } else {
            fltToken.burn(proj.creator, creatorCancelPenalty);
        }
    }

    /// @dev Important! Allow the contract to receive ETH directly.
    receive() external payable {}
}

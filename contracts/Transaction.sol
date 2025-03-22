// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./FLT.sol";

/**
 * @title Transaction
 * @notice Handles ETH contributions, fund locking/release, and FLT minting/burning for the crowdfunding platform.
 *         Off-chain project common data (such as project description, images, etc.) is stored on IPFS.
 */
contract Transaction is Ownable {
    FLT public fltToken;
    uint256 public constant FLT_TOKEN_ID = 1;

    // Constants for FLT penalties and rewards (adjust as needed)
    uint256 public fanWithdrawPenalty = 1e18;       // 1 FLT penalty for fan withdrawal
    uint256 public creatorRewardAmount = 10e18;       // 10 FLT reward per approved milestone
    uint256 public creatorFailurePenalty = 5e18;      // 5 FLT penalty for milestone failure
    uint256 public creatorCancelPenalty = 5e18;       // 5 FLT penalty for project cancellation

    uint256 public projectCount;

    struct Project {
        address creator;
        uint256 totalMilestones;
        uint256 approvedMilestones;
        uint256 targetAmount;
        uint256 fundsCollected;
        uint256 releasedFunds;
        bool campaignSuccessful;
        bool campaignEnded;
        bool cancelled;
        string metadataUri; // IPFS URI for off-chain project data (JSON)
    }

    // projectId => Project details
    mapping(uint256 => Project) public projects;
    // projectId => (fan address => contributed amount)
    mapping(uint256 => mapping(address => uint256)) public contributions;
    // projectId => (fan address => amount already withdrawn)
    mapping(uint256 => mapping(address => uint256)) public withdrawals;
    // Blacklist for addresses that fail to maintain the required FLT balance
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
    event Withdrawal(uint256 projectId, address fan, uint256 amount);
    event ProjectCancelled(uint256 projectId, address creator);

    constructor(FLT _fltToken) Ownable(msg.sender) {
        fltToken = _fltToken;
    }

    /**
     * @notice Creator launches a new project.
     * @param totalMilestones The total number of milestones.
     * @param targetAmount The funding target (in wei) for the campaign.
     * @param metadataUri The IPFS URI pointing to off-chain project details (e.g. description, images).
     * @return projectId The ID of the newly created project.
     */
    function createProject(
        uint256 totalMilestones,
        uint256 targetAmount,
        string calldata metadataUri
    ) external returns (uint256) {
        require(totalMilestones > 0, "Milestones must be > 0");
        require(targetAmount > 0, "Target amount must be > 0");
        projectCount++;
        projects[projectCount] = Project({
            creator: msg.sender,
            totalMilestones: totalMilestones,
            approvedMilestones: 0,
            targetAmount: targetAmount,
            fundsCollected: 0,
            releasedFunds: 0,
            campaignSuccessful: false,
            campaignEnded: false,
            cancelled: false,
            metadataUri: metadataUri
        });
        emit ProjectCreated(projectCount, msg.sender, totalMilestones, targetAmount, metadataUri);
        return projectCount;
    }

    /**
     * @notice Fans contribute ETH to a project. Their contribution is recorded and rewarded with FLT.
     * @param projectId The project to contribute to.
     */
    function contribute(uint256 projectId) external payable {
        Project storage proj = projects[projectId];
        require(!proj.campaignEnded, "Campaign already ended");
        require(msg.value > 0, "Contribution must be > 0");
        contributions[projectId][msg.sender] += msg.value;
        proj.fundsCollected += msg.value;
        emit ContributionReceived(projectId, msg.sender, msg.value);

        // Mint FLT tokens to fan (here 1 wei contributes 1 FLT unit)
        fltToken.mint(msg.sender, msg.value);

        // Mark campaign as successful if the target is met or exceeded.
        if (proj.fundsCollected >= proj.targetAmount) {
            proj.campaignSuccessful = true;
            proj.campaignEnded = true;
        }
    }

    /**
     * @notice Allows a fan to withdraw their share of the locked funds if less than or equal to half the milestones have been approved.
     *         A fixed FLT penalty is applied to discourage withdrawal.
     * @param projectId The project from which to withdraw.
     */
    function withdraw(uint256 projectId) external {
        Project storage proj = projects[projectId];
        require(proj.campaignSuccessful, "Campaign not successful");
        require(proj.approvedMilestones * 2 <= proj.totalMilestones, "Withdrawal not allowed after > half milestones approved");

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

        // Apply FLT penalty for withdrawal.
        uint256 fanBalance = fltToken.balanceOf(msg.sender, FLT_TOKEN_ID);
        if (fanBalance < fanWithdrawPenalty) {
            blacklist[msg.sender] = true;
        } else {
            fltToken.burn(msg.sender, fanWithdrawPenalty);
        }
    }

    /**
     * @notice Called (by platform/admin or after a successful governance vote) to release ETH to the creator for a milestone.
     *         Also mints reward FLT tokens to the creator.
     * @param projectId The project for which to release funds.
     * @param milestoneMetadataUri The IPFS URI pointing to off-chain milestone details (e.g. progress report, images).
     */
    function releaseMilestone(uint256 projectId, string calldata milestoneMetadataUri) external onlyOwner {
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

        uint256 creatorBalance = fltToken.balanceOf(proj.creator, FLT_TOKEN_ID);
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

        uint256 creatorBalance = fltToken.balanceOf(proj.creator, FLT_TOKEN_ID);
        if (creatorBalance < creatorCancelPenalty) {
            blacklist[proj.creator] = true;
        } else {
            fltToken.burn(proj.creator, creatorCancelPenalty);
        }
    }

    // Allow the contract to receive ETH.
    receive() external payable {}
}

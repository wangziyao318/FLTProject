// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./IFLT.sol";
import "./ITransaction.sol";
import "./IGovernance.sol";

/**
 * @title Transaction
 * @notice Handle ETH contributions, fund locking/release, and FLT minting/burning.
 *         Off-chain project metadata is stored using IPFS URI.
 */
contract Transaction is ITransaction, ReentrancyGuard {
    IFLT flt;
    IGovernance governance;

    /// @dev Constants for FLT rewards and penalties
    uint256 public constant CREATOR_REWARD = 10e18;
    uint256 public constant FAN_PENALTY = 1e17;
    uint256 public constant CREATOR_PENALTY = 5e18;

    /// @dev Total number of projects, used as projectId, 0 is reserved
    uint256 public projectCount;

    struct Milestone {
        uint8 status; // 0 default, 1 approved, 2 rejected, 3 submitted
        uint256 proposalId;
        string uri;
    }

    struct Project {
        address creator;
        uint256 targetFunds;
        uint256 totalFunds;
        Milestone[] milestones;
        uint8 totalMilestones;
        uint8 currentMilestone;
        bool campaignEnded;
        bool cancelled;
        bool completed;
        string uri;
        address[] contributors;
        mapping(address => uint256) contributions;
    }

    /// @dev projectId => Project
    mapping(uint256 => Project) public projects;
    /// @dev creator address => projectId[]
    /// @dev in ether.js, (address, index) => projectId
    mapping(address => uint256[]) public projectIds;
    /// @dev fan address => projectId[]
    mapping(address => uint256[]) public contributedProjectIds;

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

    modifier validProjectId(uint256 projectId) {
        require(projectId != 0, "Reserved ID");
        require(projectId <= projectCount, "No such project");
        _;
    }

    /**
     * @param _flt Address of deployed FLT contract
     * @param _governance Address of deployed Governance contract
     */
    constructor(address _flt, address _governance) {
        flt = IFLT(_flt);
        governance = IGovernance(_governance);
    }

    // --- Public functions ---

    function getProjectIdCount(address creator) external view returns (uint256) {
        return projectIds[creator].length;
    }

    function getContributedProjectIdCount(address fan) external view returns (uint256) {
        return contributedProjectIds[fan].length;
    }

    function getContributions(uint256 projectId, address fan) public view returns (uint256) {
        return projects[projectId].contributions[fan];
    }

    function getMilestone(
        uint256 projectId,
        uint256 milestoneIndex
    ) external view returns (Milestone memory) {
        return projects[projectId].milestones[milestoneIndex];
    }

    // --- Creator's functions: createProject(), cancelProject(), submitMilestone() ---

    function createProject(
        uint256 targetFunds,
        uint8 totalMilestones,
        string calldata uri
    ) external override notBlacklisted nonReentrant returns (uint256) {
        require(targetFunds > 0, "Funding target must be > 0");
        require(totalMilestones > 0, "Total milestones must be > 0");
        require(bytes(uri).length > 0, "IPFS URI cannot be empty");

        Project storage proj = projects[++projectCount];

        proj.creator = msg.sender;
        proj.targetFunds = targetFunds;
        proj.totalMilestones = totalMilestones;
        proj.uri = uri;

        /// @dev proj.milestones = new Milestone[](totalMilestones);
        for (uint256 i = 0; i < totalMilestones; ++i) {
            proj.milestones.push(Milestone(0, 0, ""));
        }
        require(proj.milestones.length == totalMilestones, "Wrong assign logic");

        /// @dev Assign the project ID to creator address
        projectIds[msg.sender].push(projectCount);

        emit ProjectCreated(projectCount, msg.sender, targetFunds, totalMilestones, uri);

        return projectCount;
    }

    function cancelProject(uint256 projectId) external override notBlacklisted nonReentrant validProjectId(projectId) {
        Project storage proj = projects[projectId];
        require(msg.sender == proj.creator, "Not the project creator");
        require(!proj.cancelled, "Project already cancelled");
        require(proj.currentMilestone == 0, "Project has milestone voted");
        require(
            proj.milestones[proj.currentMilestone].status != 3,
            "Current milestone already submitted"
        );

        /// @dev Reject contribution during refund
        proj.campaignEnded = true;
        proj.cancelled = true;

        emit ProjectCancelled(projectId, msg.sender);

        /// @dev Burn creator's FLT as penalty, blacklist when needed
        flt.burn(proj.creator, CREATOR_PENALTY, true);
    
        /// @dev Refund all ETH of the project to fans
        for (uint256 i = 0; i < proj.contributors.length; ++i) {
            uint256 value = proj.contributions[proj.contributors[i]];
            if (value > 0) {
                proj.contributions[proj.contributors[i]] = 0;
                (bool success, ) = proj.contributors[i].call{value: value}("");
                require(success, "Refund failed");
                emit RefundIssued(projectId, proj.contributors[i], value);
            }
        }
        delete proj.contributors;
    }

    function submitMilestone(
        uint256 projectId,
        string calldata uri
    ) external override notBlacklisted nonReentrant validProjectId(projectId) {
        Project storage proj = projects[projectId];
        require(msg.sender == proj.creator, "Not the project creator");
        require(proj.campaignEnded, "Campaign not ended");
        require(!proj.cancelled, "Project already cancelled");
        require(!proj.completed, "Project already completed");
        require(
            proj.milestones[proj.currentMilestone].status != 3,
            "Current milestone already submitted"
        );
        
        /// @dev Submit the current milestone
        Milestone storage milestone = proj.milestones[proj.currentMilestone];
        milestone.status = 3;
        milestone.uri = uri;

        emit MilestoneSubmitted(projectId, proj.currentMilestone);

        /// @dev Call Governance.sol to raise a proposal, store the proposalId
        milestone.proposalId = governance.propose(projectId, proj.creator, uri);
    }

    // --- Fan's functions: contribute(), withdraw() ---

    function contribute(
        uint256 projectId
    ) external payable override notBlacklisted nonReentrant validProjectId(projectId) {
        require(msg.value > 0, "Contribution must be > 0");

        Project storage proj = projects[projectId];
        require(!proj.cancelled, "Project cancelled");
        require(!proj.campaignEnded, "Campaign already ended");
        require(msg.sender != proj.creator, "Cannot contribute to own project");

        uint256 remaining = proj.targetFunds - proj.totalFunds;
        require(remaining > 0, "Funding target already reached");

        /// @dev Refund exceeded contribution
        uint256 contribution = msg.value;
        if (msg.value > remaining) {
            (bool success, ) = msg.sender.call{value: (contribution - remaining)}("");
            require(success, "ETH refund failed");
            contribution = remaining;
        }

        /// @dev Add new contributor
        if (proj.contributions[msg.sender] == 0) {
            proj.contributors.push(msg.sender);
            contributedProjectIds[msg.sender].push(projectId);
        }
        
        proj.totalFunds += contribution;
        proj.contributions[msg.sender] += contribution;

        emit ContributionReceived(projectId, msg.sender, contribution);

        /// @dev Mint 1:1 FLT tokens to fan
        flt.mint(msg.sender, msg.value, false);

        /// @dev Close campaign if the funding target is met
        if (proj.totalFunds >= proj.targetFunds) {
            proj.campaignEnded = true;
            emit CompaignEnded(projectId, proj.totalFunds);
        }
    }

    function withdraw(uint256 projectId) external override notBlacklisted nonReentrant validProjectId(projectId) {
        Project storage proj = projects[projectId];
        require(!proj.cancelled, "Project cancelled");
        require(!proj.campaignEnded, "Campaign ended, cannot withdraw");

        uint256 contributed = proj.contributions[msg.sender];
        require(contributed > 0, "No contribution");

        (bool success, ) = msg.sender.call{value: contributed}("");
        require(success, "ETH transfer failed");

        proj.contributions[msg.sender] = 0;
        
        /// @dev Also remove contributor
        uint256 len = proj.contributors.length;
        for (uint256 i = 0; i < len; ++i) {
            if (proj.contributors[i] == msg.sender) {
                proj.contributors[i] = proj.contributors[len - 1];
                proj.contributors.pop();
                break;
            }
        }
        uint256[] storage projIds = contributedProjectIds[msg.sender];
        len = projIds.length;
        for (uint256 i = 0; i < len; ++i) {
            if (projIds[i] == projectId) {
                projIds[i] = projIds[len - 1];
                projIds.pop();
                break;
            }
        }

        emit RefundIssued(projectId, msg.sender, contributed);

        /// @dev Burn fan's FLT as penalty, blacklist when needed
        flt.burn(msg.sender, contributed + FAN_PENALTY, false);
    }

    // --- Platform's functions: releaseMilestone(), voidMilestone() ---

    function releaseMilestone(uint256 projectId) external override onlyPlatform validProjectId(projectId) {
        Project storage proj = projects[projectId];
        require(proj.campaignEnded, "Campaign not ended");
        require(!proj.cancelled, "Project already cancelled");
        require(!proj.completed, "Project already completed");
        require(
            proj.milestones[proj.currentMilestone].status == 3,
            "Current milestone is not in submitted state"
        );

        /// @dev Approve the current milestone
        proj.milestones[proj.currentMilestone].status = 1;

        /// @dev Calculate the amount of ETH to release
        uint256 milestoneFunds = proj.targetFunds / proj.milestones.length;
        proj.totalFunds -= milestoneFunds;
        require(proj.totalFunds >= 0, "Wrong project total funds");

        /// @dev Release ETH to the project creator
        (bool success, ) = proj.creator.call{value: milestoneFunds}("");
        require(success, "Transfer to creator failed");

        emit MilestoneReleased(projectId, proj.currentMilestone, milestoneFunds);

        if (proj.milestones.length > proj.currentMilestone)
            proj.currentMilestone += 1;
        else
            proj.completed = true;
        
        /// @dev Mint creator's FLT as reward to project creator
        flt.mint(proj.creator, CREATOR_REWARD, true);
    }

    function voidMilestone(uint256 projectId) external override onlyPlatform validProjectId(projectId) {
        Project storage proj = projects[projectId];
        require(proj.campaignEnded, "Campaign not ended");
        require(!proj.cancelled, "Project already cancelled");
        require(!proj.completed, "Project already completed");
        require(
            proj.milestones[proj.currentMilestone].status == 3,
            "Current milestone is not in submitted state"
        );

        /// @dev Reject the current milestone
        proj.milestones[proj.currentMilestone].status = 2;

        if (proj.milestones.length > proj.currentMilestone)
            proj.currentMilestone += 1;
        else
            proj.completed = true;
        
        /// @dev Burn creator's FLT as penalty, blacklist when needed
        flt.burn(proj.creator, CREATOR_PENALTY, true);

        /// @dev Refund all ETH of the milestone to fans
        for (uint256 i = 0; i < proj.contributors.length; ++i) {
            uint256 value = proj.contributions[proj.contributors[i]] / proj.milestones.length;
            if (value > 0) {
                proj.totalFunds -= value;
                proj.contributions[proj.contributors[i]] -= value;
                (bool success, ) = proj.contributors[i].call{value: value}("");
                require(success, "Refund failed");
                emit RefundIssued(projectId, proj.contributors[i], value);
            }
        }
    }

    /// @dev Allow the contract to receive ETH
    receive() external payable {}
}

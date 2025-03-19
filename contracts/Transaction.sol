// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interface for FLT token interactions
interface IFLT {
    // Mint tokens to an address
    function mint(address to, uint256 amount) external;
    
    // Burn tokens from an address
    function burn(address from, uint256 amount) external;
    
    // Blacklist an address (for users who cannot afford further burns)
    function blacklist(address user) external;
    
    // Check if an address is blacklisted
    function isBlacklisted(address user) external view returns (bool);
    
    // Get token balance of an address
    function balanceOf(address user) external view returns (uint256);
}

contract Transaction {
    address private owner;
    uint256 private platformFeePercent = 10; // 10% platform fee for withdrawals
    
    // FLT token related parameters
    address public fltTokenAddress;
    uint256 public fanMintMultiplier = 10;  // How many FLT tokens minted per 1 ETH contributed
    uint256 public creatorMintMultiplier = 5; // How many FLT tokens minted per 1 ETH milestone completed
    uint256 public burnMultiplier = 15;     // How many FLT tokens burned per 1 ETH withdrawn

    // Enum for campaign state
    enum CampaignState {
        ACTIVE,
        COMPLETED,
        CANCELLED,
        FAILED
    }

    // Enum for milestone state
    enum MilestoneState {
        PENDING,
        ACTIVE,
        COMPLETED,
        APPROVED,
        FAILED,
        CANCELLED
    }

    // Struct for campaign milestone - reduced to store essential data only
    struct Milestone {
        uint256 id;
        string ipfsHash;       // IPFS hash pointing to detailed milestone info
        uint256 amount;
        uint256 deadline;
        MilestoneState state;
        uint256 votesFor;
        uint256 votesAgainst;
        mapping(address => bool) hasVoted;
    }

    // Struct for campaign - reduced to store essential data only
    struct Campaign {
        uint256 id;
        address creator;
        string ipfsHash;       // IPFS hash pointing to campaign details (name, description, etc.)
        bool isPrivate;
        uint256 totalGoal;
        uint256 raisedAmount;
        uint256 releasedAmount;
        uint256 milestoneCount;
        uint256 completedMilestones;
        CampaignState state;
        mapping(uint256 => Milestone) milestones;
        mapping(address => uint256) contributions;
        address[] contributors;
    }

    // Main storage mappings
    mapping(uint256 => Campaign) private campaigns;
    uint256 private campaignCount;
    
    // Access control
    mapping(address => bool) private admins;
    
    // Events for each transaction type
    event FanToplatform(
        uint256 indexed campaignId, 
        uint256 indexed milestoneId, 
        address indexed fan, 
        uint256 amount
    );
    
    event PlatformToCreator(
        uint256 indexed campaignId, 
        uint256 indexed milestoneId, 
        address indexed creator, 
        uint256 amount
    );
    
    event PlatformToFan(
        uint256 indexed campaignId, 
        address indexed fan, 
        uint256 amount, 
        uint256 platformFee
    );
    
    event MilestoneCreated(
        uint256 indexed campaignId, 
        uint256 indexed milestoneId,
        string ipfsHash,
        uint256 amount, 
        uint256 deadline
    );
    
    event MilestoneFailed(
        uint256 indexed campaignId, 
        uint256 indexed milestoneId, 
        string reason
    );
    
    event CampaignCreated(
        uint256 indexed campaignId, 
        address indexed creator,
        string ipfsHash, 
        bool isPrivate, 
        uint256 totalGoal
    );

    // FLT token related events
    event FLTMinted(
        address indexed to,
        uint256 amount,
        string reason
    );
    
    event FLTBurned(
        address indexed from,
        uint256 amount,
        string reason
    );
    
    event FLTUserBlacklisted(
        address indexed user,
        string reason
    );

    // IPFS related events for data updates
    event CampaignMetadataUpdated(
        uint256 indexed campaignId,
        string newIpfsHash
    );
    
    event MilestoneMetadataUpdated(
        uint256 indexed campaignId,
        uint256 indexed milestoneId,
        string newIpfsHash
    );

    // Constructor with FLT token address
    constructor(address _fltTokenAddress) {
        owner = msg.sender;
        admins[msg.sender] = true;
        fltTokenAddress = _fltTokenAddress;
    }

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyAdmin() {
        require(admins[msg.sender], "Only admin can call this function");
        _;
    }
    
    modifier onlyCampaignCreator(uint256 _campaignId) {
        require(
            msg.sender == campaigns[_campaignId].creator,
            "Only campaign creator can call this function"
        );
        _;
    }
    
    modifier campaignExists(uint256 _campaignId) {
        require(_campaignId < campaignCount, "Campaign does not exist");
        _;
    }
    
    modifier milestoneExists(uint256 _campaignId, uint256 _milestoneId) {
        require(
            _milestoneId < campaigns[_campaignId].milestoneCount,
            "Milestone does not exist"
        );
        _;
    }
    
    modifier notBlacklisted() {
        require(!IFLT(fltTokenAddress).isBlacklisted(msg.sender), "User is blacklisted");
        _;
    }
    
    // FLT token control functions
    function setFLTTokenAddress(address _fltTokenAddress) external onlyOwner {
        fltTokenAddress = _fltTokenAddress;
    }
    
    function setFanMintMultiplier(uint256 _multiplier) external onlyOwner {
        fanMintMultiplier = _multiplier;
    }
    
    function setCreatorMintMultiplier(uint256 _multiplier) external onlyOwner {
        creatorMintMultiplier = _multiplier;
    }
    
    function setBurnMultiplier(uint256 _multiplier) external onlyOwner {
        burnMultiplier = _multiplier;
    }
    
    // Internal functions for FLT operations
    function _mintFLT(address _to, uint256 _amount, string memory _reason) internal {
        IFLT(fltTokenAddress).mint(_to, _amount);
        emit FLTMinted(_to, _amount, _reason);
    }
    
    function _burnFLT(address _from, uint256 _amount, string memory _reason) internal {
        // Attempt to burn tokens
        uint256 balance = IFLT(fltTokenAddress).balanceOf(_from);
        
        if (balance >= _amount) {
            // User has enough tokens to burn
            IFLT(fltTokenAddress).burn(_from, _amount);
            emit FLTBurned(_from, _amount, _reason);
        } else {
            // User doesn't have enough tokens - burn all and blacklist
            if (balance > 0) {
                IFLT(fltTokenAddress).burn(_from, balance);
                emit FLTBurned(_from, balance, _reason);
            }
            
            IFLT(fltTokenAddress).blacklist(_from);
            emit FLTUserBlacklisted(_from, "Insufficient tokens for required burn");
        }
    }

    // Admin functions
    function addAdmin(address _admin) external onlyOwner {
        admins[_admin] = true;
    }
    
    function removeAdmin(address _admin) external onlyOwner {
        require(_admin != owner, "Cannot remove owner as admin");
        admins[_admin] = false;
    }

    // Campaign creation and management with IPFS
    function createCampaign(
        string memory _ipfsHash,
        bool _isPrivate,
        uint256 _totalGoal
    ) external returns (uint256) {
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(_totalGoal > 0, "Total goal must be greater than zero");
        
        uint256 campaignId = campaignCount++;
        Campaign storage campaign = campaigns[campaignId];
        
        campaign.id = campaignId;
        campaign.creator = msg.sender;
        campaign.ipfsHash = _ipfsHash;
        campaign.isPrivate = _isPrivate;
        campaign.totalGoal = _totalGoal;
        campaign.state = CampaignState.ACTIVE;
        
        emit CampaignCreated(campaignId, msg.sender, _ipfsHash, _isPrivate, _totalGoal);
        
        return campaignId;
    }
    
    function updateCampaignMetadata(
        uint256 _campaignId,
        string memory _newIpfsHash
    ) external onlyCampaignCreator(_campaignId) campaignExists(_campaignId) {
        require(bytes(_newIpfsHash).length > 0, "IPFS hash cannot be empty");
        
        campaigns[_campaignId].ipfsHash = _newIpfsHash;
        
        emit CampaignMetadataUpdated(_campaignId, _newIpfsHash);
    }
    
    function createMilestone(
        uint256 _campaignId,
        string memory _ipfsHash,
        uint256 _amount,
        uint256 _deadline
    ) external onlyCampaignCreator(_campaignId) campaignExists(_campaignId) {
        Campaign storage campaign = campaigns[_campaignId];
        
        require(campaign.state == CampaignState.ACTIVE, "Campaign is not active");
        require(_deadline > block.timestamp, "Deadline must be in the future");
        require(_amount > 0, "Amount must be greater than zero");
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(
            campaign.totalGoal >= campaign.raisedAmount + _amount,
            "Total milestone amounts exceed campaign goal"
        );
        
        uint256 milestoneId = campaign.milestoneCount++;
        Milestone storage milestone = campaign.milestones[milestoneId];
        
        milestone.id = milestoneId;
        milestone.ipfsHash = _ipfsHash;
        milestone.amount = _amount;
        milestone.deadline = _deadline;
        milestone.state = MilestoneState.PENDING;
        
        emit MilestoneCreated(_campaignId, milestoneId, _ipfsHash, _amount, _deadline);
    }
    
    function updateMilestoneMetadata(
        uint256 _campaignId,
        uint256 _milestoneId,
        string memory _newIpfsHash
    ) external onlyCampaignCreator(_campaignId) campaignExists(_campaignId) milestoneExists(_campaignId, _milestoneId) {
        require(bytes(_newIpfsHash).length > 0, "IPFS hash cannot be empty");
        
        campaigns[_campaignId].milestones[_milestoneId].ipfsHash = _newIpfsHash;
        
        emit MilestoneMetadataUpdated(_campaignId, _milestoneId, _newIpfsHash);
    }
    
    function activateMilestone(
        uint256 _campaignId,
        uint256 _milestoneId
    ) external onlyCampaignCreator(_campaignId) campaignExists(_campaignId) milestoneExists(_campaignId, _milestoneId) {
        Campaign storage campaign = campaigns[_campaignId];
        Milestone storage milestone = campaign.milestones[_milestoneId];
        
        require(campaign.state == CampaignState.ACTIVE, "Campaign is not active");
        require(milestone.state == MilestoneState.PENDING, "Milestone is not pending");
        
        milestone.state = MilestoneState.ACTIVE;
    }

    // FAN_to_PLATFORM: fan transfer ETH to creators, locked by the platform
    function contributeToMilestone(
        uint256 _campaignId,
        uint256 _milestoneId
    ) external payable notBlacklisted campaignExists(_campaignId) milestoneExists(_campaignId, _milestoneId) {
        Campaign storage campaign = campaigns[_campaignId];
        Milestone storage milestone = campaign.milestones[_milestoneId];
        
        require(campaign.state == CampaignState.ACTIVE, "Campaign is not active");
        require(milestone.state == MilestoneState.ACTIVE, "Milestone is not active");
        require(msg.sender != campaign.creator, "Creator cannot contribute to own campaign");
        require(msg.value > 0, "Contribution amount must be greater than zero");
        
        // For private campaigns, additional checks can be added here
        
        // Add contribution to campaign
        if (campaign.contributions[msg.sender] == 0) {
            campaign.contributors.push(msg.sender);
        }
        
        campaign.contributions[msg.sender] += msg.value;
        campaign.raisedAmount += msg.value;
        
        emit FanToplatform(_campaignId, _milestoneId, msg.sender, msg.value);
        
        // Mint FLT tokens to fan based on contribution
        uint256 fltAmount = msg.value * fanMintMultiplier / 1 ether;
        _mintFLT(msg.sender, fltAmount, "Fan contribution reward");
    }

    // Creator marks milestone as completed
    function completeMilestone(
        uint256 _campaignId,
        uint256 _milestoneId
    ) external onlyCampaignCreator(_campaignId) campaignExists(_campaignId) milestoneExists(_campaignId, _milestoneId) {
        Campaign storage campaign = campaigns[_campaignId];
        Milestone storage milestone = campaign.milestones[_milestoneId];
        
        require(campaign.state == CampaignState.ACTIVE, "Campaign is not active");
        require(milestone.state == MilestoneState.ACTIVE, "Milestone is not active");
        
        milestone.state = MilestoneState.COMPLETED;
    }

    // PLATFORM_to_CREATORS: when creators completed milestones be approved
    function approveMilestone(
        uint256 _campaignId,
        uint256 _milestoneId
    ) external onlyAdmin campaignExists(_campaignId) milestoneExists(_campaignId, _milestoneId) {
        Campaign storage campaign = campaigns[_campaignId];
        Milestone storage milestone = campaign.milestones[_milestoneId];
        
        require(campaign.state == CampaignState.ACTIVE, "Campaign is not active");
        require(milestone.state == MilestoneState.COMPLETED, "Milestone is not completed");
        
        milestone.state = MilestoneState.APPROVED;
        campaign.completedMilestones++;
        
        uint256 amount = milestone.amount;
        campaign.releasedAmount += amount;
        
        payable(campaign.creator).transfer(amount);
        
        emit PlatformToCreator(_campaignId, _milestoneId, campaign.creator, amount);
        
        // Mint FLT tokens to creator based on completed milestone
        uint256 fltAmount = amount * creatorMintMultiplier / 1 ether;
        _mintFLT(campaign.creator, fltAmount, "Creator milestone completion reward");
        
        // Also mint some tokens to the platform/protocol
        uint256 protocolFltAmount = amount / 10; // 10% of milestone amount
        _mintFLT(owner, protocolFltAmount, "Protocol stake interest");
        
        // Check if campaign is completed
        if (campaign.releasedAmount == campaign.totalGoal) {
            campaign.state = CampaignState.COMPLETED;
        }
    }

    // Fans voting on milestone
    function voteOnMilestone(
        uint256 _campaignId,
        uint256 _milestoneId,
        bool _support
    ) external notBlacklisted campaignExists(_campaignId) milestoneExists(_campaignId, _milestoneId) {
        Campaign storage campaign = campaigns[_campaignId];
        Milestone storage milestone = campaign.milestones[_milestoneId];
        
        require(campaign.contributions[msg.sender] > 0, "Only contributors can vote");
        require(!milestone.hasVoted[msg.sender], "Already voted on this milestone");
        require(milestone.state == MilestoneState.COMPLETED, "Milestone must be completed for voting");
        
        milestone.hasVoted[msg.sender] = true;
        
        if (_support) {
            milestone.votesFor++;
        } else {
            milestone.votesAgainst++;
        }
        
        // Automatic approval/rejection based on votes could be implemented here
    }

    // FAN_WITHDRAW: fan wants to withdraw his contributed ETH
    function withdrawContribution(
        uint256 _campaignId
    ) external campaignExists(_campaignId) {
        Campaign storage campaign = campaigns[_campaignId];
        
        require(campaign.contributions[msg.sender] > 0, "No contribution to withdraw");
        
        // Check if the creator has completed half of all milestones
        require(
            campaign.completedMilestones * 2 < campaign.milestoneCount,
            "Cannot withdraw: Creator has completed at least half of milestones"
        );
        
        uint256 contributionAmount = campaign.contributions[msg.sender];
        uint256 platformFee = (contributionAmount * platformFeePercent) / 100;
        uint256 returnAmount = contributionAmount - platformFee;
        
        // Update state before transfer to prevent reentrancy
        campaign.contributions[msg.sender] = 0;
        campaign.raisedAmount -= contributionAmount;
        
        // Calculate FLT burn amount based on withdrawal
        uint256 fltBurnAmount = contributionAmount * burnMultiplier / 1 ether;
        _burnFLT(msg.sender, fltBurnAmount, "Fan withdrawal penalty");
        
        // Check if user was blacklisted during the burn operation
        if (IFLT(fltTokenAddress).isBlacklisted(msg.sender)) {
            // User was blacklisted due to insufficient FLT tokens
            // Could add additional penalties here if needed
        }
        
        // Transfer funds
        payable(owner).transfer(platformFee);
        payable(msg.sender).transfer(returnAmount);
        
        emit PlatformToFan(_campaignId, msg.sender, returnAmount, platformFee);
    }

    // CREATORS_MILESTONE_FAILED: Creator's milestone failed to complete
    function failMilestone(
        uint256 _campaignId,
        uint256 _milestoneId,
        string memory _reason
    ) external onlyAdmin campaignExists(_campaignId) milestoneExists(_campaignId, _milestoneId) {
        Campaign storage campaign = campaigns[_campaignId];
        Milestone storage milestone = campaign.milestones[_milestoneId];
        
        require(
            milestone.state == MilestoneState.ACTIVE || 
            milestone.state == MilestoneState.COMPLETED,
            "Milestone cannot be failed in current state"
        );
        
        milestone.state = MilestoneState.FAILED;
        
        emit MilestoneFailed(_campaignId, _milestoneId, _reason);
        
        // Calculate FLT burn amount for the creator based on the failed milestone amount
        uint256 fltBurnAmount = milestone.amount * burnMultiplier / 1 ether;
        _burnFLT(campaign.creator, fltBurnAmount, "Creator milestone failure penalty");
    }

    // Creator cancels campaign
    function cancelCampaign(
        uint256 _campaignId
    ) external onlyCampaignCreator(_campaignId) campaignExists(_campaignId) {
        Campaign storage campaign = campaigns[_campaignId];
        
        require(campaign.state == CampaignState.ACTIVE, "Campaign is not active");
        
        campaign.state = CampaignState.CANCELLED;
        
        // Set all pending milestones to cancelled
        for (uint256 i = 0; i < campaign.milestoneCount; i++) {
            Milestone storage milestone = campaign.milestones[i];
            if (milestone.state == MilestoneState.PENDING || 
                milestone.state == MilestoneState.ACTIVE) {
                milestone.state = MilestoneState.CANCELLED;
            }
        }
        
        // Calculate penalty for the creator - based on total raised amount
        uint256 fltBurnAmount = campaign.raisedAmount * burnMultiplier / 1 ether;
        _burnFLT(campaign.creator, fltBurnAmount, "Creator campaign cancellation penalty");
    }

    // Refund all contributors after campaign cancellation or failure
    function processRefunds(
        uint256 _campaignId
    ) external onlyAdmin campaignExists(_campaignId) {
        Campaign storage campaign = campaigns[_campaignId];
        
        require(
            campaign.state == CampaignState.CANCELLED || 
            campaign.state == CampaignState.FAILED,
            "Campaign must be cancelled or failed for refunds"
        );
        
        // Process refunds for all contributors
        for (uint256 i = 0; i < campaign.contributors.length; i++) {
            address contributor = campaign.contributors[i];
            uint256 contribution = campaign.contributions[contributor];
            
            if (contribution > 0) {
                uint256 platformFee = (contribution * platformFeePercent) / 100;
                uint256 refundAmount = contribution - platformFee;
                
                // Update state before transfer
                campaign.contributions[contributor] = 0;
                
                // Transfer funds
                payable(owner).transfer(platformFee);
                payable(contributor).transfer(refundAmount);
                
                emit PlatformToFan(_campaignId, contributor, refundAmount, platformFee);
                
                // No FLT token burn for automatic refunds due to campaign cancellation/failure
                // This is to avoid penalizing fans for creator's actions
            }
        }
        
        campaign.raisedAmount = 0;
    }

    // Emergency function to rescue FLT tokens sent to this contract
    function rescueFLT() external onlyOwner {
        uint256 balance = IFLT(fltTokenAddress).balanceOf(address(this));
        require(balance > 0, "No FLT tokens to rescue");
        
        IFLT(fltTokenAddress).mint(owner, balance);
        IFLT(fltTokenAddress).burn(address(this), balance);
    }

    // Utility functions
    function getCampaignBasicInfo(
        uint256 _campaignId
    ) external view campaignExists(_campaignId) returns (
        uint256 id,
        address creator,
        string memory ipfsHash,
        bool isPrivate,
        uint256 totalGoal,
        uint256 raisedAmount,
        uint256 releasedAmount,
        uint256 milestoneCount,
        uint256 completedMilestones,
        CampaignState state
    ) {
        Campaign storage campaign = campaigns[_campaignId];
        
        return (
            campaign.id,
            campaign.creator,
            campaign.ipfsHash,
            campaign.isPrivate,
            campaign.totalGoal,
            campaign.raisedAmount,
            campaign.releasedAmount,
            campaign.milestoneCount,
            campaign.completedMilestones,
            campaign.state
        );
    }
    
    function getMilestoneBasicInfo(
        uint256 _campaignId,
        uint256 _milestoneId
    ) external view campaignExists(_campaignId) milestoneExists(_campaignId, _milestoneId) returns (
        uint256 id,
        string memory ipfsHash,
        uint256 amount,
        uint256 deadline,
        MilestoneState state,
        uint256 votesFor,
        uint256 votesAgainst
    ) {
        Milestone storage milestone = campaigns[_campaignId].milestones[_milestoneId];
        
        return (
            milestone.id,
            milestone.ipfsHash,
            milestone.amount,
            milestone.deadline,
            milestone.state,
            milestone.votesFor,
            milestone.votesAgainst
        );
    }
    
    function getContribution(
        uint256 _campaignId,
        address _contributor
    ) external view campaignExists(_campaignId) returns (uint256) {
        return campaigns[_campaignId].contributions[_contributor];
    }
    
    function getPlatformFeePercent() external view returns (uint256) {
        return platformFeePercent;
    }
    
    function setPlatformFeePercent(uint256 _feePercent) external onlyOwner {
        require(_feePercent <= 20, "Fee percent cannot exceed 20%");
        platformFeePercent = _feePercent;
    }
}
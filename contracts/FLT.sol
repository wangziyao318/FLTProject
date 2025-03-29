// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./IFLT.sol";

/**
 * @title FLT – Fan Loyalty Token
 * @notice An ERC5484 non-transferable token for reputation
 */
contract FLT is IFLT, ERC1155, AccessControl {
    /// @dev Creator's token cannot vote; fan's token can vote
    uint256 public constant CREATOR_TOKEN_ID = 0;
    uint256 public constant FAN_TOKEN_ID = 1;

    /// @dev Add Blacklist role
    bytes32 public constant BLACKLIST_ROLE = keccak256("BLACKLIST_ROLE");

    /// @dev Total supply for creator and fan tokens respectively
    uint256 public creatorSupply;
    uint256 public fanSupply;

    modifier notBlacklisted(address account) {
        require(!hasRole(BLACKLIST_ROLE, account), "Account is blacklisted");
        _;
    }

    modifier onlyPlatform() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not platform");
        _;
    }

    /**
     * @param _uri IPFS URI to token metadata
     */
    constructor(string memory _uri) ERC1155(_uri) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Internal helper function to update total supply
     * @param value Increment value
     * @param isCreator Whether creatorSupply or fanSupply
     * @param isBurning Whether burning or minting
     */
    function _updateSupply(
        uint256 value,
        bool isCreator,
        bool isBurning
    ) internal onlyPlatform {
        if (isCreator) {
            if (isBurning) creatorSupply -= value;
            else creatorSupply += value;
        } else {
            if (isBurning) fanSupply -= value;
            else fanSupply += value;
        }
    }

    // --- Platform's functions: mint(), burn() ---

    function mint(
        address to,
        uint256 value,
        bool isCreator
    ) external override notBlacklisted(to) onlyPlatform {
        _mint(to, isCreator ? CREATOR_TOKEN_ID : FAN_TOKEN_ID, value, "");
        _updateSupply(value, isCreator, false);
    }

    function burn(
        address from,
        uint256 value,
        bool isCreator
    ) external override notBlacklisted(from) onlyPlatform {
        uint256 balance = balanceOf(
            from,
            isCreator ? CREATOR_TOKEN_ID : FAN_TOKEN_ID
        );
        if (value > balance) {
            value = balance;
            grantRole(BLACKLIST_ROLE, from);
        }

        _burn(from, isCreator ? CREATOR_TOKEN_ID : FAN_TOKEN_ID, value);
        _updateSupply(value, isCreator, true);
    }

    function hasRole(
        bytes32 role,
        address account
    ) public view virtual override(IFLT, AccessControl) returns (bool) {
        return AccessControl.hasRole(role, account);
    }

    function balanceOf(
        address account,
        uint256 id
    ) public view virtual override(IFLT, ERC1155) returns (uint256) {
        return ERC1155.balanceOf(account, id);
    }

    // --- ERC5484 overrides, can be ignored ---

    /// @dev Disable transfers
    function safeTransferFrom(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) public pure override {
        revert("Non-transferable token");
    }

    /// @dev Disable batch transfers
    function safeBatchTransferFrom(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) public pure override {
        revert("Non-transferable token");
    }

    /// @dev Disable setting operator approvals
    function setApprovalForAll(address, bool) public virtual override {
        revert("Non-transferable token");
    }

    /// @dev Merge ERC1155 and AccessControl supportsInterface
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC1155, AccessControl) returns (bool) {
        return ERC1155.supportsInterface(interfaceId) ||
            AccessControl.supportsInterface(interfaceId);
    }
}

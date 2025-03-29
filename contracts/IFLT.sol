// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IFLT {

    // --- Getters ---

    function CREATOR_TOKEN_ID() external view returns (uint256);

    function FAN_TOKEN_ID() external view returns (uint256);

    function BLACKLIST_ROLE() external view returns (bytes32);

    function creatorSupply() external view returns (uint256);

    function fanSupply() external view returns (uint256);

    // --- Platform's functions: mint(), burn() ---

    /**
     * @dev Mint a number of FLT tokens to a creator's or fan's account
     * @param to To account address
     * @param value Number of FLT to mint
     * @param isCreator Whether the account is creator's
     */
    function mint(address to, uint256 value, bool isCreator) external;

    /**
     * @dev Burn a number of FLT tokens from a creator's or fan's account
     *      Blacklist the account if burning value exceeds its balance
     * @param from From account address
     * @param value Number of FLT to burn
     * @param isCreator Whether the account is creator's
     */
    function burn(address from, uint256 value, bool isCreator) external;

    // --- Public functions: hasRole(), balanceOf() ---

    /**
     * @dev Returns `true` if `account` has been granted `role`
     * @param role Role
     * @param account Account
     * @return True if account has role
     */
    function hasRole(bytes32 role, address account) external view returns (bool);

    /**
     * @dev Returns the value of tokens of token type `id` owned by `account`
     * @param account Account
     * @param id Token ID
     * @return Balance of a specified token in an account
     */
    function balanceOf(address account, uint256 id) external view returns (uint256);
}

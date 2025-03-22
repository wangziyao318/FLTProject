// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FLT – Fan Loyalty Token
 * @notice An ERC1155-based, non-transferable token (ERC5484-like) representing reputation.
 *         The token URI should be an IPFS link (e.g. ipfs://...) to off-chain metadata.
 */
contract FLT is ERC1155, Ownable {
    uint256 public constant FLT_TOKEN_ID = 1;

    constructor(string memory ipfsUri) ERC1155(ipfsUri) Ownable(msg.sender) {}

    /// @notice Mint FLT tokens to an account.
    /// @dev Only callable by the owner.
    function mint(address account, uint256 amount) external onlyOwner {
        _mint(account, FLT_TOKEN_ID, amount, "");
    }

    /// @notice Burn FLT tokens from an account.
    /// @dev Only callable by the owner.
    function burn(address account, uint256 amount) external onlyOwner {
        _burn(account, FLT_TOKEN_ID, amount);
    }

    /// @dev Disable transfers by overriding safeTransfer functions.
    function safeTransferFrom(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) public pure override {
        revert("Non-transferable token");
    }

    /// @dev Disable batch transfers.
    function safeBatchTransferFrom(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) public pure override {
        revert("Non-transferable token");
    }
}

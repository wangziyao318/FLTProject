// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FLT – Fan Loyalty Token
 * @notice An ERC5484-based non-transferable token for reputation, implemented from ERC1155.
 */
contract FLT is ERC1155, Ownable {
    uint256 public constant FLT_TOKEN_ID = 1;

    /// @dev The token URI is an IPFS link to off-chain metadata.
    constructor(string memory ipfsUri) ERC1155(ipfsUri) Ownable(msg.sender) {}

    /// @notice Mint specific amount of FLT tokens to an account.
    /// @dev Only callable by owner.
    function mint(address account, uint256 amount) external onlyOwner {
        _mint(account, FLT_TOKEN_ID, amount, "");
    }

    /// @notice Burn specific amount of FLT tokens from an account.
    /// @dev Only callable by owner.
    function burn(address account, uint256 amount) external onlyOwner {
        _burn(account, FLT_TOKEN_ID, amount);
    }

    /// @dev Disable transfers.
    function safeTransferFrom(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) public pure override {
        revert("Non-transferable token");
    }

    /// @dev Disable batch transfers, which is an ERC1155 feature.
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

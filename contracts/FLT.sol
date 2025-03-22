// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FLT is ERC1155, Ownable {
    uint256 public constant FAN_TOKEN_ID = 1;
    uint256 public constant CREATOR_TOKEN_ID = 2;
    
    error NonTransferable();
    
    constructor(string memory uri) ERC1155(uri) Ownable(msg.sender) {}
    
    function mint(address to, uint256 id, uint256 amount) external onlyOwner {
        _mint(to, id, amount, "");
    }

    function burn(address from, uint256 id, uint256 amount) external onlyOwner {
        _burn(from, id, amount);
    }

    // Disable transfers
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values) internal virtual override {
        if (from != address(0) && to != address(0)) revert NonTransferable();
        super._update(from, to, ids, values);
    }
}

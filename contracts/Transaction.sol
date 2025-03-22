// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./FLT.sol";

contract Transaction is Ownable {
    FLT public flt;
    uint256 public feeBps = 100; // 1% fee
    mapping(address => bool) public blacklist;
    
    struct Project {
        address creator;
        uint256 totalETH;
        uint256 releasedETH;
        uint256 milestones;
        uint256 completed;
        bytes32 ipfsHash;
    }
    
    Project[] public projects;
    
    constructor(address _flt) Ownable(msg.sender) {
        flt = FLT(_flt);
    }

    function contribute(uint256 projectId, bytes32 /*ipfsHash*/) external payable {
        require(!blacklist[msg.sender], "Blacklisted");
        uint256 amount = sqrt(msg.value);
        projects[projectId].totalETH += msg.value;
        flt.mint(msg.sender, flt.FAN_TOKEN_ID(), amount);
    }

    function withdraw(uint256 projectId, uint256 amount) external {
        Project storage p = projects[projectId];
        require(p.completed < p.milestones/2, "Cannot withdraw");
        
        uint256 burnAmount = sqrt(amount);
        if (flt.balanceOf(msg.sender, flt.FAN_TOKEN_ID()) < burnAmount) {
            blacklist[msg.sender] = true;
            revert("Insufficient FLT");
        }
        
        flt.burn(msg.sender, flt.FAN_TOKEN_ID(), burnAmount);
        payable(msg.sender).transfer(amount * (10000 - feeBps) / 10000);
    }

    function sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }
}

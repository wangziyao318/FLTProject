// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title Fan Loyalty Token (FLT)
 * @dev Implementation of non-transferable ERC-5484 based token for loyalty/reputation
 */
contract FLT is Ownable {
    using Counters for Counters.Counter;
    
    // Token name and symbol
    string public constant name = "Fan Loyalty Token";
    string public constant symbol = "FLT";
    uint8 public constant decimals = 18;
    
    // Token balances
    mapping(address => uint256) private _balances;
    uint256 private _totalSupply;
    
    // Blacklist registry
    mapping(address => bool) private _blacklisted;
    
    // Access control for minting/burning
    mapping(address => bool) private _operators;
    
    // Events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event OperatorAdded(address indexed operator);
    event OperatorRemoved(address indexed operator);
    event Blacklisted(address indexed user);
    event Unblacklisted(address indexed user);
    
    constructor() Ownable(msg.sender) {
        // Add the contract deployer as an operator
        _operators[msg.sender] = true;
        emit OperatorAdded(msg.sender);
    }
    
    // Modifiers
    modifier onlyOperator() {
        require(_operators[msg.sender], "FLT: caller is not an operator");
        _;
    }
    
    modifier notBlacklisted(address _user) {
        require(!_blacklisted[_user], "FLT: user is blacklisted");
        _;
    }
    
    // Operator management
    function addOperator(address operator) external onlyOwner {
        require(operator != address(0), "FLT: operator cannot be zero address");
        require(!_operators[operator], "FLT: already an operator");
        
        _operators[operator] = true;
        emit OperatorAdded(operator);
    }
    
    function removeOperator(address operator) external onlyOwner {
        require(_operators[operator], "FLT: not an operator");
        require(operator != owner(), "FLT: cannot remove owner as operator");
        
        _operators[operator] = false;
        emit OperatorRemoved(operator);
    }
    
    // Blacklist management
    function blacklist(address user) external onlyOperator {
        require(!_blacklisted[user], "FLT: user already blacklisted");
        
        _blacklisted[user] = true;
        emit Blacklisted(user);
    }
    
    function unblacklist(address user) external onlyOwner {
        require(_blacklisted[user], "FLT: user not blacklisted");
        
        _blacklisted[user] = false;
        emit Unblacklisted(user);
    }
    
    function isBlacklisted(address user) external view returns (bool) {
        return _blacklisted[user];
    }
    
    // Token functionality
    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }
    
    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }
    
    // Mint new tokens (only operators can call)
    function mint(address to, uint256 amount) external onlyOperator notBlacklisted(to) {
        require(to != address(0), "FLT: mint to the zero address");
        
        _totalSupply += amount;
        _balances[to] += amount;
        emit Transfer(address(0), to, amount);
    }
    
    // Burn tokens (only operators can call)
    function burn(address from, uint256 amount) external onlyOperator {
        require(from != address(0), "FLT: burn from the zero address");
        
        uint256 accountBalance = _balances[from];
        require(accountBalance >= amount, "FLT: burn amount exceeds balance");
        
        _balances[from] = accountBalance - amount;
        _totalSupply -= amount;
        
        emit Transfer(from, address(0), amount);
    }
    
    // Override transfer functions to make the token non-transferable (ERC-5484 soulbound characteristic)
    function transfer(address, uint256) external pure returns (bool) {
        revert("FLT: tokens are non-transferable");
    }
    
    function transferFrom(address, address, uint256) external pure returns (bool) {
        revert("FLT: tokens are non-transferable");
    }
    
    function approve(address, uint256) external pure returns (bool) {
        revert("FLT: tokens are non-transferable");
    }
    
    function allowance(address, address) external pure returns (uint256) {
        return 0;
    }
}
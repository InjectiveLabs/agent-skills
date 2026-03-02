// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./BankERC20.sol";
import "./IWINJ9.sol";

/// @title WINJ9 - Wrapped INJ Token
/// @notice A wrapped version of INJ that implements the IWINJ9 interface (same as IWETH9).
contract WINJ9 is BankERC20, IWINJ9 {
    event Deposit(address indexed dst, uint256 wad);
    event Withdrawal(address indexed src, uint256 wad);

    /// @notice Constructor for WINJ9 token
    /// @param name_ Token name
    /// @param symbol_ Token symbol
    /// @param decimals_ Token decimals
    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    ) payable BankERC20(name_, symbol_, decimals_) {}

    /// @notice Fallback function to handle direct INJ deposits
    receive() external payable {
        deposit();
    }

    /// @notice Deposit INJ to get wrapped INJ
    /// @dev Mints wrapped INJ tokens in exchange for native INJ
    function deposit() public payable override {
        // Mint wrapped tokens to the sender
        _mint(msg.sender, msg.value);

        emit Deposit(msg.sender, msg.value);
    }

    /// @notice Withdraw wrapped INJ to get native INJ
    /// @param wad Amount of wrapped INJ to burn for native INJ
    function withdraw(uint256 wad) public override {
        require(balanceOf(msg.sender) >= wad, "WINJ9: insufficient balance");

        // Burn wrapped tokens from the sender
        _burn(msg.sender, wad);

        // Transfer native INJ to the sender
        // The difference between this and msg.sender.transfer(wad):
        // 1. transfer() has a 2300 gas limit which can cause issues with complex receivers
        // 2. call{} is the recommended approach since EIP-1884 as it's more flexible
        (bool success, ) = msg.sender.call{value: wad}("");
        require(success, "WINJ9: INJ transfer failed");

        emit Withdrawal(msg.sender, wad);
    }
}

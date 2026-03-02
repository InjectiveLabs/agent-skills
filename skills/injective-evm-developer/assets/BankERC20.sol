//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.20;

import {IBankModule} from "./Bank.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

abstract contract BankERC20 is ERC20 {
    event Failure(string message, bytes data);

    address constant bankContract = 0x0000000000000000000000000000000000000064;
    IBankModule bank = IBankModule(bankContract);

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    ) payable ERC20("", "") {
        // parent ERC20 metadata is not used
        if (bytes(name_).length > 0 || bytes(symbol_).length > 0 || decimals_ > 0) {
            bank.setMetadata(name_, symbol_, decimals_);
        }
    }

    function name() public view virtual override returns (string memory) {
        string memory _name;
        (_name, , ) = bank.metadata(address(this));
        return _name;
    }

    function symbol() public view virtual override returns (string memory) {
        string memory _symbol;
        (, _symbol, ) = bank.metadata(address(this));
        return _symbol;
    }

    function decimals() public view virtual override returns (uint8) {
        uint8 _decimals;
        (, , _decimals) = bank.metadata(address(this));
        return _decimals;
    }

    function totalSupply() public view virtual override returns (uint256) {
        return bank.totalSupply(address(this));
    }

    function balanceOf(
        address account
    ) public view virtual override returns (uint256) {
        return bank.balanceOf(address(this), account);
    }

    function _update(
        address from,
        address to,
        uint256 value
    ) internal override {
        if (from == address(0)) {
            // mint
            try bank.mint(to, value) {
                // Successfully minted
            } catch Error(string memory reason) {
                // catch failing revert() and require()
                revert(string.concat("failed to mint: ", reason));
            } catch (bytes memory reason) {
                // catch failing assert()
                revert(
                    string.concat(
                        "failed to mint: unknown error: ",
                        string(reason)
                    )
                );
            }
        } else if (to == address(0)) {
            // burn
            bank.burn(from, value);
        } else {
            // transfer
            bank.transfer(from, to, value);
        }

        emit Transfer(from, to, value);
    }
}

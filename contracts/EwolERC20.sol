// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title ERC20 Ewol Token
/// @author TinMon11
/// @notice Owner can Mint & Burn tokens for Ewol Academy
/// @dev All function calls are currently implemented without side effects
contract EwolERC20Token is ERC20, Ownable {
    address _owner;

    
    constructor (uint256 _initialMint) ERC20 ("EwolToken", "EWTK") {
        _owner = msg.sender;
        _mint(address(this), _initialMint);
    }

    function decimals() public view override returns (uint8) {
        return 1;
	}

    /// @notice Mints tokens EWTK to an investor
    /// @dev    Mints tokens EWTK to an investor
    /// @param  _to address of investor
    /// @param  _amount of tokens to mint
    function _mintTokens(address _to, uint256 _amount) public onlyOwner {
        _mint(_to, _amount);
    }

    /// @notice Burns Ewol Tokens EWTK
    /// @dev    Burns Ewol Token EWTK
    /// @param  _from address of tokens to be burned
    /// @param  _amount of tokens to burn
    function _burnTokens(address _from, uint256 _amount) public onlyOwner {
        _burn(_from, _amount);
    }

}
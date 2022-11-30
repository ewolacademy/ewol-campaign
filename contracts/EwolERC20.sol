// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title ERC20 Ewol Token
/// @author TinMon11
/// @notice Owner can Mint & Burn tokens for Ewol Academy
/// @dev All function calls are currently implemented without side effects
contract EwolERC20 is ERC20, Ownable {
    address _owner;

    
    constructor (uint256 _initialMint) ERC20 ("EwolToken", "EWTK") {
        _owner = msg.sender();
        _mint(address(this), _initialMint)
    }

    /// @notice Mints tokens for Ewol Academy
    /// @dev    Mints tokens for Ewol Academy
    /// @param  _amount of tokens to mint
    function _mintTokens(uint256 _amount) onlyOwner {
        _mint(_amount);
    }

    /// @notice Burns Ewol Tokens EWTK
    /// @dev    Burns Ewol Token EWTK
    /// @param  _from address of tokens to be burned
    /// @param  _amount of tokens to burn
    function _burnTokens(address _from, uint256 _amount) onlyOwner {
        _burn(_from, _amount);
    }
    
}
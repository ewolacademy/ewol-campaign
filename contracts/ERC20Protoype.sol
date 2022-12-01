// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 < 0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC20Prototype is ERC20, Ownable {

    constructor() ERC20("StableCoin", "SC"){} 

    function freeMint(address _account, uint256 _amount) public onlyOwner {
        require(_amount > 0, "amount has to be mayor than zero");
        _mint(_account, _amount);
    }

    function burn(address _account, uint256 _amount) public {
        require(_amount > 0, "amount has to be mayor than zero");
        _burn(_account, _amount);
    }

}
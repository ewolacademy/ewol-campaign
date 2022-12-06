require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  networks: {
    hardhat: {
      chainId: 137,
      accounts: {
        accountsBalance: "10000000000000000000000000"
      }
    }
  }
};

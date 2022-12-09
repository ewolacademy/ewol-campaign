require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  networks: {
    hardhat: {
      chainId: 137,
      accounts: {
        accountsBalance: "10000000" + "000000000000000000"
      }
    },
    "hardhat-local": {
      url: "http://localhost:8545",
      chainId: 137,
      timeout: 100000
    }
  },
  mocha: {
    timeout: 400000000
  }
};

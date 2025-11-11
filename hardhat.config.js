require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  localhost: {
      url: "http://localhost:8545",  // or "http://cat.chuu.cc:8545" if it’s plain HTTP
  },
};
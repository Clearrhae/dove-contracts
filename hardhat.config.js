require("dotenv").config();
require("@nomiclabs/hardhat-waffle");

const getHDWallet = () => {
  const { MNEMONIC, PRIVATE_KEY } = process.env;
  if (MNEMONIC && MNEMONIC !== "") {
    return {
      mnemonic: MNEMONIC,
    }
  }
  if (PRIVATE_KEY && PRIVATE_KEY !== "") {
    return [PRIVATE_KEY]
  }
  throw Error("Private Key Not Set! Please set up .env");
}

module.exports = {
  solidity: {
    compilers: [
      {
        version: '0.8.4',
      },
      {
        version: "0.7.5",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
      },
    },
  ],
  },
  networks: {
    'cronos-testnet': {
      url: "https://cronos-testnet-3.crypto.org:8545",
      accounts: getHDWallet(),
      gasPrice: 5000000000000,
      gas: 9999999,
    },
    'cronos-cassini': {
      url: "https://cassini.crypto.org:8545",
      accounts: getHDWallet(),
      gasPrice: 5000000000000,
      gas: 2100000,
      
    },
  },
}

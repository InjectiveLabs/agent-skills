require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: '0.8.28',
  networks: {
    inj_testnet: {
      url: process.env.INJ_TESTNET_RPC_URL || 'https://k8s.testnet.json-rpc.injective.network/',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 1439,
    },
  },
  etherscan: {
    apiKey: {
      inj_testnet: 'nil',
    },
    customChains: [
      {
        network: 'inj_testnet',
        chainId: 1439,
        urls: {
          apiURL: 'https://testnet.blockscout-api.injective.network/api',
          browserURL: 'https://testnet.blockscout.injective.network/',
        },
      },
    ],
  },
  sourcify: {
    enabled: false,
  },
};

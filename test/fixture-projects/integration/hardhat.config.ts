// We load the plugin here.
import { HardhatUserConfig } from 'hardhat/types';
import { generatePrivateKey } from 'viem/accounts';
import 'dotenv/config';
import '@nomicfoundation/hardhat-ethers';
import '../../../src/index';

const config: HardhatUserConfig = {
  solidity: '0.8.19',
  defaultNetwork: 'sepolia',
  networks: {
    sepolia: {
      url: process.env.E2E_SEPOLIA_RPC as string,
      accounts: [generatePrivateKey()],
      sponsoredTransactions: {
        bundlerUrl: process.env.E2E_BUNDLER_URL as string,
        paymasterUrl: process.env.E2E_PAYMASTER_URL as string,
        paymasterType: process.env.E2E_PAYMASTER_TYPE as string,
      },
    },
  },
};

export default config;

// We load the plugin here.
import { HardhatUserConfig } from 'hardhat/types';

import '../../../src/index';

const config: HardhatUserConfig = {
  solidity: '0.7.3',
  defaultNetwork: 'hardhat',
  networks: {
    localhost: {
      accountAbstraction: {
        bundlerUrl: 'http://localhost:3000',
        paymasterUrl: 'http://localhost:3001',
      },
    },
  },
};

export default config;

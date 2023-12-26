// We load the plugin here.
import { HardhatUserConfig } from 'hardhat/types';

import '../../../src/index';

const config: HardhatUserConfig = {
  solidity: '0.7.3',
  defaultNetwork: 'hardhat',
  networks: {
    localhost: {
      pimlicoApiKey: 'foo',
      entryPoint: '0x0576a174D229E3cFA37253523E645A78A0C91B57',
    },
  },
};

export default config;

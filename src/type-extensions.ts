import 'hardhat/types/config';
import 'hardhat/types/runtime';

declare module 'hardhat/types/config' {
  export interface HttpNetworkUserConfig {
    pimlicoApiKey?: string;
  }

  export interface HttpNetworkConfig {
    pimlicoApiKey?: string;
  }
}

import 'hardhat/types/config';
import 'hardhat/types/runtime';

declare module 'hardhat/types/config' {
  export interface HttpNetworkUserConfig {
    pimlicoApiKey?: string;
    entryPoint?: `0x${string}`;
  }

  export interface HttpNetworkConfig {
    pimlicoApiKey?: string;
    entryPoint?: `0x${string}`;
  }
}

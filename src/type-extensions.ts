import 'hardhat/types/config';
import 'hardhat/types/runtime';

declare module 'hardhat/types/config' {
  export interface HttpNetworkUserConfig {
    sponsoredTransaction?: {
      bundlerUrl: string;
      paymasterUrl: string;
    };
  }

  export interface HttpNetworkConfig {
    sponsoredTransaction?: {
      bundlerUrl: string;
      paymasterUrl: string;
    };
  }
}

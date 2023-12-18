import 'hardhat/types/config';
import 'hardhat/types/runtime';

declare module 'hardhat/types/config' {
  export interface HttpNetworkUserConfig {
    sponsorUrl?: string;
  }

  export interface HttpNetworkConfig {
    sponsorUrl?: string;
  }
}

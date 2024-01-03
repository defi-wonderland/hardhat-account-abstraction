import 'hardhat/types/config';
import 'hardhat/types/runtime';
import { PaymasterTypeLiteral } from './types';

declare module 'hardhat/types/config' {
  export interface HttpNetworkUserConfig {
    sponsoredTransaction?: {
      bundlerUrl: string;
      paymasterUrl: string;
      paymasterType: PaymasterTypeLiteral;
    };
  }

  export interface HttpNetworkConfig {
    sponsoredTransaction?: {
      bundlerUrl: string;
      paymasterUrl: string;
      paymasterType: PaymasterTypeLiteral;
    };
  }
}

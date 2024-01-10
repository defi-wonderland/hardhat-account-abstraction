import 'hardhat/types/config';
import 'hardhat/types/runtime';
import { PaymasterTypeLiteral } from './types';

declare module 'hardhat/types/config' {
  export interface HttpNetworkUserConfig {
    sponsoredTransactions?: {
      bundlerUrl: string;
      paymasterUrl: string;
      paymasterType: PaymasterTypeLiteral;
      simpleAccountFactoryAddress?: `0x${string}`;
    };
  }

  export interface HttpNetworkConfig {
    sponsoredTransactions?: {
      bundlerUrl: string;
      paymasterUrl: string;
      paymasterType: PaymasterTypeLiteral;
      simpleAccountFactoryAddress?: `0x${string}`;
    };
  }
}

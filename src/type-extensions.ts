import 'hardhat/types/config';
import 'hardhat/types/runtime';
import { PaymasterTypeLiteral } from './types';

declare module 'hardhat/types/config' {
  /**
   * The extended interface with the sponsored transactions field
   * @property bundlerUrl  The URL of the bundler
   * @property paymasterUrl  The URL of the paymaster
   * @property paymasterType  The type of the paymaster
   * @property simpleAccountFactoryAddress  The address of the simple account factory
   * @property policyId The optional policy ID for the paymaster
   */
  export interface HttpNetworkUserConfig {
    accountAbstraction?: {
      bundlerUrl: string;
      paymasterUrl: string;
      paymasterType: PaymasterTypeLiteral;
      simpleAccountFactoryAddress?: `0x${string}`;
      policyId?: string;
      smartAccount?: `0x${string}`;
    };
  }

  /**
   * The extended interface with the sponsored transactions field
   * @property bundlerUrl  The URL of the bundler
   * @property paymasterUrl  The URL of the paymaster
   * @property paymasterType  The type of the paymaster
   * @property simpleAccountFactoryAddress  The address of the simple account factory
   * @property policyId The optional policy ID for the paymaster
   */
  export interface HttpNetworkConfig {
    accountAbstraction?: {
      bundlerUrl: string;
      paymasterUrl: string;
      paymasterType: PaymasterTypeLiteral;
      simpleAccountFactoryAddress?: `0x${string}`;
      policyId?: string;
      smartAccount?: `0x${string}`;
    };
  }
}

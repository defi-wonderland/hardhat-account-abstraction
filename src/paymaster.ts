import { PaymasterType } from './types';
import { BasePaymaster } from './paymasters/BasePaymaster';
import * as Pm from './paymasters';

export function createPaymasterClient(paymasterType: PaymasterType, paymasterUrl: string): BasePaymaster {
  switch (paymasterType) {
    case PaymasterType.Pimlico:
      return new Pm.PimlicoPaymaster(paymasterUrl);
    case PaymasterType.StackUp:
      return new Pm.StackUpPaymaster(paymasterUrl);
    case PaymasterType.Biconomy:
      return new Pm.BiconomyPaymaster(paymasterUrl);

    default:
      throw new Error(`Unknown paymaster type ${paymasterType}`);
  }
}

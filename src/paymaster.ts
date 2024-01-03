import { PaymasterType } from './types';
import { BasePaymaster } from './paymasters/BasePaymaster';
import * as Pm from './paymasters';

export function createPaymasterClient(paymasterType: PaymasterType, paymasterUrl: string): BasePaymaster {
  switch (paymasterType) {
    case PaymasterType.Pimlico:
      return new Pm.PimlicoPaymaster(paymasterUrl);
    case PaymasterType.Alchemy:
      return new Pm.AlchemyPaymaster(paymasterUrl);

    default:
      throw new Error(`Unknown paymaster type ${paymasterType}`);
  }
}

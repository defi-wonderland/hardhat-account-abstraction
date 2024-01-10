import { PaymasterType } from './types';
import { Paymaster } from './paymasters/Paymaster';
import * as Pm from './paymasters';

export function createPaymasterClient(paymasterType: PaymasterType, paymasterUrl: string): Paymaster {
  switch (paymasterType) {
    case PaymasterType.Pimlico:
      return new Pm.PimlicoPaymaster(paymasterUrl);
    case PaymasterType.StackUp:
      return new Pm.StackUpPaymaster(paymasterUrl);
    case PaymasterType.Base:
      return new Pm.BasePaymaster(paymasterUrl);
    case PaymasterType.Alchemy:
      return new Pm.AlchemyPaymaster(paymasterUrl);

    default:
      throw new Error(`Unknown paymaster type ${paymasterType}`);
  }
}

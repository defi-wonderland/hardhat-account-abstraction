import { PaymasterType } from './types';
import { Paymaster } from './paymasters/Paymaster';
import * as Pm from './paymasters';

/**
 * Creates a paymaster based on the paymaster type.
 * @param paymasterType The type of paymaster to create
 * @param paymasterUrl The url of the paymaster
 * @param policyId The optional policy ID for the paymaster
 * @returns A paymaster
 */
export function createPaymasterClient(
  paymasterType: PaymasterType,
  paymasterUrl: string,
  policyId?: string,
): Paymaster {
  switch (paymasterType) {
    case PaymasterType.Pimlico:
      return new Pm.PimlicoPaymaster(paymasterUrl);
    case PaymasterType.StackUp:
      return new Pm.StackUpPaymaster(paymasterUrl);
    case PaymasterType.Base:
      return new Pm.BasePaymaster(paymasterUrl);
    case PaymasterType.Alchemy:
      return new Pm.AlchemyPaymaster(paymasterUrl, policyId);

    default:
      throw new Error(`Unknown paymaster type ${paymasterType}`);
  }
}

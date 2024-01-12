import { PaymasterType } from './types';
import { Paymaster } from './paymasters/Paymaster';
import * as Pm from './paymasters';
import { PimlicoBundlerClient } from 'permissionless/clients/pimlico';

/**
 * Creates a paymaster based on the paymaster type.
 * @param paymasterType The type of paymaster to create
 * @param paymasterUrl The url of the paymaster
 * @param bundlerClient The bundler client to use
 * @param policyId The optional policy ID for the paymaster
 * @returns A paymaster
 */
export function createPaymasterClient(
  paymasterType: PaymasterType,
  paymasterUrl: string,
  bundlerClient: PimlicoBundlerClient,
  policyId?: string,
): Paymaster {
  switch (paymasterType) {
    case PaymasterType.Pimlico:
      return new Pm.PimlicoPaymaster(paymasterUrl);
    case PaymasterType.StackUp:
      return new Pm.StackUpPaymaster(paymasterUrl);
    case PaymasterType.Biconomy:
      return new Pm.BiconomyPaymaster(paymasterUrl);
    case PaymasterType.Base:
      return new Pm.BasePaymaster(paymasterUrl, bundlerClient);
    case PaymasterType.Alchemy:
      return new Pm.AlchemyPaymaster(paymasterUrl, policyId);

    default:
      throw new Error(`Unknown paymaster type ${paymasterType}`);
  }
}

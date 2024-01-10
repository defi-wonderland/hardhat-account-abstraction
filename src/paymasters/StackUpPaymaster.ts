import { Paymaster } from './Paymaster';
import { PartialUserOperation } from '../types';
import { http } from 'viem';
import { createStackupPaymasterClient } from 'permissionless/clients/stackup';
import { SponsorUserOperationReturnType } from 'permissionless/actions/stackup';
import { StackupPaymasterContext } from 'permissionless/types/stackup';
import { PimlicoBundlerClient } from 'permissionless/clients/pimlico';

/**
 * Paymaster for StackUp.
 */
export class StackUpPaymaster extends Paymaster {
  public paymasterClient: ReturnType<typeof createStackupPaymasterClient>;

  constructor(endpoint: string) {
    super(endpoint);
    this.paymasterClient = createStackupPaymasterClient({
      transport: http(endpoint),
    });
  }

  /**
   * Sponsor a user operation.
   * @param userOperation The user operation to sponsor
   * @param entryPoint The entry point to use
   * @param bundlerClient The bundler client to use
   * @returns The paymasterAndData and gas information for the user operation
   */
  public async sponsorUserOperation(
    userOperation: PartialUserOperation,
    entryPoint: `0x${string}`,
    bundlerClient: PimlicoBundlerClient,
  ): Promise<SponsorUserOperationReturnType> {
    return await this.paymasterClient.sponsorUserOperation({
      userOperation,
      entryPoint,
      context: {
        type: 'payg',
      } as StackupPaymasterContext,
    });
  }
}

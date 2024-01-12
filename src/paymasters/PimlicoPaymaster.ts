import { Paymaster } from './Paymaster';
import { PartialUserOperation } from '../types';
import { http } from 'viem';
import { createPimlicoPaymasterClient } from 'permissionless/clients/pimlico';
import { SponsorUserOperationReturnType } from 'permissionless/actions/pimlico';
import { PimlicoBundlerClient } from 'permissionless/clients/pimlico';

/**
 * Paymaster for Pimlico.
 */
export class PimlicoPaymaster extends Paymaster {
  public paymasterClient: ReturnType<typeof createPimlicoPaymasterClient>;
  public policyId: string | undefined;

  constructor(endpoint: string, policyId: string | undefined) {
    super(endpoint);

    this.paymasterClient = createPimlicoPaymasterClient({
      transport: http(endpoint),
    });
    this.policyId = policyId;
  }

  /**
   * Sponsor a user operation.
   * @param userOperation The user operation to sponsor
   * @param entryPoint The entry point to use
   * @returns The paymasterAndData and gas information for the user operation
   */
  public async sponsorUserOperation(
    userOperation: PartialUserOperation,
    entryPoint: `0x${string}`,
  ): Promise<SponsorUserOperationReturnType> {
    return await this.paymasterClient.sponsorUserOperation({
      userOperation,
      entryPoint,
      sponsorshipPolicyId: this.policyId,
    });
  }
}

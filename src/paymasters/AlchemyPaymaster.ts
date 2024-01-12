import { Paymaster } from './Paymaster';
import { PartialUserOperation } from '../types';
import { SponsorUserOperationReturnType } from 'permissionless/actions/pimlico';
import { convertBigIntsToString } from '../utils';

/**
 * Paymaster for Alchemy
 */
export class AlchemyPaymaster extends Paymaster {
  public policyId: string;

  constructor(endpoint: string, policyId: string | undefined) {
    super(endpoint);

    if (policyId === undefined) throw new Error('Policy ID is required for Alchemy Paymaster');
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
    const userOp = convertBigIntsToString(userOperation);

    const gasAndPaymasterAndData = (await this.endpoint.send('alchemy_requestGasAndPaymasterAndData', [
      {
        policyId: this.policyId,
        entryPoint: entryPoint,
        dummySignature: userOperation.signature,
        userOperation: userOp,
      },
    ])) as SponsorUserOperationReturnType;

    return {
      ...gasAndPaymasterAndData,
    };
  }
}

import { SponsorUserOperationReturnType } from 'permissionless/actions/pimlico';
import { JsonRpcProvider } from '@ethersproject/providers';
import { PartialUserOperation } from '../types';

/**
 * Base class for paymasters.
 */
export abstract class Paymaster {
  public endpoint: JsonRpcProvider;

  constructor(endpoint: string) {
    this.endpoint = new JsonRpcProvider(endpoint);
  }

  /**
   * Sponsor a user operation.
   * @param userOperation The user operation to sponsor
   * @param entryPoint The entry point to use
   * @returns The paymasterAndData and gas information for the user operation or just the paymasterAndData depending on the implementation
   */
  abstract sponsorUserOperation(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    userOp: PartialUserOperation,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    entryPoint: `0x${string}`,
  ): Promise<SponsorUserOperationReturnType>;
}

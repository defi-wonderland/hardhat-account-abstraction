import { SponsorUserOperationReturnType } from 'permissionless/actions/pimlico';
import { PartialUserOperation } from '../types';
import { PimlicoBundlerClient } from 'permissionless/clients/pimlico';

/**
 * Base class for paymasters.
 */
export class Paymaster {
  public endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  /**
   * Sponsor a user operation.
   * @param userOperation The user operation to sponsor
   * @param entryPoint The entry point to use
   * @param bundlerClient The bundler client to use
   * @returns The paymasterAndData and gas information for the user operation or just the paymasterAndData depending on the implementation
   */
  public async sponsorUserOperation(
    userOp: PartialUserOperation,
    entryPoint: `0x${string}`,
    bundlierClient: PimlicoBundlerClient,
  ): Promise<SponsorUserOperationReturnType> {
    throw new Error('This is a base class and should not be called directly.');
  }
}

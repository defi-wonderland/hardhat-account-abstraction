import { SponsorUserOperationReturnType } from 'permissionless/actions/pimlico';
import { PartialUserOperation } from '../types';
import { PimlicoBundlerClient } from 'permissionless/clients/pimlico';

export class Paymaster {
  public endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  // eslint-disable
  public async sponsorUserOperation(
    userOp: PartialUserOperation,
    entryPoint: `0x${string}`,
    bundlierClient: PimlicoBundlerClient,
  ): Promise<`0x${string}` | SponsorUserOperationReturnType> {
    throw new Error('This is a base class and should not be called directly.');
  }
  // eslint-enable
}

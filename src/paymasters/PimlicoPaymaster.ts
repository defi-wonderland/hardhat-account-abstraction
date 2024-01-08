import { Paymaster } from './Paymaster';
import { PartialUserOperation } from '../types';
import { http } from 'viem';
import { createPimlicoPaymasterClient } from 'permissionless/clients/pimlico';
import { SponsorUserOperationReturnType } from 'permissionless/actions/pimlico';
import { PimlicoBundlerClient } from 'permissionless/clients/pimlico';

export class PimlicoPaymaster extends Paymaster {
  public paymasterClient: ReturnType<typeof createPimlicoPaymasterClient>;

  constructor(endpoint: string) {
    super(endpoint);
    this.paymasterClient = createPimlicoPaymasterClient({
      transport: http(endpoint),
    });
  }

  public async sponsorUserOperation(
    userOperation: PartialUserOperation,
    entryPoint: `0x${string}`,
    bundlerClient: PimlicoBundlerClient,
  ): Promise<`0x${string}` | SponsorUserOperationReturnType> {
    return await this.paymasterClient.sponsorUserOperation({
      userOperation,
      entryPoint,
    });
  }
}

import { BasePaymaster } from './BasePaymaster';
import { PartialUserOperation } from '../types';
import { http } from 'viem';
import { createPimlicoPaymasterClient } from 'permissionless/clients/pimlico';
import { SponsorUserOperationReturnType } from 'permissionless/actions/pimlico';

export class AlchemyPaymaster extends BasePaymaster {
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
  ): Promise<SponsorUserOperationReturnType> {
    return await this.paymasterClient.sponsorUserOperation({
      userOperation,
      entryPoint,
    });
  }
}

import { BasePaymaster } from './BasePaymaster';
import { PartialUserOperation } from '../types';
import { http } from 'viem';
import { createStackupPaymasterClient } from 'permissionless/clients/stackup';
import { SponsorUserOperationReturnType } from 'permissionless/actions/stackup';
import { StackupPaymasterContext } from 'permissionless/types/stackup';

export class StackUpPaymaster extends BasePaymaster {
  public paymasterClient: ReturnType<typeof createStackupPaymasterClient>;

  constructor(endpoint: string) {
    super(endpoint);
    this.paymasterClient = createStackupPaymasterClient({
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
      context: {
        type: 'payg',
      } as StackupPaymasterContext,
    });
  }
}

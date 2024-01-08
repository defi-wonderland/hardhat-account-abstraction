import { BasePaymaster } from './BasePaymaster';
import { SponsorUserOperationReturnType } from 'permissionless/actions/pimlico';
import { PartialUserOperation } from '../types';

export class BiconomyPaymaster extends BasePaymaster {
  constructor(endpoint: string) {
    super(endpoint);
  }

  public async sponsorUserOperation(
    userOperation: PartialUserOperation,
    entryPoint: `0x${string}`,
  ): Promise<`0x${string}` | SponsorUserOperationReturnType> {
    const userOp = this.convertBigIntsToString(userOperation);

    const data = {
      jsonrpc: '2.0',
      method: 'pm_sponsorUserOperation',
      id: 1,
      params: [
        userOp,
        {
          mode: 'SPONSORED',
          calculateGasLimits: true,
          expiryDuration: 300, //5mins
          sponsorshipInfo: {
            webhookData: {},
            smartAccountInfo: {
              name: 'BICONOMY',
              version: '1.0.0',
            },
          },
        },
      ],
    };

    const response = await fetch(this.endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });

    const json = await response.json();
    if (json.error) {
      throw new Error(json.error.message);
    }
    console.log(json);
    return json.result;
  }

  private convertBigIntsToString(obj: any) {
    for (const key in obj) {
      if (typeof obj[key] === 'bigint') {
        // Convert 0n to '0x', and other BigInts to their string representation
        obj[key] = obj[key].toString();
      }
    }

    console.log(obj);
    return obj;
  }
}

import { Paymaster } from './Paymaster';
import { SponsorUserOperationReturnType } from 'permissionless/actions/pimlico';
import { PartialUserOperation } from '../types';
import { convertBigIntsToString } from '../utils';
import { parse } from 'dotenv';

export class BiconomyPaymaster extends Paymaster {
  public string_endpoint: string;
  constructor(endpoint: string) {
    super(endpoint);
    this.string_endpoint = endpoint;
  }

  public async sponsorUserOperation(
    userOperation: PartialUserOperation,
    entryPoint: `0x${string}`,
  ): Promise<SponsorUserOperationReturnType> {
    const userOp = convertBigIntsToString(userOperation);
    userOp.callGasLimit = '30000';
    userOp.verificationGasLimit = '10000';
    userOp.preVerificationGas = '10000';
    console.log(userOp);

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
              version: '2.0.0',
            },
          },
        },
      ],
    };

    const response = await fetch(this.string_endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });

    const json = await response.json();

    console.log(json);
    return json.result;
  }
}

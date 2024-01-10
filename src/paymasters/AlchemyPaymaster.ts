import { Paymaster } from './Paymaster';
import { PartialUserOperation } from '../types';
import { SponsorUserOperationReturnType } from 'permissionless/actions/pimlico';
import { convertBigIntsToString } from '../utils';
import { PimlicoBundlerClient } from 'permissionless/clients/pimlico';

export class AlchemyPaymaster extends Paymaster {
  public policyId: string;

  constructor(endpoint: string, policyId: string | undefined) {
    super(endpoint);

    if (policyId === undefined) throw new Error('Policy ID is required for Alchemy Paymaster');
    this.policyId = policyId;
  }

  public async sponsorUserOperation(
    userOperation: PartialUserOperation,
    entryPoint: `0x${string}`,
  ): Promise<SponsorUserOperationReturnType> {
    const userOp = convertBigIntsToString(userOperation);

    const data = {
      id: 1,
      jsonrpc: '2.0',
      method: 'alchemy_requestGasAndPaymasterAndData',
      params: [
        {
          policyId: this.policyId,
          entryPoint: entryPoint,
          dummySignature: userOperation.signature,
          userOperation: userOp,
        },
      ],
    };

    const response = await fetch(this.endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });

    const gasAndPaymasterAndData = (await response.json()).result;

    return {
      ...gasAndPaymasterAndData,
    };
  }
}

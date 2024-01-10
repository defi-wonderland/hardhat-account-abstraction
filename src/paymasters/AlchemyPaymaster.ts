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
    bundlerClient: PimlicoBundlerClient,
  ): Promise<SponsorUserOperationReturnType> {
    const userOp = convertBigIntsToString(userOperation);

    const data = {
      id: 1,
      jsonrpc: '2.0',
      method: 'alchemy_requestPaymasterAndData',
      params: [this.policyId, entryPoint, userOp],
    };

    const response = await fetch(this.endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });

    const paymasterAndData = (await response.json()).result;

    const gasConfig = await bundlerClient.estimateUserOperationGas({
      userOperation: Object.assign(userOperation, { paymasterAndData: paymasterAndData }),
      entryPoint,
    });

    // Adding gas headroom for safety margin to ensure paymaster signs for enough gas based on estimations
    gasConfig.preVerificationGas = gasConfig.preVerificationGas + 2000n;
    gasConfig.verificationGasLimit = gasConfig.verificationGasLimit + 4000n;

    return {
      ...gasConfig,
      paymasterAndData: paymasterAndData,
    };
  }
}

import { SponsorUserOperationReturnType } from 'permissionless/actions/pimlico';
import { PartialUserOperation } from '../types';
import { Paymaster } from './Paymaster';
import { PimlicoBundlerClient } from 'permissionless/clients/pimlico';

export class BasePaymaster extends Paymaster {
  constructor(endpoint: string) {
    super(endpoint);
  }

  public async sponsorUserOperation(
    userOperation: PartialUserOperation,
    entryPoint: `0x${string}`,
    bundlerClient: PimlicoBundlerClient,
  ): Promise<`0x${string}` | SponsorUserOperationReturnType> {
    const userOp = this.convertBigIntsToString(userOperation);

    const chainIdAsNumber = await bundlerClient.chainId();
    const chainId = '0x' + chainIdAsNumber.toString(16);

    const data = {
      id: 1,
      jsonrpc: '2.0',
      method: 'eth_paymasterAndDataForEstimateGas',
      params: [userOp, entryPoint, chainId],
    };

    const response = await fetch(this.endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });

    const json = await response.json();

    const paymasterAndData = json.result;

    const gasConfig = await bundlerClient.estimateUserOperationGas({
      userOperation: Object.assign(userOperation, { paymasterAndData: paymasterAndData }),
      entryPoint,
    });

    // Adding gas headroom for safety margin to ensure paymaster signs for enough gas based on estimations
    gasConfig.preVerificationGas = gasConfig.preVerificationGas + 2000n;
    gasConfig.verificationGasLimit = gasConfig.verificationGasLimit + 4000n;

    const stringifyGasConfig = this.convertBigIntsToString(gasConfig);

    const finalCallData = {
      id: 1,
      jsonrpc: '2.0',
      method: 'eth_paymasterAndDataForUserOperation',
      params: [Object.assign(userOp, stringifyGasConfig), entryPoint, chainId],
    };

    const final_response = await fetch(this.endpoint, {
      method: 'POST',
      body: JSON.stringify(finalCallData),
      headers: { 'Content-Type': 'application/json' },
    });

    const final_json = await final_response.json();

    return {
      ...gasConfig,
      paymasterAndData: final_json.result,
    };
  }

  // Helper function to convert bigints to hexadecimal strings, which is what base api expects
  private convertBigIntsToString(obj: any) {
    for (const key in obj) {
      if (typeof obj[key] === 'bigint') {
        // Convert 0n to '0x', and other BigInts to their string representation
        // NOTE: base expects gas values to be non-zero, but nonce might be zero so we need to be sure to exclude it
        obj[key] = obj[key] === 0n && key !== 'nonce' ? '0x1' : '0x' + obj[key].toString(16);
      }
    }

    return obj;
  }
}

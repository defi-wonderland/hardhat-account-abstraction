import { SponsorUserOperationReturnType } from 'permissionless/actions/pimlico';
import { PartialUserOperation } from '../types';
import { Paymaster } from './Paymaster';
import { PimlicoBundlerClient } from 'permissionless/clients/pimlico';
import { convertBigIntsToString } from '../utils';

/**
 * Paymaster for Base
 */
export class BasePaymaster extends Paymaster {
  constructor(endpoint: string) {
    super(endpoint);
  }

  /**
   * Sponsor a user operation.
   * @param userOperation The user operation to sponsor
   * @param entryPoint The entry point to use
   * @param bundlerClient The bundler client to use
   * @returns The paymasterAndData and gas information for the user operation
   */
  public async sponsorUserOperation(
    userOperation: PartialUserOperation,
    entryPoint: `0x${string}`,
    bundlerClient: PimlicoBundlerClient,
  ): Promise<`0x${string}` | SponsorUserOperationReturnType> {
    const userOp = convertBigIntsToString(userOperation);

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

    const stringifyGasConfig = convertBigIntsToString(gasConfig);

    const finalCallData = {
      id: 1,
      jsonrpc: '2.0',
      method: 'eth_paymasterAndDataForUserOperation',
      params: [Object.assign(userOp, stringifyGasConfig), entryPoint, chainId],
    };

    const finalResponse = await fetch(this.endpoint, {
      method: 'POST',
      body: JSON.stringify(finalCallData),
      headers: { 'Content-Type': 'application/json' },
    });

    const finalJson = await finalResponse.json();

    return {
      ...gasConfig,
      paymasterAndData: finalJson.result,
    };
  }
}

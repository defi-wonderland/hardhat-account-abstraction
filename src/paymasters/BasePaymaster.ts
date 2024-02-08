import { SponsorUserOperationReturnType } from 'permissionless/actions/pimlico';
import { PimlicoBundlerClient } from 'permissionless/clients/pimlico';
import { PartialUserOperation } from '../types';
import { Paymaster } from './Paymaster';
import { convertBigIntsToString } from '../utils';

/**
 * Paymaster for Base
 */
export class BasePaymaster extends Paymaster {
  public bundlerClient: PimlicoBundlerClient;

  constructor(endpoint: string, bundlerClient: PimlicoBundlerClient) {
    super(endpoint);

    this.bundlerClient = bundlerClient;
  }

  /**
   * Sponsor a user operation.
   * @param userOperation The user operation to sponsor
   * @param entryPoint The entry point to use
   * @returns The paymasterAndData and gas information for the user operation
   */
  public async sponsorUserOperation(
    userOperation: PartialUserOperation,
    entryPoint: `0x${string}`,
  ): Promise<SponsorUserOperationReturnType> {
    const userOp = convertBigIntsToString(userOperation);

    const chainIdAsNumber = await this.bundlerClient.chainId();
    const chainId = '0x' + chainIdAsNumber.toString(16);

    const paymasterAndDataForEstimateGas = (await this.endpoint.send('eth_paymasterAndDataForEstimateGas', [
      userOp,
      entryPoint,
      chainId,
    ])) as `0x${string}`;

    const gasConfig = await this.bundlerClient.estimateUserOperationGas({
      userOperation: Object.assign(userOperation, { paymasterAndData: paymasterAndDataForEstimateGas }),
      entryPoint,
    });

    // Adding gas headroom for safety margin to ensure paymaster signs for enough gas based on estimations
    gasConfig.preVerificationGas = gasConfig.preVerificationGas + 2000n;
    gasConfig.verificationGasLimit = gasConfig.verificationGasLimit + 4000n;

    const stringifyGasConfig = convertBigIntsToString(gasConfig);

    const paymasterAndDataForUserOperation = (await this.endpoint.send('eth_paymasterAndDataForUserOperation', [
      Object.assign(userOp, stringifyGasConfig),
      entryPoint,
      chainId,
    ])) as `0x${string}`;

    return {
      ...gasConfig,
      paymasterAndData: paymasterAndDataForUserOperation,
    };
  }
}

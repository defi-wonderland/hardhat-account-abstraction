import { ethers } from 'ethers';
import { ProviderWrapper } from 'hardhat/plugins';
import { EIP1193Provider, RequestArguments } from 'hardhat/types';
import init from 'debug';
import { createPublicClient, concat, encodeFunctionData, Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { PimlicoBundlerClient } from 'permissionless/clients/pimlico';
import { UserOperation } from 'permissionless/types';
import { getSenderAddress, signUserOperationHashWithECDSA, getAccountNonce } from './mock';
import * as constants from './constants';
import { Paymaster } from './paymasters';
import { PartialBy } from 'viem/types/utils';
import { getRandomBigInt } from './utils';

const log = init('hardhat:plugin:gasless');

// TODO: Test this with value transfers
// TODO: Test this with tx type 0, 1

/**
 * Gasless Provider class that routes transactions through a bundler and paymaster, based on the ERC 4337 standard
 */
export class GaslessProvider extends ProviderWrapper {
  constructor(
    protected readonly _signerPk: `0x${string}`,
    protected readonly _wrappedProvider: EIP1193Provider,
    protected readonly bundlerClient: PimlicoBundlerClient,
    protected readonly paymasterClient: Paymaster,
    protected readonly publicClient: ReturnType<typeof createPublicClient>,
    protected readonly _initCode: `0x${string}`,
    protected readonly senderAddress: `0x${string}`,
    protected readonly _owner: ReturnType<typeof privateKeyToAccount>,
    protected readonly _entryPoint: `0x${string}`,
    protected _nonce: bigint,
  ) {
    super(_wrappedProvider);
  }

  /**
   * Asynchronously creates a new GaslessProvider
   * @param _signerPk The signer of the transactions that will be sent through the provider
   * @param _wrappedProvider The provider that we are wrapping
   * @param bundlerClient The bundler client we will submit bundles to
   * @param paymasterClient The paymaster that will sponsor our transactions
   * @param publicClient The public client that will be used to query for gas prices
   * @param simpleAccountFactoryAddress The simple account factory address to use
   * @returns A new GaslessProvider
   */
  static async create(
    _signerPk: `0x${string}`,
    _wrappedProvider: EIP1193Provider,
    bundlerClient: PimlicoBundlerClient,
    paymasterClient: Paymaster,
    publicClient: ReturnType<typeof createPublicClient>,
    simpleAccountFactoryAddress: `0x${string}`,
    smartAccount?: `0x${string}`,
  ) {
    // NOTE: Bundlers can support many entry points, but currently they only support one, we use this method so if they ever add a new one the entry point will still work
    const entryPoint = (await bundlerClient.supportedEntryPoints())[0];
    const owner = privateKeyToAccount(_signerPk);

    const initCode = !smartAccount
      ? concat([
          simpleAccountFactoryAddress,
          encodeFunctionData({
            abi: [
              {
                inputs: [
                  { name: 'owner', type: 'address' },
                  { name: 'salt', type: 'uint256' },
                ],
                name: 'createAccount',
                outputs: [{ name: 'ret', type: 'address' }],
                stateMutability: 'nonpayable',
                type: 'function',
              },
            ],
            args: [owner.address, BigInt(owner.address)],
          }),
        ])
      : '0x';

    const senderAddress = !smartAccount
      ? await getSenderAddress(publicClient, {
          initCode: initCode,
          entryPoint: entryPoint,
        })
      : smartAccount;

    const nonce = await getAccountNonce(publicClient, {
      sender: senderAddress,
      entryPoint: entryPoint,
    });

    const gaslessProvider = new GaslessProvider(
      _signerPk,
      _wrappedProvider,
      bundlerClient,
      paymasterClient,
      publicClient,
      initCode,
      senderAddress,
      owner,
      entryPoint,
      nonce,
    );

    return gaslessProvider;
  }

  /**
   * Sends requests to the provider, if the request is a transaction, it will be sent through the bundler and paymaster
   * @param args The arguments for the request
   * @returns Unknown, as it depends on the request being made
   */
  public request(args: RequestArguments): Promise<unknown> {
    if (args.method === 'eth_sendRawTransaction' && args.params !== undefined) {
      const params = this._getParams(args);
      return this._sendGaslessTransaction(params[0]);
    }

    return this._wrappedProvider.request(args);
  }

  /**
   * Sends a gasless transaction
   * @param tx The transactions that needs to be bundled and sponsored
   * @returns The transaction hash of the sponsored transaction
   */
  private async _sendGaslessTransaction(tx: string): Promise<string> {
    log('Transaction to be signed for sponsoring', tx);

    // Parse the transaction
    const parsedTxn = ethers.utils.parseTransaction(tx);

    // Get gas prices
    const { maxFeePerGas, maxPriorityFeePerGas } = await this.publicClient.estimateFeesPerGas();

    // Generate calldata
    // This calldata is hardcoded as it is calldata for pimlico to execute
    const callData = encodeFunctionData({
      abi: [
        {
          inputs: [
            { name: 'dest', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'func', type: 'bytes' },
          ],
          name: 'execute',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function',
        },
      ],
      args: [parsedTxn.to as `0x${string}`, parsedTxn.value.toBigInt(), parsedTxn.data as `0x${string}`],
    });

    // Construct UserOperation
    const userOperation: PartialBy<
      UserOperation,
      'callGasLimit' | 'preVerificationGas' | 'verificationGasLimit' | 'paymasterAndData'
    > = {
      sender: this.senderAddress,
      nonce: this._nonce,
      initCode: this._nonce === 0n ? this._initCode : '0x',
      callData,
      maxFeePerGas: maxFeePerGas as bigint,
      maxPriorityFeePerGas: maxPriorityFeePerGas as bigint,
      // dummy signature, needs to be there so the SimpleAccount doesn't immediately revert because of invalid signature length
      signature: constants.dummySignature as Hex,
      callGasLimit: 0n, // dummy value
      paymasterAndData: '0x', // dummy value
      preVerificationGas: 0n, // dummy value
      verificationGasLimit: 0n, // dummy value
    };

    const paymasterAndData = await this.paymasterClient.sponsorUserOperation(userOperation, this._entryPoint);

    const sponsoredUserOperation: UserOperation = Object.assign(userOperation, paymasterAndData);

    // SIGN THE USER OPERATION
    const signature = await signUserOperationHashWithECDSA({
      account: this._owner,
      userOperation: sponsoredUserOperation,
      chainId: await this.publicClient.getChainId(),
      entryPoint: this._entryPoint,
    });
    sponsoredUserOperation.signature = signature;

    log('Generated signature:', signature);

    let userOperationHash;

    try {
      // SUBMIT THE USER OPERATION TO BE BUNDLED
      userOperationHash = await this.bundlerClient.sendUserOperation({
        userOperation: sponsoredUserOperation,
        entryPoint: this._entryPoint,
      });
    } catch (e) {
      // There are some bundler and paymaster combos that are incompatible due to certain bundlers requiring certain gas prices and paymasters might have a different minimum set for example
      // We throw this error because if the scripts fail here its because of a combo incompatibility which is out of our control
      throw new Error(
        `Failed to send user operation! There might be an incompatibility with your bundle and paymaster, try changing one of them. The submission failed from the following error:\n ${e}`,
      );
    }

    log('Received User Operation hash:', userOperationHash);

    // let's also wait for the userOperation to be included, by continually querying for the receipts
    log('Querying for receipts...');
    const receipt = await this.bundlerClient.waitForUserOperationReceipt({ hash: userOperationHash });
    const txHash = receipt.receipt.transactionHash;
    log('Transaction hash:', txHash);

    // Make a new init code for the next transaction
    this._nonce += 1n;
    // return the tx hash
    return txHash;
  }
}

import { ethers } from 'ethers';
import { ProviderWrapper } from 'hardhat/plugins';
import { EIP1193Provider, RequestArguments } from 'hardhat/types';
import init from 'debug';
import { createPublicClient, concat, encodeFunctionData, Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { PimlicoBundlerClient } from 'permissionless/clients/pimlico';
import { UserOperation } from 'permissionless/types';
import { getSenderAddress, signUserOperationHashWithECDSA } from 'permissionless';
import * as constants from '../src/constants';
import { BasePaymaster } from './paymasters';

const log = init('hardhat:plugin:gasless');

// TODO: Test this with value transfers
// TODO: Test this with tx type 0, 1
export class GaslessProvider extends ProviderWrapper {
  private _nonce: bigint;

  constructor(
    protected readonly _signerPk: `0x${string}`,
    protected readonly _wrappedProvider: EIP1193Provider,
    public readonly chain: string,
    protected readonly bundlerClient: PimlicoBundlerClient,
    protected readonly paymasterClient: BasePaymaster,
    protected readonly publicClient: ReturnType<typeof createPublicClient>,
    protected readonly _initCode: `0x${string}`,
    protected readonly senderAddress: `0x${string}`,
    protected readonly _owner: ReturnType<typeof privateKeyToAccount>,
    protected readonly _entryPoint: `0x${string}`,
  ) {
    super(_wrappedProvider);

    this._nonce = 0n;
  }

  static async create(
    _signerPk: `0x${string}`,
    _wrappedProvider: EIP1193Provider,
    chain: string,
    bundlerClient: PimlicoBundlerClient,
    paymasterClient: BasePaymaster,
    publicClient: ReturnType<typeof createPublicClient>,
  ) {
    // NOTE: Bundlers can support many entry points, but currently they only support one, we use this method so if they ever add a new one the entry point will still work
    const entryPoint = (await bundlerClient.supportedEntryPoints())[0];
    const simpleAccountFactoryAddress = constants.simpleAccountFactoryAddress;
    const owner = privateKeyToAccount(_signerPk);

    const initCode = concat([
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
        args: [owner.address, getRandomBigInt(0n, 2n ** 256n)],
      }),
    ]);

    const senderAddress = await getSenderAddress(publicClient, {
      initCode: initCode,
      entryPoint: entryPoint,
    });

    const gaslessProvider = new GaslessProvider(
      _signerPk,
      _wrappedProvider,
      chain,
      bundlerClient,
      paymasterClient,
      publicClient,
      initCode,
      senderAddress,
      owner,
      entryPoint,
    );

    return gaslessProvider;
  }

  public request(args: RequestArguments): Promise<unknown> {
    if (args.method === 'eth_sendRawTransaction' && args.params !== undefined) {
      const params = this._getParams(args);
      return this._sendGaslessTransaction(params[0]);
    }

    return this._wrappedProvider.request(args);
  }

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
    const userOperation = {
      sender: this.senderAddress,
      nonce: this._nonce,
      initCode: this._nonce === 0n ? this._initCode : '0x',
      callData,
      maxFeePerGas: maxFeePerGas as bigint,
      maxPriorityFeePerGas: maxPriorityFeePerGas as bigint,
      // dummy signature, needs to be there so the SimpleAccount doesn't immediately revert because of invalid signature length
      signature: constants.dummySignature as Hex,
    };

    // REQUEST PIMLICO VERIFYING PAYMASTER SPONSORSHIP
    const sponsorUserOperationResult = await this.paymasterClient.sponsorUserOperation(userOperation, this._entryPoint);

    const sponsoredUserOperation: UserOperation = {
      ...userOperation,
      ...sponsorUserOperationResult,
    };

    // SIGN THE USER OPERATION
    const signature = await signUserOperationHashWithECDSA({
      account: this._owner,
      userOperation: sponsoredUserOperation,
      chainId: await this.getChainId(),
      entryPoint: this._entryPoint,
    });
    sponsoredUserOperation.signature = signature;

    log('Generated signature:', signature);

    // SUBMIT THE USER OPERATION TO BE BUNDLED
    const userOperationHash = await this.bundlerClient.sendUserOperation({
      userOperation: sponsoredUserOperation,
      entryPoint: this._entryPoint,
    });

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

  private async getChainId(): Promise<number> {
    const rawChainId = (await this._wrappedProvider.request({
      method: 'eth_chainId',
      params: [],
    })) as string;
    return parseInt(rawChainId);
  }
}

function getRandomBigInt(min: bigint, max: bigint): bigint {
  // The Math.random() function returns a floating-point, pseudo-random number in the range 0 to less than 1
  // So, we need to adjust it to our desired range (min to max)
  const range = max - min + BigInt(1);
  const rand = BigInt(Math.floor(Number(range) * Math.random()));
  return min + rand;
}

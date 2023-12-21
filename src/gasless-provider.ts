import { ethers } from 'ethers';
import { ProviderWrapper } from 'hardhat/plugins';
import { EIP1193Provider, RequestArguments } from 'hardhat/types';
import init from 'debug';
import { Address, createPublicClient, HttpTransport, concat, encodeFunctionData, Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { SafeSmartAccount } from 'permissionless/accounts';
import { PimlicoBundlerClient, PimlicoPaymasterClient } from 'permissionless/clients/pimlico';
import { UserOperation } from 'permissionless/types';
import { getSenderAddress, signUserOperationHashWithECDSA } from 'permissionless';

const log = init('hardhat:plugin:gasless');

// TODO: Using wallets with no ETH does not work
// TODO: Test this with value transfers
// TODO: Test this with tx type 0, 1
export class GaslessProvider extends ProviderWrapper {
  private readonly _safeAccount: SafeSmartAccount<HttpTransport, undefined> | undefined;
  private readonly _entryPoint: Address;
  private _initCode: `0x${string}`;
  private readonly _owner: ReturnType<typeof privateKeyToAccount>;
  private _nonce: bigint;
  private _simpleAccountFactoryAddress: Address;
  public senderAddress: `0x${string}`;

  constructor(
    protected readonly _signerPk: `0x${string}`,
    protected readonly _wrappedProvider: EIP1193Provider,
    public readonly chain: string,
    protected readonly _pimlicoApiKey: string,
    protected readonly bundlerClient: PimlicoBundlerClient,
    protected readonly paymasterClient: PimlicoPaymasterClient,
    protected readonly publicClient: ReturnType<typeof createPublicClient>,
  ) {
    super(_wrappedProvider);

    // Hardcoded values for pimlico
    this._simpleAccountFactoryAddress = '0x9406Cc6185a346906296840746125a0E44976454';
    this._entryPoint = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';
    this._owner = privateKeyToAccount(this._signerPk);

    // Generate init code
    // Uses a random salt each time to make sure sender address is unique
    this._initCode = concat([
      this._simpleAccountFactoryAddress,
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
        args: [this._owner.address, getRandomBigInt(0n, 2n ** 256n)],
      }),
    ]);

    // NOTE: Nonce currently does not get incremented because we use a unique sender address each time, when trying to use a cached sender we get an error
    // NOTE: There is a linear task regarding this issue
    this._nonce = 0n;
    this.senderAddress = '0x';
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

    // Get sender
    this.senderAddress = await getSenderAddress(this.publicClient, {
      initCode: this._initCode,
      entryPoint: this._entryPoint,
    });

    // Parse the transaction
    const parsedTxn = ethers.utils.parseTransaction(tx);

    // Get gas prices from pimlico
    const gasPrices = await this.bundlerClient.getUserOperationGasPrice();

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
      initCode: this._initCode,
      callData,
      maxFeePerGas: gasPrices.fast.maxFeePerGas,
      maxPriorityFeePerGas: gasPrices.fast.maxPriorityFeePerGas,
      // dummy signature, needs to be there so the SimpleAccount doesn't immediately revert because of invalid signature length
      signature:
        '0xa15569dd8f8324dbeabf8023fdec36d4b754f53ce5901e283c6de79af177dc94557fa3c9922cd7af2a96ca94402d35c39f266925ee6407aeb32b31d76978d4ba1c' as Hex,
    };

    // REQUEST PIMLICO VERIFYING PAYMASTER SPONSORSHIP
    const sponsorUserOperationResult = await this.paymasterClient.sponsorUserOperation({
      userOperation,
      entryPoint: this._entryPoint,
    });

    const sponsoredUserOperation: UserOperation = {
      ...userOperation,
      preVerificationGas: sponsorUserOperationResult.preVerificationGas,
      verificationGasLimit: sponsorUserOperationResult.verificationGasLimit,
      callGasLimit: sponsorUserOperationResult.callGasLimit,
      paymasterAndData: sponsorUserOperationResult.paymasterAndData,
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
    this._initCode = concat([
      this._simpleAccountFactoryAddress,
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
        args: [this._owner.address, getRandomBigInt(0n, 2n ** 256n)],
      }),
    ]);
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

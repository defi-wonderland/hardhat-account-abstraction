import { ethers, Transaction } from 'ethers';
import { ProviderWrapper } from 'hardhat/plugins';
import { EIP1193Provider, RequestArguments } from 'hardhat/types';
import init from 'debug';
import { createPublicClient, encodeFunctionData, Hex, getCreateAddress, getCreate2Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { PimlicoBundlerClient } from 'permissionless/clients/pimlico';
import { UserOperation } from 'permissionless/types';
import { signUserOperationHashWithECDSA, getAccountNonce } from './mock';
import * as constants from './constants';
import { Paymaster } from './paymasters';
import { PartialBy } from 'viem/types/utils';
import { bigintToPaddedHex, getSmartAccountData } from './utils';

const log = init('hardhat:plugin:gasless');

getCreate2Address;

// TODO: Test this with value transfers
// TODO: Test this with tx type 0, 1

/**
 * Gasless Provider class that routes transactions through a bundler and paymaster, based on the ERC 4337 standard
 */
export class GaslessProvider extends ProviderWrapper {
  private _expectedDeploymentsToCreateXDeployments: Map<`0x${string}`, `0x${string}`>;

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
    protected readonly _simpleAccountFactoryAddress: `0x${string}`,
    protected _nonce: bigint,
  ) {
    super(_wrappedProvider);

    this._expectedDeploymentsToCreateXDeployments = new Map<`0x${string}`, `0x${string}`>();
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

    const { initCode, senderAddress } = !smartAccount
      ? await getSmartAccountData(publicClient, simpleAccountFactoryAddress, owner.address, entryPoint)
      : ({ initCode: '0x', senderAddress: smartAccount } as {
          initCode: `0x${string}`;
          senderAddress: `0x${string}`;
        });

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
      simpleAccountFactoryAddress,
      nonce,
    );

    return gaslessProvider;
  }

  /**
   * Sends requests to the provider, if the request is a transaction, it will be sent through the bundler and paymaster.
   * If the request is a smart contract address request, it will be queried from the public client and return the smart account address
   * @param args The arguments for the request
   * @returns Unknown, as it depends on the request being made
   */
  public request(args: RequestArguments): Promise<unknown> {
    if (args.method === 'sponsored_getSmartAccountAddress' && args.params !== undefined) {
      const params = this._getParams(args);
      return this._getSmartAccountAddress(params[0]);
    }

    if (args.method === 'eth_sendRawTransaction' && args.params !== undefined) {
      const params = this._getParams(args);
      return this._sendGaslessTransaction(params[0]);
    }

    if (args.method === 'sponsored_getDeploymentFor' && args.params !== undefined) {
      const params = this._getParams(args);
      return this._getDeploymentFor(params[0]);
    }

    // We need to partially overwrite eth_call incase the 'to' field uses an address that was deployed from us
    if (args.method === 'eth_call' && args.params !== undefined) {
      const params = this._getParams(args);

      const newParams = params.map((tx) => {
        const deploymentFromCreateX = this._expectedDeploymentsToCreateXDeployments.get(
          tx.to?.toLowerCase() as `0x${string}`,
        );

        if (deploymentFromCreateX !== undefined) {
          tx.to = deploymentFromCreateX.toLowerCase();
        }

        return tx;
      });

      return this._wrappedProvider.request({ method: 'eth_call', params: newParams });
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

    const originalCalldata: `0x${string}` = parsedTxn.data as `0x${string}`;
    let txnData: `0x${string}` = parsedTxn.data as `0x${string}`;
    let to: `0x${string}` = parsedTxn.to as `0x${string}`;

    // If parsedTxn.to doesnt exist it is a deployment transaction and needs special functionality of sending a transaction to a factory
    if (!parsedTxn.to) {
      to = constants.createXFactory;

      // If it is a contract deployment we will simulate if the contract is ownable by transferring ownership to the smart account, if transferOwnership fails we will do nothing
      const needsHandleOwnable = await this._simulateContractDeploymentIsOwnable(parsedTxn);

      // Create the bytecode to deploy through the CreateXFactory and transfer ownership to the smart account if needed
      txnData = needsHandleOwnable
        ? this._createOwnableDeploymentBytecode(originalCalldata, parsedTxn.value.toBigInt())
        : this._createNonOwnableDeploymentBytecode(originalCalldata);
    }

    // If "to" is a fake address that we deployed customly we will overwrite the "to" param
    const potentialToAddress = this._expectedDeploymentsToCreateXDeployments.get(
      parsedTxn.to?.toLowerCase() as `0x${string}`,
    );
    if (potentialToAddress !== undefined) {
      to = potentialToAddress;
    }

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
      args: [to, parsedTxn.value.toBigInt(), txnData],
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

    // If it was a deployment call we need to get the deployed to address from the logs
    if (!parsedTxn.to) {
      // NOTE: We need to always set the expectedDeployment in lowercase for consistency, our deployment can stay normal cased
      const nonce = await this.publicClient.getTransactionCount({ address: receipt.receipt.from });
      const expectedDeployment = getCreateAddress({
        nonce: BigInt(nonce - 1),
        from: receipt.receipt.from,
      }).toLowerCase() as `0x${string}`;

      receipt.logs.forEach((log) => {
        if (log.address === to) {
          // 1st index of topics is the deployed address
          const paddedAddress = log.topics[1];
          const deployment = ('0x' + paddedAddress.slice(-40)) as `0x${string}`;
          this._expectedDeploymentsToCreateXDeployments.set(expectedDeployment, deployment);
        }
      });
    }

    const txHash = receipt.receipt.transactionHash;
    log('Transaction hash:', txHash);

    // Make a new init code for the next transaction
    this._nonce += 1n;
    // return the tx hash
    return txHash;
  }

  /**
   * Simulate a contract deployment and transferOwnership call to see if its ownable or not
   * @param tx The deployment transaction that gets simulated
   * @returns If the contract is ownable
   */
  private async _simulateContractDeploymentIsOwnable(tx: Transaction): Promise<boolean> {
    const inputData = ethers.utils.defaultAbiCoder.encode(['bytes'], [tx.data]).slice(2);
    tx.data = constants.batchDeployAndTransferOwnershipBytecode.concat(inputData);

    try {
      await this._wrappedProvider.request({
        method: 'eth_call',
        params: [
          {
            from: this.senderAddress,
            data: tx.data,
          },
          'latest',
        ],
      });

      return true;
    } catch (e) {
      // If call fails return false as its not ownable
      return false;
    }
  }

  /**
   * Creates calldata for deploying through CreateXFactory
   * @param deploymentInitCode The contract that we are deploying's init code
   * @returns The calldata to use for the user operation
   */
  private _createNonOwnableDeploymentBytecode(deploymentInitCode: `0x${string}`): `0x${string}` {
    return encodeFunctionData({
      abi: [
        {
          inputs: [
            { name: 'salt', type: 'bytes32' },
            { name: 'initCode', type: 'bytes' },
          ],
          name: 'deployCreate2',
          outputs: [{ name: 'newContract', type: 'address' }],
          stateMutability: 'payable',
          type: 'function',
        },
      ],
      args: [bigintToPaddedHex(this._nonce), deploymentInitCode],
    });
  }

  /**
   * Create the calldata for a traansaction to the CreateXFactory for deploying and transfering ownership
   * @param deploymentInitCode The contract that we are deploying's init code
   * @param constructorAmount The value to send with our deployment
   * @returns The calldata to use for the user operation
   */
  private _createOwnableDeploymentBytecode(
    deploymentInitCode: `0x${string}`,
    constructorAmount: bigint,
  ): `0x${string}` {
    const initFunction = encodeFunctionData({
      abi: [
        {
          inputs: [{ name: 'newOwner', type: 'address' }],
          name: 'transferOwnership',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function',
        },
      ],
      args: [this.senderAddress],
    });

    return encodeFunctionData({
      abi: [
        {
          inputs: [
            { name: 'salt', type: 'bytes32' },
            { name: 'initCode', type: 'bytes' },
            { name: 'data', type: 'bytes' },
            {
              name: 'values',
              type: 'tuple',
              components: [
                {
                  name: 'constructorAmount',
                  type: 'uint256',
                },
                {
                  name: 'initCallAmount',
                  type: 'uint256',
                },
              ],
            },
          ],
          name: 'deployCreate2AndInit',
          outputs: [{ name: 'newContract', type: 'address' }],
          stateMutability: 'payable',
          type: 'function',
        },
      ],
      args: [
        bigintToPaddedHex(this._nonce),
        deploymentInitCode,
        initFunction,
        { constructorAmount, initCallAmount: 0n },
      ],
    });
  }

  /**
   * Gets the deployment for a given contract
   * @param contract Either an object that has the `target` field (this is where ethers stores the address) or just the address
   * @returns The address that was deployed or undefined if no address was deployed
   */
  private async _getDeploymentFor(contract: unknown): Promise<`0x${string}` | undefined> {
    if (!contract) return undefined;

    if (typeof contract === 'object' && 'target' in contract) {
      return this._expectedDeploymentsToCreateXDeployments.get(
        (contract.target as string).toLowerCase() as `0x${string}`,
      );
    } else if (typeof contract === 'string') {
      return this._expectedDeploymentsToCreateXDeployments.get(contract.toLowerCase() as `0x${string}`);
    }

    throw new Error('Invalid type for getting the contract deployment!');
  }

  /*
   * Determines address for a smart account already deployed or to be deployed
   * @param owner The owner of the smart account
   * @returns A promise that resolves to sender address
   */
  private async _getSmartAccountAddress(owner: `0x${string}`): Promise<`0x${string}`> {
    const { senderAddress } = await getSmartAccountData(
      this.publicClient,
      this._simpleAccountFactoryAddress,
      owner,
      this._entryPoint,
    );
    return senderAddress;
  }
}

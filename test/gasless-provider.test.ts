import { assert } from 'chai';
import { GaslessProvider } from '../src/gasless-provider';
import { stub, SinonStub } from 'sinon';
import { createPaymasterClient } from '../src/paymaster';
import { simpleAccountFactoryAddress as constantSimpleAccountFactoryAddress } from '../src/constants';
import { createPublicClient, http } from 'viem';
import { createPimlicoBundlerClient } from 'permissionless/clients/pimlico';
import { PaymasterType } from './types';
import { generatePrivateKey } from 'viem/accounts';
import { EIP1193Provider } from 'hardhat/types';
import { RequestArguments } from 'hardhat/types';
import { mockTxn, mockSponsorResult } from './helpers';
import * as MockPermissionless from '../src/mock';

describe('GaslessProvider', function () {
  let gaslessProvider: GaslessProvider;

  const publicClient = createPublicClient({
    transport: http('http://localhost:3000'),
  });

  const bundlerClient = createPimlicoBundlerClient({
    transport: http('http://localhost:3001'),
  });

  const paymasterClient = createPaymasterClient(
    'pimlico' as PaymasterType,
    'http://localhost:3002',
    bundlerClient,
    undefined,
  );

  const account = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';

  const provider = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    request(args: RequestArguments): Promise<unknown> {
      return Promise.resolve();
    },
  } as EIP1193Provider;

  const supportedEntryPointsStub: SinonStub = stub(bundlerClient, 'supportedEntryPoints');
  const getAccoutntNonceStub: SinonStub = stub(MockPermissionless, 'getAccountNonce');

  let sendUserOpStub: SinonStub;
  let sponsorUserOpStub: SinonStub;
  let chainIdStub: SinonStub;
  let providerRequestStub: SinonStub;
  let estimateFeesPerGasStub: SinonStub;
  let signOpStub: SinonStub;
  let waitForUserOperationReceiptStub: SinonStub;

  before(async function () {
    supportedEntryPointsStub.resolves(['0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789']);
    getAccoutntNonceStub.resolves(BigInt(0));

    gaslessProvider = await GaslessProvider.create(
      generatePrivateKey(),
      provider,
      bundlerClient,
      paymasterClient,
      publicClient,
      constantSimpleAccountFactoryAddress,
      account,
    );

    supportedEntryPointsStub.restore();
    getAccoutntNonceStub.restore();
  });

  beforeEach(async function () {
    sendUserOpStub = stub(bundlerClient, 'sendUserOperation');
    sponsorUserOpStub = stub(paymasterClient, 'sponsorUserOperation');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chainIdStub = stub(gaslessProvider, <any>'getChainId');
    providerRequestStub = stub(provider, 'request');
    estimateFeesPerGasStub = stub(publicClient, 'estimateFeesPerGas');
    signOpStub = stub(MockPermissionless, 'signUserOperationHashWithECDSA');
    waitForUserOperationReceiptStub = stub(bundlerClient, 'waitForUserOperationReceipt');
  });

  afterEach(async function () {
    sendUserOpStub.restore();
    sponsorUserOpStub.restore();
    chainIdStub.restore();
    providerRequestStub.restore();
    estimateFeesPerGasStub.restore();
    signOpStub.restore();
    waitForUserOperationReceiptStub.restore();
  });

  it('Should create a gasless provider', async function () {
    assert.exists(gaslessProvider);
  });

  it('Should not sponsor if request isnt eth_sendRawTransaction', async () => {
    await gaslessProvider.request({ method: 'eth_getBlock', params: ['latest'] });

    assert.isFalse(sendUserOpStub.called);
    assert.isTrue(providerRequestStub.calledWith({ method: 'eth_getBlock', params: ['latest'] }));
  });

  it('Should sponsor the user operation if request is eth_sendRawTransaction', async () => {
    sendUserOpStub.resolves('0x');
    chainIdStub.resolves(1);
    sponsorUserOpStub.resolves(mockSponsorResult);
    estimateFeesPerGasStub.resolves({ maxFeePerGas: 1, maxPriorityFeePerGas: 1 });
    signOpStub.resolves(mockTxn);
    waitForUserOperationReceiptStub.resolves({ receipt: { transactionHash: '0x000' } });

    await gaslessProvider.request({ method: 'eth_sendRawTransaction', params: [mockTxn] });

    assert.isTrue(sendUserOpStub.calledOnce);
    assert.isTrue(sponsorUserOpStub.calledOnce);
    assert.isTrue(chainIdStub.calledOnce);
    assert.isTrue(providerRequestStub.calledOnce);
    assert.isTrue(estimateFeesPerGasStub.calledOnce);
    assert.isTrue(signOpStub.calledOnce);
    assert.isTrue(waitForUserOperationReceiptStub.calledOnce);
  });
});

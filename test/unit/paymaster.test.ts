import { assert } from 'chai';
import { createPimlicoBundlerClient } from 'permissionless/clients/pimlico';
import { http } from 'viem';
import { JsonRpcProvider } from '@ethersproject/providers';
import { createPaymasterClient } from '../../src/paymaster';
import { PaymasterType } from '../../src/types';
import * as Pm from '../../src/paymasters';

describe('Paymaster Construction', function () {
  const bundlerClient = createPimlicoBundlerClient({
    transport: http('http://localhost:3001'),
  });

  const endpoint = 'http://localhost:3002';

  it('Should create a  pimlico paymaster client', function () {
    const paymasterClient = createPaymasterClient(
      'pimlico' as PaymasterType,
      endpoint,
      bundlerClient,
      undefined,
    ) as Pm.PimlicoPaymaster;

    assert.isTrue(paymasterClient instanceof Pm.PimlicoPaymaster);
    assert.isTrue(paymasterClient.endpoint instanceof JsonRpcProvider);
    assert.equal(paymasterClient.endpoint.connection.url, endpoint);
    assert.equal(paymasterClient.policyId, undefined);
  });

  it('Should create a  stackup paymaster client', function () {
    const paymasterClient = createPaymasterClient('stackup' as PaymasterType, endpoint, bundlerClient, undefined);

    assert.isTrue(paymasterClient instanceof Pm.StackUpPaymaster);
    assert.isTrue(paymasterClient.endpoint instanceof JsonRpcProvider);
    assert.equal(paymasterClient.endpoint.connection.url, endpoint);
  });

  it('Should create a  base paymaster client', function () {
    const paymasterClient = createPaymasterClient(PaymasterType.Base, endpoint, bundlerClient, undefined);

    assert.isTrue(paymasterClient instanceof Pm.BasePaymaster);
    assert.isTrue(paymasterClient.endpoint instanceof JsonRpcProvider);
    assert.equal(paymasterClient.endpoint.connection.url, endpoint);
  });

  it('Should create a  alchemy paymaster client', function () {
    const paymasterClient = createPaymasterClient(
      'alchemy' as PaymasterType,
      endpoint,
      bundlerClient,
      'test',
    ) as Pm.AlchemyPaymaster;

    assert.isTrue(paymasterClient instanceof Pm.AlchemyPaymaster);
    assert.isTrue(paymasterClient.endpoint instanceof JsonRpcProvider);
    assert.equal(paymasterClient.endpoint.connection.url, endpoint);
    assert.equal(paymasterClient.policyId, 'test');
  });

  it('Should fail to  create a  alchemy paymaster client if there is no policy id', function () {
    assert.throws(() => {
      createPaymasterClient('alchemy' as PaymasterType, endpoint, bundlerClient, undefined);
    }, 'Policy ID is required for Alchemy Paymaster');
  });
});

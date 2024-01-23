import { assert } from 'chai';
import { createPaymasterClient } from '../src/paymaster';
import { PaymasterType } from './types';
import { createPimlicoBundlerClient } from 'permissionless/clients/pimlico';
import { http } from 'viem';
import * as Pm from '../src/paymasters';

describe('Paymaster Construction', function () {
  const bundlerClient = createPimlicoBundlerClient({
    transport: http('http://localhost:3001'),
  });

  const endpoint = 'http://localhost:3002';

  it('Should create a  pimlico paymaster client', function () {
    const paymasterClient = createPaymasterClient('pimlico' as PaymasterType, endpoint, bundlerClient, undefined);

    assert.isTrue(paymasterClient instanceof Pm.PimlicoPaymaster);
  });

  it('Should create a  stackup paymaster client', function () {
    const paymasterClient = createPaymasterClient('stackup' as PaymasterType, endpoint, bundlerClient, undefined);

    assert.isTrue(paymasterClient instanceof Pm.StackUpPaymaster);
  });

  it('Should create a  base paymaster client', function () {
    const paymasterClient = createPaymasterClient('base' as PaymasterType, endpoint, bundlerClient, undefined);

    assert.isTrue(paymasterClient instanceof Pm.BasePaymaster);
  });

  it('Should create a  alchemy paymaster client', function () {
    const paymasterClient = createPaymasterClient('alchemy' as PaymasterType, endpoint, bundlerClient, 'test');

    assert.isTrue(paymasterClient instanceof Pm.AlchemyPaymaster);
  });

  it('Should fail to  create a  alchemy paymaster client if there is no policy id', function () {
    assert.throws(() => {
      createPaymasterClient('alchemy' as PaymasterType, endpoint, bundlerClient, undefined);
    }, 'Policy ID is required for Alchemy Paymaster');
  });

  it('Should fail to  create a  unknown paymaster client', function () {
    assert.throws(() => {
      createPaymasterClient('unknown' as PaymasterType, endpoint, bundlerClient, undefined);
    }, 'Unknown paymaster type unknown');
  });
});

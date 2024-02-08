import { assert } from 'chai';
import { interpretPaymasterType } from '../../src/interpreter';
import { PaymasterType } from '../../src/types';

describe('Interpreter', function () {
  it('Should revert if an unknown paymaster url is provided', function () {
    assert.throws(() => {
      interpretPaymasterType('http://localhost:3001');
    }, 'Unknown paymaster type for url http://localhost:3001');
  });

  it('Shoulld revert if input is not a url', function () {
    assert.throws(() => {
      interpretPaymasterType('not a url');
    }, 'Invalid paymaster url');
  });

  it('Should interpret the paymaster type as base', function () {
    const result = interpretPaymasterType('http://localhost:3001/paymaster.base');
    assert.equal(result, PaymasterType.Base);
  });

  it('Should interpret the paymaster type as stackup', function () {
    const result = interpretPaymasterType('http://localhost:3001/stackup');
    assert.equal(result, PaymasterType.StackUp);
  });

  it('Should interpret the paymaster type as alchemy', function () {
    const result = interpretPaymasterType('http://localhost:3001/alchemy');
    assert.equal(result, PaymasterType.Alchemy);
  });

  it('Should interpret the paymaster type as pimlico', function () {
    const result = interpretPaymasterType('http://localhost:3001/pimlico');
    assert.equal(result, PaymasterType.Pimlico);
  });
});

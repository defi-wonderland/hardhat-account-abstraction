import { assert } from 'chai';
import { http } from 'viem';
import { createPimlicoBundlerClient } from 'permissionless/clients/pimlico';
import { PaymasterType } from '../../src/types';
import { StackUpPaymaster } from '../../src/paymasters/StackUpPaymaster';
import { createPaymasterClient } from '../../src/paymaster';
import { mockUserOperation, mockEntryPoint, mockSponsorReturnType } from '../helpers';
import { stub, SinonStub } from 'sinon';

describe('StackUp Paymaster', function () {
  const bundlerClient = createPimlicoBundlerClient({
    transport: http('http://localhost:3001'),
  });

  const endpoint = 'http://localhost:3002';

  const paymasterClient = createPaymasterClient(
    'stackup' as PaymasterType,
    endpoint,
    bundlerClient,
    undefined,
  ) as StackUpPaymaster;

  let paymasterSponsorStub: SinonStub;

  beforeEach(() => {
    paymasterSponsorStub = stub(paymasterClient.paymasterClient, 'sponsorUserOperation');
  });

  afterEach(() => {
    paymasterSponsorStub.restore();
  });

  it('Should sponsor a valid user operation', async function () {
    paymasterSponsorStub.resolves(mockSponsorReturnType);

    const result = await paymasterClient.sponsorUserOperation(mockUserOperation, mockEntryPoint);

    assert.equal(result, mockSponsorReturnType);
    assert.isTrue(paymasterSponsorStub.calledOnce);
    assert.isTrue(
      paymasterSponsorStub.calledWith({
        userOperation: mockUserOperation,
        entryPoint: mockEntryPoint,
        context: {
          type: 'payg',
        },
      }),
    );
  });
});

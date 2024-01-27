import { assert } from 'chai';
import { http } from 'viem';
import { createPimlicoBundlerClient } from 'permissionless/clients/pimlico';
import { PaymasterType } from '../../src/types';
import { PimlicoPaymaster } from '../../src/paymasters/PimlicoPaymaster';
import { createPaymasterClient } from '../../src/paymaster';
import { mockUserOperation, mockEntryPoint, mockSponsorReturnType } from '../helpers';
import { stub, SinonStub } from 'sinon';

describe('Pimlico Paymaster', function () {
  const bundlerClient = createPimlicoBundlerClient({
    transport: http('http://localhost:3001'),
  });

  const endpoint = 'http://localhost:3002';

  const paymasterClient = createPaymasterClient(
    'pimlico' as PaymasterType,
    endpoint,
    bundlerClient,
    undefined,
  ) as PimlicoPaymaster;

  const paymasterClientWithPolicyId = createPaymasterClient(
    'pimlico' as PaymasterType,
    endpoint,
    bundlerClient,
    'test',
  ) as PimlicoPaymaster;

  let paymasterSponsorStub: SinonStub;
  let paymasterSponsorStubWithPolicyId: SinonStub;

  beforeEach(() => {
    paymasterSponsorStub = stub(paymasterClient.paymasterClient, 'sponsorUserOperation');
    paymasterSponsorStubWithPolicyId = stub(paymasterClientWithPolicyId.paymasterClient, 'sponsorUserOperation');
  });

  afterEach(() => {
    paymasterSponsorStub.restore();
    paymasterSponsorStubWithPolicyId.restore();
  });

  it('Should sponsor a valid user operation with no sponsor id', async function () {
    paymasterSponsorStub.resolves(mockSponsorReturnType);

    const result = await paymasterClient.sponsorUserOperation(mockUserOperation, mockEntryPoint);

    assert.equal(result, mockSponsorReturnType);
    assert.isTrue(paymasterSponsorStub.calledOnce);
    assert.isTrue(
      paymasterSponsorStub.calledWith({
        userOperation: mockUserOperation,
        entryPoint: mockEntryPoint,
        sponsorshipPolicyId: undefined,
      }),
    );
  });

  it('Should sponsor a valid user operation with a sponsor id', async function () {
    paymasterSponsorStubWithPolicyId.resolves(mockSponsorReturnType);

    const result = await paymasterClientWithPolicyId.sponsorUserOperation(mockUserOperation, mockEntryPoint);

    assert.equal(result, mockSponsorReturnType);
    assert.isTrue(paymasterSponsorStubWithPolicyId.calledOnce);
    assert.isTrue(
      paymasterSponsorStubWithPolicyId.calledWith({
        userOperation: mockUserOperation,
        entryPoint: mockEntryPoint,
        sponsorshipPolicyId: 'test',
      }),
    );
  });
});

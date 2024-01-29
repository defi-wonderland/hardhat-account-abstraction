import { assert } from 'chai';
import { http } from 'viem';
import { createPimlicoBundlerClient } from 'permissionless/clients/pimlico';
import { PaymasterType } from '../../../src/types';
import { createPaymasterClient } from '../../../src/paymaster';
import { mockUserOperation, mockEntryPoint, mockSponsorReturnType } from '../../helpers';
import { stub, SinonStub } from 'sinon';
import { AlchemyPaymaster } from '../../../src/paymasters/AlchemyPaymaster';
import { convertBigIntsToString } from '../../../src/utils';

describe('Alchemy Paymaster', function () {
  const bundlerClient = createPimlicoBundlerClient({
    transport: http('http://localhost:3001'),
  });

  const endpoint = 'http://localhost:3002';

  const paymasterClientWithPolicyId = createPaymasterClient(
    'alchemy' as PaymasterType,
    endpoint,
    bundlerClient,
    'test',
  ) as AlchemyPaymaster;

  let paymasterSponsorStubWithPolicyId: SinonStub;

  beforeEach(() => {
    paymasterSponsorStubWithPolicyId = stub(paymasterClientWithPolicyId.endpoint, 'send');
  });

  afterEach(() => {
    paymasterSponsorStubWithPolicyId.restore();
  });

  it('Should sponsor a valid user operation with a sponsor id', async function () {
    paymasterSponsorStubWithPolicyId.resolves(mockSponsorReturnType);

    const result = await paymasterClientWithPolicyId.sponsorUserOperation(mockUserOperation, mockEntryPoint);

    assert.deepEqual(result, mockSponsorReturnType);
    assert.isTrue(paymasterSponsorStubWithPolicyId.calledOnce);
    assert.isTrue(
      paymasterSponsorStubWithPolicyId.calledWith('alchemy_requestGasAndPaymasterAndData', [
        {
          policyId: 'test',
          entryPoint: mockEntryPoint,
          dummySignature: mockUserOperation.signature,
          userOperation: convertBigIntsToString(mockUserOperation),
        },
      ]),
    );
  });
});

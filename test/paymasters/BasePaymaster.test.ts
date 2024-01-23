import { assert } from 'chai';
import { http } from 'viem';
import { createPimlicoBundlerClient } from 'permissionless/clients/pimlico';
import { PaymasterType } from '../../src/types';
import { BasePaymaster } from '../../src/paymasters/BasePaymaster';
import { createPaymasterClient } from '../../src/paymaster';
import { mockUserOperation, mockEntryPoint, mockSponsorReturnType } from '../helpers';
import { stub, SinonStub } from 'sinon';
import { convertBigIntsToString } from '../../src/utils';

describe('Base Paymaster', function () {
  const bundlerClient = createPimlicoBundlerClient({
    transport: http('http://localhost:3001'),
  });

  const endpoint = 'http://localhost:3002';

  const paymasterClient = createPaymasterClient(
    'base' as PaymasterType,
    endpoint,
    bundlerClient,
    undefined,
  ) as BasePaymaster;

  let paymasterSponsorStub: SinonStub;
  let estimateUserOperationGasStub: SinonStub;
  let chainIdStub: SinonStub;

  const mockGasConfig = {
    preVerificationGas: 10000n,
    verificationGasLimit: 10000n,
    callGasLimit: 10000n,
  };

  beforeEach(() => {
    paymasterSponsorStub = stub(paymasterClient.endpoint, 'send');
    estimateUserOperationGasStub = stub(bundlerClient, 'estimateUserOperationGas');
    chainIdStub = stub(bundlerClient, 'chainId');
  });

  afterEach(() => {
    paymasterSponsorStub.restore();
    estimateUserOperationGasStub.restore();
    chainIdStub.restore();
  });

  it('Should sponsor a valid user operation', async function () {
    const paymasterAndData = '0x123';

    paymasterSponsorStub.onFirstCall().resolves(paymasterAndData);
    paymasterSponsorStub.onSecondCall().resolves(paymasterAndData);
    estimateUserOperationGasStub.resolves(mockGasConfig);
    chainIdStub.resolves(1);

    const userOp = convertBigIntsToString(mockUserOperation);

    const result = await paymasterClient.sponsorUserOperation(mockUserOperation, mockEntryPoint);

    const expectedResult = {
      ...mockGasConfig,
      paymasterAndData: paymasterAndData,
    };

    assert.deepEqual(result, expectedResult);
    assert.isTrue(paymasterSponsorStub.calledTwice);
    assert.isTrue(
      paymasterSponsorStub.calledWith('eth_paymasterAndDataForEstimateGas', [userOp, mockEntryPoint, '0x1']),
    );
    assert.isTrue(
      paymasterSponsorStub.calledWith('eth_paymasterAndDataForUserOperation', [
        Object.assign(userOp, convertBigIntsToString(mockGasConfig)),
        mockEntryPoint,
        '0x1',
      ]),
    );
  });
});

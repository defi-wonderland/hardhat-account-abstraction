import { resetHardhatContext } from 'hardhat/plugins-testing';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import path from 'path';
import { Hex } from 'viem';
import { dummySignature } from '../src/constants';
import { PartialUserOperation } from '../src/types';
import { SponsorUserOperationReturnType } from 'permissionless/actions/pimlico';
import { exec } from 'child_process';

declare module 'mocha' {
  interface Context {
    hre: HardhatRuntimeEnvironment;
  }
}

// Mock string for a transaction
export const mockTxn =
  '0x02f89283aa36a7808459682f0085184478a9c48253109416f63c5036d3f48a239358656a8f123ece85789c80a4a0712d680000000000000000000000000000000000000000000000005fc1b97136320000c001a032427c034049c7d7743a198273d170b6a38ee476715903ac8bd79aa3d32ec8fba054a6a5763ee6561d7dc168639f858057679882d534f169de379e144a2d96e32a';

export const mockSponsorResult = {
  paymasterAndData:
    '0x02f89283aa36a7808459682f0085184478a9c48253109416f63c5036d3f48a239358656a8f123ece85789c80a4a0712d680000000000000000',
  preVerificationGas: 100000n,
  verificationGasLimit: 100000n,
  callGasLimit: 100000n,
};

export const mockUserOperation: PartialUserOperation = {
  sender: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
  nonce: 0n,
  initCode: '0x',
  callData: '0x',
  maxFeePerGas: 1n,
  maxPriorityFeePerGas: 1n,
  // dummy signature, needs to be there so the SimpleAccount doesn't immediately revert because of invalid signature length
  signature: dummySignature as Hex,
};

export const mockSponsorReturnType: SponsorUserOperationReturnType = {
  paymasterAndData: '0x',
  preVerificationGas: 1n,
  verificationGasLimit: 1n,
  callGasLimit: 1n,
};

export const mockEntryPoint = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';

export function useEnvironment(fixtureProjectName: string) {
  before('Loading hardhat environment', async function () {
    process.chdir(path.join(__dirname, 'fixture-projects', fixtureProjectName));

    // If doing integration testing we need to compile the contracts
    if (fixtureProjectName === 'integration') {
      await compileHardhatProject();
    }

    this.hre = require('hardhat');
  });

  after('Resetting hardhat', function () {
    resetHardhatContext();
  });
}

function compileHardhatProject(): Promise<string> {
  return new Promise((resolve, reject) => {
    exec('npx hardhat compile', (error, stdout, stderr) => {
      if (error) {
        throw new Error(`exec error: ${error}`);
      }

      if (stderr) {
        throw new Error(`stderr: ${stderr}`);
      }

      resolve(stdout);
    });
  });
}

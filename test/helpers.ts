import { resetHardhatContext } from 'hardhat/plugins-testing';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import path from 'path';

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

export function useEnvironment(fixtureProjectName: string) {
  beforeEach('Loading hardhat environment', function () {
    process.chdir(path.join(__dirname, 'fixture-projects', fixtureProjectName));

    this.hre = require('hardhat');
  });

  afterEach('Resetting hardhat', function () {
    resetHardhatContext();
  });
}

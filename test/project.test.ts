import { assert } from 'chai';

import { useEnvironment } from './helpers';

describe('Integration tests examples', function () {
  describe('HardhatConfig extension', function () {
    useEnvironment('hardhat-project');

    it('Should add the bundlerUrl to the config', function () {
      assert.equal(this.hre.config.networks.localhost.sponsoredTransactions?.bundlerUrl, 'http://localhost:3000');
    });

    it('Should add the paymasterUrl to the config', function () {
      assert.equal(this.hre.config.networks.localhost.sponsoredTransactions?.paymasterUrl, 'http://localhost:3001');
    });

    it('Should add the paymasterType to the config', function () {
      assert.equal(this.hre.config.networks.localhost.sponsoredTransactions?.paymasterType, 'pimlico');
    });
  });
});

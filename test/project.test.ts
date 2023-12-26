import { assert } from 'chai';

import { useEnvironment } from './helpers';

describe('Integration tests examples', function () {
  describe('HardhatConfig extension', function () {
    useEnvironment('hardhat-project');

    it('Should add the pimlicoApiKey to the config', function () {
      assert.equal(this.hre.config.networks.localhost.pimlicoApiKey, 'foo');
    });

    it('Should add the entryPoint to the config', function () {
      assert.equal(this.hre.config.networks.localhost.entryPoint, '0x0576a174D229E3cFA37253523E645A78A0C91B57');
    });
  });
});

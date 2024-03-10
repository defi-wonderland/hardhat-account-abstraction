import { assert } from 'chai';

import { useEnvironment } from '../helpers';

describe('Integration tests examples', function () {
  describe('HardhatConfig extension', function () {
    useEnvironment('unit');

    it('Should add the bundlerUrl to the config', function () {
      assert.equal(this.hre.config.networks.localhost.accountAbstraction?.bundlerUrl, 'http://localhost:3000');
    });

    it('Should add the paymasterUrl to the config', function () {
      assert.equal(this.hre.config.networks.localhost.accountAbstraction?.paymasterUrl, 'http://localhost:3001');
    });
  });
});

import 'dotenv/config';
import { assert } from 'chai';
import { useEnvironment } from '../helpers';

describe('Integration deployments', function () {
  useEnvironment('integration');

  it('Should deploy a non ownable contract', async function () {
    const nonOwnableContract = await this.hre.ethers.deployContract('NonOwnableContract');

    const deploymentAddress = await this.hre.network.provider.request({
      method: 'aa_getDeploymentFor',
      params: [nonOwnableContract.target],
    });

    // Mock function in contract
    const returns100 = await nonOwnableContract.returns100();

    assert.equal(returns100, 100);
    assert.isTrue(deploymentAddress !== undefined);
  });

  it('Should deploy an ownable contract', async function () {
    const smartAccount = await this.hre.network.provider.request({
      method: 'aa_getSmartAccountAddress',
      params: [],
    });

    const ownableContract = await this.hre.ethers.deployContract('OwnableContract');

    const deploymentAddress = await this.hre.network.provider.request({
      method: 'aa_getDeploymentFor',
      params: [ownableContract.target],
    });

    const owner = await ownableContract.owner();

    assert.equal(owner, smartAccount);
    assert.isTrue(deploymentAddress !== undefined);
  });
});

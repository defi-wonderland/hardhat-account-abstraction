import { assert } from 'chai';
import { useEnvironment } from '../helpers';
import { TEST_TOKEN_ABI, tokenAddr, entryPoint } from '../test-constants';
import 'dotenv/config';

describe('Integration transactions', function () {
  useEnvironment('integration');

  it('Should send a transaction', async function () {
    const signer = await this.hre.ethers.provider.getSigner();
    const smartAccount = await this.hre.network.provider.request({
      method: 'sponsored_getSmartAccountAddress',
      params: [await signer.getAddress()],
    });

    const testToken = new this.hre.ethers.Contract(tokenAddr, TEST_TOKEN_ABI, signer);
    const amountToMint = this.hre.ethers.parseEther('6.9');
    const receipt = await testToken.mint(amountToMint);
    const balanceOf = await testToken.balanceOf(smartAccount);

    assert.equal(receipt.to, entryPoint);
    assert.equal(balanceOf.toString(), amountToMint.toString());
  });

  it('Should transfer tokens from the smart account', async function () {
    const signer = await this.hre.ethers.provider.getSigner();
    const signerAddr = await signer.getAddress();
    const smartAccount = await this.hre.network.provider.request({
      method: 'sponsored_getSmartAccountAddress',
      params: [signerAddr],
    });

    const testToken = new this.hre.ethers.Contract(tokenAddr, TEST_TOKEN_ABI, signer);
    const amountToTransfer = this.hre.ethers.parseEther('1.0');

    const receipt = await testToken.transfer(signerAddr, amountToTransfer);
    const balanceOf = await testToken.balanceOf(signerAddr);

    assert.equal(receipt.to, entryPoint);
    assert.equal(balanceOf.toString(), amountToTransfer.toString());
  });
});

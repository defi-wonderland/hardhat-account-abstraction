import 'dotenv/config';
import { assert } from 'chai';
import { Contract } from 'ethers';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';
import { useEnvironment } from '../helpers';
import { TEST_TOKEN_ABI, TOKEN_ADDR, ENTRY_POINT } from '../test-constants';

describe('Integration transactions', function () {
  useEnvironment('integration');

  let signer: HardhatEthersSigner;
  let signerAddress: string;
  let testToken: Contract;

  before(async function () {
    signer = await this.hre.ethers.provider.getSigner();
    signerAddress = await signer.getAddress();
    testToken = new this.hre.ethers.Contract(TOKEN_ADDR, TEST_TOKEN_ABI, signer);
  });

  it('Should send a transaction', async function () {
    const smartAccount = await this.hre.network.provider.request({
      method: 'sponsored_getSmartAccountAddress',
      params: [signerAddress],
    });

    const testToken = new this.hre.ethers.Contract(TOKEN_ADDR, TEST_TOKEN_ABI, signer);
    const amountToMint = this.hre.ethers.parseEther('6.9');
    const receipt = await testToken.mint(amountToMint);
    const balanceOf = await testToken.balanceOf(smartAccount);

    assert.equal(receipt.to, ENTRY_POINT);
    assert.equal(balanceOf.toString(), amountToMint.toString());
  });

  it('Should transfer tokens from the smart account', async function () {
    const signer = await this.hre.ethers.provider.getSigner();

    const testToken = new this.hre.ethers.Contract(TOKEN_ADDR, TEST_TOKEN_ABI, signer);
    const amountToTransfer = this.hre.ethers.parseEther('1.0');

    const receipt = await testToken.transfer(signerAddress, amountToTransfer);
    const balanceOf = await testToken.balanceOf(signerAddress);

    assert.equal(receipt.to, ENTRY_POINT);
    assert.equal(balanceOf.toString(), amountToTransfer.toString());
  });
});

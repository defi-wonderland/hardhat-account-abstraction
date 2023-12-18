import { ethers } from "ethers";
import { ProviderWrapper } from "hardhat/plugins";
import { EIP1193Provider, RequestArguments } from "hardhat/types";
import init from "debug";
import axios, { AxiosInstance } from "axios";
import {
  SIGNATURE_PROXY_ABI,
  SIGNATURE_PROXY_FACTORY_ADDRESS,
  SIGNATURE_PROXY_CHILD_INIT_CODE,
} from "./constants";

const log = init("hardhat:plugin:gasless");

// TODO: Using wallets with no ETH does not work
// TODO: Test this with value transfers
// TODO: Test this with tx type 0, 1
export class GaslessProvider extends ProviderWrapper {
  private readonly _sponsorAPI: AxiosInstance;

  constructor(
    protected readonly _signerPk: string,
    protected readonly _wrappedProvider: EIP1193Provider,
    public readonly sponsorUrl: string,
  ) {
    super(_wrappedProvider);

    this._sponsorAPI = axios.create({ baseURL: this.sponsorUrl });
  }

  public request(args: RequestArguments): Promise<unknown> {
    if (args.method === "eth_sendRawTransaction" && args.params !== undefined) {
      const params = this._getParams(args);
      return this._sendGaslessTransaction(params[0]);
    }

    return this._wrappedProvider.request(args);
  }

  public async _sendGaslessTransaction(tx: string): Promise<string> {
    const signer = new ethers.Wallet(this._signerPk);

    log("Transaction to be signed for sponsoring", tx);
    const { to, data } = ethers.utils.parseTransaction(tx);

    const value = 0;
    const chainId = await this.getChainId();
    const proxyAddress = this.getProxyAddress(signer.address);
    log("Signer computed proxy address", proxyAddress);

    let nextNonce = 0;
    const isProxyDeployed = await this.isContractDeployed(proxyAddress);
    if (isProxyDeployed) {
      nextNonce = await this.getProxyNextNonce(proxyAddress);
      log(`Proxy is deployed and its next nonce is ${nextNonce}`);
    }

    log("Signing message for sponsoring", {
      signer: signer.address,
      to,
      data,
      value,
      chainId,
      nonce: nextNonce,
    });
    const signature = await this.encodeMessage(
      signer,
      to as string,
      data,
      value,
      chainId,
      nextNonce,
    );

    // call the API
    const request = {
      from: signer.address,
      to: to,
      data: data,
      value,
      ...signature,
    };
    log("Sending request to sponsor", { sponsor: this.sponsorUrl, request });
    const sponsorResponse = await this._sponsorAPI.post<string[]>(
      "/tx-signature",
      [request],
    );
    const txHash = sponsorResponse.data[0];
    log("Received tx hash from sponsor", txHash);

    // return the tx hash
    return txHash;
  }

  private async getChainId(): Promise<number> {
    const rawChainId = (await this._wrappedProvider.request({
      method: "eth_chainId",
      params: [],
    })) as string;
    return parseInt(rawChainId);
  }

  private getProxyAddress(signer: string): string {
    return ethers.utils.getCreate2Address(
      SIGNATURE_PROXY_FACTORY_ADDRESS,
      ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(["address"], [signer]),
      ),
      ethers.utils.solidityKeccak256(
        ["bytes"],
        [SIGNATURE_PROXY_CHILD_INIT_CODE],
      ),
    );
  }

  private async isContractDeployed(address: string): Promise<boolean> {
    const code = await this._wrappedProvider.request({
      method: "eth_getCode",
      params: [address, "latest"],
    });
    return code !== "0x";
  }

  private async getProxyNextNonce(address: string): Promise<number> {
    const proxy = new ethers.Contract(address, SIGNATURE_PROXY_ABI);
    const populatedNonceFetch = await proxy.populateTransaction.nextNonce();
    const rawNonce = (await this._wrappedProvider.request({
      method: "eth_call",
      params: [populatedNonceFetch, "latest"],
    })) as string;
    return parseInt(rawNonce);
  }

  private async encodeMessage(
    signer: ethers.Wallet,
    to: string,
    data: string,
    value: number,
    chainId: number,
    nonce: number,
  ): Promise<{ r: string; s: string; v: number }> {
    const encodedMessage = ethers.utils.defaultAbiCoder.encode(
      ["address", "bytes", "uint256", "uint256", "uint256"],
      [to, data, value, chainId, nonce],
    );
    log("Encoding message", {
      to,
      data,
      value,
      chainId,
      nonce,
    });
    const digest = ethers.utils.keccak256(encodedMessage);
    const rawSignature = await ethers.utils.joinSignature(
      signer._signingKey().signDigest(toEthSignedMessageHash(digest)),
    );
    const { r, s, v } = ethers.utils.splitSignature(rawSignature);
    return { r, s, v };
  }
}

function toEthSignedMessageHash(messageHash: string): string {
  const prefix = ethers.utils.toUtf8Bytes("\x19Ethereum Signed Message:\n32");
  return ethers.utils.keccak256(ethers.utils.concat([prefix, messageHash]));
}

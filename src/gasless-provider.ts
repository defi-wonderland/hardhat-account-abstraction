import { ProviderWrapper } from "hardhat/plugins";
import { EIP1193Provider, RequestArguments } from "hardhat/types";

export class GaslessProvider extends ProviderWrapper {
  constructor(
    protected readonly _wrappedProvider: EIP1193Provider,
    public readonly sponsorUrl: string,
  ) {
    super(_wrappedProvider);
  }

  public request(args: RequestArguments): Promise<unknown> {
    if (args.method === "eth_sendTransaction" && args.params !== undefined) {
      const params = this._getParams(args);
      return this._sendGaslessTransaction(params[0]);
    }

    return this._wrappedProvider.request(args);
  }

  public async _sendGaslessTransaction(tx: any): Promise<string> {
    // Sign using the warpped provider
    // Which signer should be used? the first account?
    const signature = await this._wrappedProvider.request({
      method: "eth_sign",
      params: ["TBD"],
    });

    // call the API

    // return the tx hash

    return "0x1234567890123456789012345678901234567890123456789012345678901234";
  }
}

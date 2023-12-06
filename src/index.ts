import { extendProvider } from "hardhat/config";

import init from "debug";

const log = init("hardhat:plugin:gasless");

import "./type-extensions";
import { GaslessProvider } from "./gasless-provider";

extendProvider((provider, config, networkName) => {
  log(`Extending provider for network ${networkName}`);

  const netConfig = config.networks[networkName];
  // TODO: support mnemonics
  if (!Array.isArray(netConfig.accounts)) {
    log(`Mnemonics are not yet supported, skipping`);
    return provider;
  }
  const signer: string = netConfig.accounts[0] as string;

  if (!("url" in netConfig)) {
    log(`Hardhat Network detected, skipping`);
    return provider;
  }

  const sponsorUrl = netConfig.sponsorUrl;
  if (sponsorUrl === undefined) {
    log(`No sponsor url, skipping`);
    return provider;
  }

  return new GaslessProvider(signer, provider, sponsorUrl);
});

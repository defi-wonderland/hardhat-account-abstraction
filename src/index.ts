import { extendProvider } from "hardhat/config";

import init from "debug";

const log = init("hardhat:plugin:gasless");

import "./type-extensions";
import { GaslessProvider } from "./gasless-provider";

extendProvider((provider, config, networkName) => {
  log(`Extending provider for network ${networkName}`);

  const netConfig = config.networks[networkName];

  if (!("url" in netConfig)) {
    log(`Hardhat Network detected, skipping`);
    return provider;
  }

  const sponsorUrl = netConfig.sponsorUrl;
  if (sponsorUrl === undefined) {
    log(`No sponsor url, skipping`);
    return provider;
  }

  return new GaslessProvider(provider, sponsorUrl);
});

import { extendProvider } from 'hardhat/config';
import { createPublicClient, http } from 'viem';
import { createPimlicoPaymasterClient, createPimlicoBundlerClient } from 'permissionless/clients/pimlico';

import 'dotenv/config';

import init from 'debug';

const log = init('hardhat:plugin:gasless');

import './type-extensions';
import { GaslessProvider } from './gasless-provider';

// NOTE: Network name has to match how pimlico names the network in their API calls
extendProvider(async (provider, config, networkName) => {
  log(`Extending provider for network ${networkName}`);

  const netConfig = config.networks[networkName];
  // TODO: support mnemonics
  if (!Array.isArray(netConfig.accounts)) {
    log(`Mnemonics are not yet supported, skipping`);
    return provider;
  }
  const signer = netConfig.accounts[0] as `0x${string}`;

  if (!('url' in netConfig)) {
    log(`Hardhat Network detected, skipping`);
    return provider;
  }

  const pimlicoApiKey = netConfig.pimlicoApiKey;
  if (pimlicoApiKey === undefined) {
    log(`No pimlico api key, skipping`);
    return provider;
  }

  const publicClient = createPublicClient({
    transport: http(netConfig.url),
  });

  const bundlerClient = createPimlicoBundlerClient({
    transport: http(`https://api.pimlico.io/v1/${networkName}/rpc?apikey=${pimlicoApiKey}`),
  });

  const paymasterClient = createPimlicoPaymasterClient({
    transport: http(`https://api.pimlico.io/v2/${networkName}/rpc?apikey=${pimlicoApiKey}`),
  });

  return new GaslessProvider(
    signer,
    provider,
    networkName,
    pimlicoApiKey,
    bundlerClient,
    paymasterClient,
    publicClient,
  );
});

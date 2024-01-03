import { extendProvider } from 'hardhat/config';
import { createPublicClient, http } from 'viem';
import { createPimlicoBundlerClient } from 'permissionless/clients/pimlico';
import { createPaymasterClient } from './paymaster';

import 'dotenv/config';

import init from 'debug';

const log = init('hardhat:plugin:gasless');

import './type-extensions';
import { GaslessProvider } from './gasless-provider';
import { PaymasterType } from './types';

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

  const sponsoredTransaction = netConfig.sponsoredTransaction;
  if (sponsoredTransaction === undefined) {
    log(`No configuration for sponsored transactions set, skipping`);
    return provider;
  }

  const publicClient = createPublicClient({
    transport: http(netConfig.url),
  });

  const bundlerClient = createPimlicoBundlerClient({
    transport: http(sponsoredTransaction.bundlerUrl),
  });

  const paymasterClient = createPaymasterClient(
    sponsoredTransaction.paymasterType as PaymasterType,
    sponsoredTransaction.paymasterUrl,
  );

  return await GaslessProvider.create(signer, provider, networkName, bundlerClient, paymasterClient, publicClient);
});

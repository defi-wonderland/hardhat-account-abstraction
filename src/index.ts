import { extendProvider } from 'hardhat/config';
import { createPublicClient, http } from 'viem';
import { createPimlicoBundlerClient } from 'permissionless/clients/pimlico';
import { createPaymasterClient } from './paymaster';
import { simpleAccountFactoryAddress as constantSimpleAccountFactoryAddress } from './constants';
import { GaslessProvider } from './gasless-provider';
import { PaymasterType } from './types';
import init from 'debug';
import 'dotenv/config';
import './type-extensions';

const log = init('hardhat:plugin:gasless');

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

  const sponsoredTransaction = netConfig.sponsoredTransactions;
  if (!sponsoredTransaction) {
    log(`No configuration for sponsored transactions set, skipping`);
    return provider;
  }

  const simpleAccountFactoryAddress =
    sponsoredTransaction.simpleAccountFactoryAddress ?? constantSimpleAccountFactoryAddress;

  const publicClient = createPublicClient({
    transport: http(netConfig.url),
  });

  const bundlerClient = createPimlicoBundlerClient({
    transport: http(sponsoredTransaction.bundlerUrl),
  });

  // Check if bundler and public client share same chain Id
  const bundlerChainId = await bundlerClient.chainId();
  const publicChainId = await publicClient.getChainId();
  if (bundlerChainId !== publicChainId) {
    const message = `Bundler chain id ${bundlerChainId} does not match public chain id ${publicChainId} for network ${networkName}`;
    log(message);
    throw new Error(message);
  }

  const paymasterClient = createPaymasterClient(
    sponsoredTransaction.paymasterType as PaymasterType,
    sponsoredTransaction.paymasterUrl,
    bundlerClient,
    sponsoredTransaction.policyId,
  );

  return await GaslessProvider.create(
    signer,
    provider,
    bundlerClient,
    paymasterClient,
    publicClient,
    simpleAccountFactoryAddress,
    sponsoredTransaction.smartAccount,
  );
});

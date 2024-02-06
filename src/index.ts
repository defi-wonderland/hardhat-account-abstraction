import 'dotenv/config';
import { extendProvider } from 'hardhat/config';
import { createPublicClient, http } from 'viem';
import { createPimlicoBundlerClient } from 'permissionless/clients/pimlico';
import { createPaymasterClient } from './paymaster';
import { SIMPLE_ACCOUNT_FACTORY_ADDRESS as constantSimpleAccountFactoryAddress } from './constants';
import { GaslessProvider } from './gasless-provider';
import { PaymasterType } from './types';
import init from 'debug';
import './type-extensions';

const log = init('hardhat:plugin:gasless');

extendProvider(async (provider, config, networkName) => {
  log(`Extending provider for network ${networkName}`);

  const netConfig = config.networks[networkName];
  if (!Array.isArray(netConfig.accounts)) {
    log(`Mnemonics are not yet supported, skipping`);
    return provider;
  }
  const signer = netConfig.accounts[0] as `0x${string}`;

  if (!('url' in netConfig)) {
    log(`Hardhat Network detected, skipping`);
    return provider;
  }

  const accountAbstraction = netConfig.accountAbstraction;
  if (!accountAbstraction) {
    log(`No configuration for sponsored transactions set, skipping`);
    return provider;
  }

  const simpleAccountFactoryAddress =
    accountAbstraction.simpleAccountFactoryAddress ?? constantSimpleAccountFactoryAddress;

  const publicClient = createPublicClient({
    transport: http(netConfig.url),
  });

  const bundlerClient = createPimlicoBundlerClient({
    transport: http(accountAbstraction.bundlerUrl),
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
    accountAbstraction.paymasterType as PaymasterType,
    accountAbstraction.paymasterUrl,
    bundlerClient,
    accountAbstraction.policyId,
  );

  return await GaslessProvider.create(
    signer,
    provider,
    bundlerClient,
    paymasterClient,
    publicClient,
    simpleAccountFactoryAddress,
    accountAbstraction.smartAccount,
  );
});

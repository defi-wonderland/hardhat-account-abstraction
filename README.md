# Sponsored Txns Hardhat Plugin

A plugin to send transactions to testnets without needing gas money!


## What

This plugin sponsors any transaction the user sends through the power of account abstraction. Through seemless integration after the configuration is set just submit any transaction, and you can see it get mined on the testnets without costing the signer any gas! 

## Installation

> **⚠ WARNING: Currently the package is not deployed and the installation steps will not work, these are the steps you would take when it is deployed**

<br>


```bash
yarn install @defi-wonderland/sponsored-txs-hardhat-plugin [list of peer dependencies]
```

Import the plugin in your `hardhat.config.js`:

```js
require("@defi-wonderland/sponsored-txs-hardhat-plugin");
```

Or if you are using TypeScript, in your `hardhat.config.ts`:

```ts
import "@defi-wonderland/sponsored-txs-hardhat-plugin";
```


## Required plugins


- [@nomicfoundation/hardhat-ethers](https://github.com/NomicFoundation/hardhat/tree/main/packages/hardhat-ethers)

## Tasks


This plugin creates no additional tasks.


## Environment extensions

This plugin does not extend the hardhat runtime environment

## Configuration

This plugin requires 3 new field inside a `sponsoredTransaction` object which will be nested inside each hardhat network that is set in the config

This is an example of how to set it:

```ts
const config: HardhatUserConfig = {
  solidity: '0.8.19',
  defaultNetwork: 'goerli',
  networks: {
    goerli: {
      url: process.env.GOERLI_RPC_URL as string,
      accounts: [process.env.PRIVATE_KEY as string],
      sponsoredTransactions: {
        bundlerUrl: 'https://example.com', // The bundler that the UserOperations will be sent to
        paymasterUrl: 'https://example.com', // The paymaster API that will be used for sponsoring transactions
        paymasterType: 'pimlico', // The type of paymaster it is
        simpleAccountFactoryAddress: 0x15Ba39375ee2Ab563E8873C8390be6f2E2F50232, // Optional parameter, this defaults to: 0x9406cc6185a346906296840746125a0e44976454
        policyId: 'example_example' // Optional parameter, can be set if your paymaster has a policy id
      }
    }
  }
};
```

### Supported Paymaster Types

Currently we support 3 paymaster types which are the following:

1. Pimlico which can be set as `pimlico`
1. Stackup which can be set as `stackup`
1. Base which can be set as `base`


If you would like to add support for a new paymaster check out the guide [here](#adding-a-new-paymaster-to-the-plugin)

### Supported Chains

For a chain to be supported at the moment the only condition is the SimpleAccount Factory is deployed to the addres `0x9406cc6185a346906296840746125a0e44976454` or alternatively entered as an optional parameter in the config

Currently the list of supported chains is, but not limited to the following:

1. Ethereum Sepolia
1. Ethereum  Goerli
1. Polygon Mumbai
1. Base Goerli
1. Optimism Goerli
1. Arbitrum Goerli

## Usage

After you have setup the configuration for the `sponsoredTransactions` and you are using a network that has them enable you are good to go, you can right a simple script below and your transactions will be mined on the testnet that you have configured!

```js
const signer = await ethers.provider.getSigner();
const testToken = new ethers.Contract('0x16F63C5036d3F48A239358656a8f123eCE85789C', TEST_TOKEN_ABI, signer);
const amountToMint = ethers.parseEther('6.9');
await testToken.mint(amountToMint);
```

## Contributors

If you want to learn how to add support for your own paymaster implementation checkout our guide [here](./CONTRIBUTORS.md#adding-a-new-paymaster-to-the-plugin) to learn how to add it to the plugin!

<br>

Sponsored Transaction was built with ❤️ by [Wonderland](https://defi.sucks).

Wonderland the largest core development group in web3. Our commitment is to a financial future that's open, decentralized, and accessible to all.

[DeFi sucks](https://defi.sucks), but Wonderland is here to make it better.

## Licensing

The primary license for Sponsored Transactions is MIT, see [`LICENSE`](./LICENSE).
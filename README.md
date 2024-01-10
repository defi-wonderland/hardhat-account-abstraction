# Sponsored Txns Hardhat Plugin

A plugin to send transactions to testnets without needing gas money!


## What

This plugin sponsors any transaction the user sends through the power of account abstraction. Through seemless integration after the configuration is set just submit any transaction, and you can see it get mined on the testnets without costing the signer any gas! 

## Installation

> **⚠ WARNING: Currently the package is not deployed and the installation steps will not work, these are the steps you would take when it is deployed**
> Currently the package is not deployed and the installation will not work

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

```js
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
        paymasterType: 'pimlico' // The type of paymaster it is
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


## Usage

After you have setup the configuration for the `sponsoredTransactions` and you are using a network that has them enable you are good to go, you can right a simple script below and your transactions will be mined on the testnet that you have configured!

```js
const signer = await ethers.provider.getSigner();
const testToken = new ethers.Contract('0x16F63C5036d3F48A239358656a8f123eCE85789C', TEST_TOKEN_ABI, signer);
const amountToMint = ethers.parseEther('6.9');
await testToken.mint(amountToMint);
```

## Adding a new paymaster to the plugin

TODO when this functionallity is finalized


## Licensing

The primary license for Sponsored Transactions is MIT, see [`LICENSE`](./LICENSE).
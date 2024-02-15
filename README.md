# Hardhat Account Abstraction

A plugin to send sponsored transactions utilizing account abstraction!


## What

This plugin sponsors any transaction the user sends through the power of account abstraction. Through seemless integration after the configuration is set just submit any transaction, and you can see it get mined on the testnets without costing the signer any gas! 

## Installation


```bash
yarn install @defi-wonderland/hardhat-account-abstraction
```

Import the plugin in your `hardhat.config.js`:

```js
require("@defi-wonderland/hardhat-account-abstraction");
```

Or if you are using TypeScript, in your `hardhat.config.ts`:

```ts
import "@defi-wonderland/hardhat-account-abstraction";
```


## Required plugins

> **NOTE: Only one of these packages is needed depending on what you are writing your scripts in**

<br>

- [@nomicfoundation/hardhat-ethers](https://github.com/NomicFoundation/hardhat/tree/main/packages/hardhat-ethers)
- [@nomicfoundation/hardhat-viem](https://github.com/NomicFoundation/hardhat/tree/main/packages/hardhat-viem)

## Tasks


This plugin creates no additional tasks.


## Environment extensions

This plugin does not extend the hardhat runtime environment

## Configuration
> **NOTE: Currently the plugin will only use the first private key in `accounts`**

This plugin requires 2 new fields inside an `accountAbstraction` object which will be nested inside each hardhat network that is set in the config

This is an example of how to set it:

```ts
const config: HardhatUserConfig = {
  solidity: '0.8.19',
  defaultNetwork: 'goerli',
  networks: {
    goerli: {
      url: process.env.GOERLI_RPC_URL as string,
      accounts: [process.env.PRIVATE_KEY as string],
      accountAbstraction: {
        bundlerUrl: 'https://example.com',
        paymasterUrl: 'https://example.com',
      }
    }
  }
};
```

### Options

| Option                         | Description                                                                                          | Required | Default                                     |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------  |
| `bundlerUrl`                   | The bundler that the UserOperations will be sent to                                                  | Yes      | No default                                  |
| `paymasterUrl`                 | The paymaster API that will be used for sponsoring transactions                                      | Yes      | No default                                  |
| `simpleAccountFactoryAddress`  | The simple account factory address you want to use                                                   | No       | 0x9406cc6185a346906296840746125a0e44976454  |
| `smartAccount`                 | Address of a smart account to use in your scripts                                                    | No       | Will deploy one for you                     |
| `policyId`                     | The policy id to use if your paymaster has one                                                       | No       | No default                                  | 

### How does default smart account deployment work?

When you use a `PRIVATE_KEY` and no set `smartAccount` in the config we will deploy a smart account for you, your signer will be the owner of the smart account, however the sender address for all interactions will be the `smartAccount` not the signer. 
<br>

This smart contract that gets deployed acts as a wallet that will be used to make transactions, all transactions require your signer's signature, to go deeper into the ERC-4337 standard [check out this article from cointelegraph](https://cointelegraph.com/learn/account-abstraction-guide-to-ethereums-erc-4337-standard).
 
<br>
We use your signer address as a salt when deploying the smart account so it will be unique to your signer and reuseable no matter how many times you run the scripts. 

### Supported Paymaster Types

The list of paymasters we currently support

1. Pimlico
1. Stackup
1. Alchemy
1. Base


If you would like to add support for a new paymaster check out the [contributors guide](./CONTRIBUTORS.md#adding-a-new-paymaster-to-the-plugin)

### Supported Chains

#### For a chain to be supported the conditions are:

1. The SimpleAccount Factory is deployed to the address `0x9406cc6185a346906296840746125a0e44976454` or alternatively entered as an optional parameter in the config
1. The [CreateXFactory](https://github.com/pcaversaccio/createx) needs to be deployed to its standard address

<br>

#### Currently the list of supported chains is, but not limited to the following:

1. Ethereum Sepolia
1. Polygon Mumbai
1. Base Sepolia
1. Optimism Sepolia
1. Arbitrum Sepolia
1. Mantle Testnet
1. Avalanche Testnet (Fuji)
1. Binance Smart Chain Testnet

And more!

## Usage

> **⚠ WARNING: Any non-zero msg.value call will not work as intended as paymaster's dont sponsor this value, in order to use native transfers or interact with payable functions you will need the native token of your chain in the smart account wallet beforehand**

After you have setup the configuration for the `accountAbstraction` and you are using a network that has them enable you are good to go, you can right a simple script below and your transactions will be mined on the testnet that you have configured!

```js
const signer = await ethers.provider.getSigner();
const testToken = new ethers.Contract('0x16F63C5036d3F48A239358656a8f123eCE85789C', TEST_TOKEN_ABI, signer);
const amountToMint = ethers.parseEther('6.9');
await testToken.mint(amountToMint);
```

## Deploying Contracts

Deploying contracts works just as any other transaction would, however due to the nature of account abstraction we deploy all contracts through the `CreateXFactory`, The `CreateXFactory` is deployed on **most** EVM compatible chains, if you would like to learn more about it or deploy it to your new chain you can do so by checking out [their repo](https://github.com/pcaversaccio/createx)

### What are the differences?

- **Ownable contracts**

    We do support ownable contracts and the default `owner` of your contract will be the smart account you deployed with, the only condition is you must have a `transferOwnership(address)` function to make this work, if you have a custom implementation of `Ownable` and dont instantiate `owner` as `msg.sender` in the constructor it will also work.

- **Contract addresses in scripts**

    Scripting with deployed contracts works pretty much out of the box with one caveat, the address that ethers provides for your address is wrong. This is because ethers predicts the deployment address by the default `CREATE` opcode standards which takes the transaction's `from` and `nonce` values, these values do not match that of our middlewares deployment so we expose a [custom method to get this address](#aa_getdeploymentfor). This issue is only present with libraries that hardcode the predicted address such as ethers. Other libraries use the receipt to retrieve the contract address such as viem, for those libraries the address returned will be correct as we modify the receipts in our middleware.

    <br>

    Scripting will work as expected even with this incorrect address param, this is because our middleware overwrites any transaction being sent to the incorrect predicted address and routes it to the address we deployed. As you can see from this example below.

  ```js
  const lock = await ethers.getContractFactory('Lock');

  const lockContract = await lock.deploy();

  const originalOwner = await lockContract.owner();

  console.log('Original owner set to: ', originalOwner); // Logs the smart account address

  await lockContract.transferOwnership("0xEB7cFd33CfEfFf98EF067F501B81D31C9a7077C3");

  const newOwner = await lockContract.owner();

  console.log('New owner set to: ', newOwner); // Logs the 0xEB7... address
  ```
  <br>

  However it is very important to remember that `lockContract` has the wrong address, however using the address the contract computes will work as a parameter as you can see below

  <br>

  ```js
  const lock = await ethers.getContractFactory('Lock');
  const lockContract = await lock.deploy();
  
  console.log(lockContract.target); // Wrong address

  const lockContractAddress = await network.provider.request({
    method: 'aa_getDeploymentFor',
    params: [lockContract.target]
  });

  console.log(lockContractAddress) // Correct address

  lockContract.randomFunctionWithAddressAsParam(lockContract.target) // Will use the correct address
  ```

## Custom JSON API methods

This plugin adds additional JSON-RPC methods to be able to interact and get data from our custom provider middleware.

### `aa_getSmartAccountAddress`

**Description:** Returns the address for the smart account that is being used by the provider.
  - Example: 
  ```js
  const smartAccountAddress = await network.provider.request({
      method: 'aa_getSmartAccountAddress',
      params: [],
    });
    console.log(`Smart account address: ${smartAccountAddress}`);
  ```

### `aa_getDeploymentFor`: 

**Description:** Returns the address of which a contract was deployed through our middleware, [to learn more about why this is needed click here](#deploying-contracts)
  - Parameters:
    - `contract: 0x${string}`: The contract address that you want to check the deployment for
  - Example:
  ```js
  const lock = await ethers.getContractFactory('Lock');
  const lockContract = await lock.deploy();

  const lockContractAddress = await network.provider.request({
    method: 'aa_getDeploymentFor',
    params: [lockContract.target] 
  });
  ```


## Contributors

If you want to learn how to add support for your own paymaster implementation checkout our guide [here](./CONTRIBUTORS.md#adding-a-new-paymaster-to-the-plugin) to learn how to add it to the plugin!

<br>

Hardhat Account Abstraction was built with ❤️ by [Wonderland](https://defi.sucks).

Wonderland the largest core development group in web3. Our commit ment is to a financial future that's open, decentralized, and accessible to all.

[DeFi sucks](https://defi.sucks), but Wonderland is here to make it better.

## Licensing

The primary license for Hardhat Account Abstraction is MIT, see [`LICENSE`](./LICENSE).
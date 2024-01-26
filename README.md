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
        bundlerUrl: 'https://example.com',
        paymasterUrl: 'https://example.com',
        paymasterType: 'pimlico'
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
| `paymasterType`                | The type of paymaster                                                                                | Yes      | No default                                  |
| `simpleAccountFactoryAddress`  | The simple account factory address you want to use                                                   | No       | 0x9406cc6185a346906296840746125a0e44976454  |
| `smartAccount`                 | Address of a smart account to use in your scripts                                                    | No       | Will deploy one for you                     |
| `policyId`                     | The policy id to use if your paymaster has one                                                       | No       | No default                                  | 

### Supported Paymaster Types

| Paymaster | Value     |
| --------- | --------- |
| Pimlico   | 'pimlico' |
| Base      | 'base'    |
| Alchemy   | 'alchemy' |
| Stackup   | 'stackup' |



If you would like to add support for a new paymaster check out the [contributors guide](./CONTRIBUTORS.md#adding-a-new-paymaster-to-the-plugin)

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

> **⚠ WARNING: Any non-zero msg.value call will not work as intended as paymaster's dont sponsor this value, in order to use native transfers or interact with payable functions you will need the native token of your chain in the smart account wallet beforehand**

After you have setup the configuration for the `sponsoredTransactions` and you are using a network that has them enable you are good to go, you can right a simple script below and your transactions will be mined on the testnet that you have configured!

```js
const signer = await ethers.provider.getSigner();
const testToken = new ethers.Contract('0x16F63C5036d3F48A239358656a8f123eCE85789C', TEST_TOKEN_ABI, signer);
const amountToMint = ethers.parseEther('6.9');
await testToken.mint(amountToMint);
```

## Deploying Contracts

Deploying contracts works just as any other transaction would, however due to the nature of account abstraction we deploy all contracts through the `CreateXFactory`, The `CreateXFactory` is deployed on **most** EVM compatible chains, if you would like to learn more about it or deploy it to your new chain you can do so by checking out [their repo]()

### What are the differences?

- **Ownable contracts**

    We do support ownable contracts and the default `owner` of your contract will be the smart account you deployed with, the only condition is you must have a `transferOwnership(address)` function to make this work, if you have a custom implementation of `Ownable` and dont instantiate `owner` as `msg.sender` in the constructor it will also work.

- **Contract addresses in scripts**

    Scripting with deployed contracts works pretty much out of the box with one caveat, the address that ethers provides for your address is wrong. This is because ethers predicts the deployment address by the default `CREATE` opcode standards which takes the transaction's `from` and `nonce` values, these values do not match that of our middlewares deployment so we expose a [custom method to get this address](#sponsored_getdeploymentfor)

    <br>

    Scripting will work as expected even with this incorrect address param, this is because our middleware overwrites any transaction being sent to the incorrect predicted address and routes it to the address we deployed. As you can see from this example below.

  ```js
  const lock = await ethers.getContractFactory('Lock');

  const lockContract = await lock.deploy();

  await lockContract.transferOwnership("0xEB7cFd33CfEfFf98EF067F501B81D31C9a7077C3");

  const newOwner = await lockContract.owner();

  console.log('New owner set to: ', newOwner); // Logs the 0xEB7... address
  ```
  <br>

  However it is very important to remember that `lockContract` has the wrong address in its object so you need to use our custom method if you need this address for any interactions

  <br>

  ```js
  const lock = await ethers.getContractFactory('Lock');
  const lockContract = await lock.deploy();
  
  console.log(lockContract.target); // Wrong address

  const lockContractAddress = await network.provider.request({
    method: 'sponsored_getDeploymentFor',
    params: [lockContract]
  });

  console.log(lockContractAddress) // Correct address
  ```

## Custom JSON API methods

This plugin adds additional JSON-RPC methods to be able to interact and get data from our custom provider middleware.

### `sponsored_getSmartAccountAddress`

**Description:** Returns the address for the smart account that would be used if we deploy one for you, the user does not provide a smart account address, this will be deterministically generated from the provided signer address:
  - Parameters: 
    - `signerAddress: 0x${string}` - The signer of the transactions
  - Example: 
  ```js
  const smartAccountAddress = await network.provider.request({
      method: 'sponsored_getSmartAccountAddress',
      params: [signer.address],
    });
    console.log(`Smart account address: ${smartAccountAddress}`);
  ```

### `sponsored_getDeploymentFor`: 

**Description:** Returns the address of which a contract was deployed through our middleware, [to learn more about why this is needed click here](#deploying-contracts)
  - Parameters:
    - `contract: Contract | 0x${string}`: Either a base contract, contract or address
  - Example:
  ```js
  const lock = await ethers.getContractFactory('Lock');
  const lockContract = await lock.deploy();

  const lockContractAddress = await network.provider.request({
    method: 'sponsored_getDeploymentFor',
    params: [lockContract.target] // This param also accept `lockContract` or `lockContract.address`
  });
  ```

## Contributors

If you want to learn how to add support for your own paymaster implementation checkout our guide [here](./CONTRIBUTORS.md#adding-a-new-paymaster-to-the-plugin) to learn how to add it to the plugin!

<br>

Sponsored Transaction was built with ❤️ by [Wonderland](https://defi.sucks).

Wonderland the largest core development group in web3. Our commitment is to a financial future that's open, decentralized, and accessible to all.

[DeFi sucks](https://defi.sucks), but Wonderland is here to make it better.

## Licensing

The primary license for Sponsored Transactions is MIT, see [`LICENSE`](./LICENSE).
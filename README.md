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

## Adding a new paymaster to the plugin

### Adding the paymaster

If you operate a paymaster and would like to add support for your paymaster into the plugin please follow the steps below

1. located inside `src/paymasters` you will see all other paymasters please create a typescript file for this example we will call it `ExamplePaymaster.ts`

1. Now inside `ExamplePaymaster.ts` we will need to inherit the `Paymaster` class and input the neccesarry types. Here is an example setup below. Some paymaster might need access to a bundler client or policy id, feel free to add those into the constructor of your class we will get to how those will be passed in a later step.

<br>

```ts
import { SponsorUserOperationReturnType } from 'permissionless/actions/pimlico';
import { PartialUserOperation } from '../types';
import { Paymaster } from './Paymaster';

/**
 * Example class for paymasters.
 */
export class ExamplePaymaster {

  constructor(endpoint: string) {
    super(endpoint);
  }

  /**
   * Sponsor a user operation.
   * @param userOperation The user operation to sponsor
   * @param entryPoint The entry point to use
   * @returns The paymasterAndData and gas information for the user operation or just the paymasterAndData depending on the implementation
   */
  public async sponsorUserOperation(
    userOp: PartialUserOperation,
    entryPoint: `0x${string}`,
  ): Promise<SponsorUserOperationReturnType> {
    // Your logic for sponsorship
  }
}
```
<br>

3. Now lets export your paymaster from the paymaster folder we will do this in the `index.ts` file located in `src/paymaster`, you can see from below how we would export `ExamplePaymaster.ts`

<br>

```ts
export * from './Paymaster';
export * from './PimlicoPaymaster';
export * from './StackUpPaymaster';
export * from './BasePaymaster';
export * from './AlchemyPaymaster';
export * from './ExamplePaymaster';
```

<br>

4. Next we will register your new paymaster as a type for users to select in their hardhat config. Go to `src/type.ts` and add your paymaster info to the `PaymasterType` enum, heres how we would do it with `ExamplePaymaster.ts`

<br>

```ts
/**
 * The type of paymaster class
 * @property Pimlico for the Pimlico paymaster
 * @property Base for the Base paymaster
 * @property StackUp for the StackUp paymaster
 */
export enum PaymasterType {
  Pimlico = 'pimlico',
  Base = 'base',
  StackUp = 'stackup',
  Alchemy = 'alchemy',
  Example = 'example'
}
```
<br>

5. Now we will go to `src/paymaster.ts` and add your paymaster to the switch statement, and optionally pass in the bundler client or policy id if your paymaster implementation needs them.

<br>

```ts
export function createPaymasterClient(
  paymasterType: PaymasterType,
  paymasterUrl: string,
  bundlerClient: PimlicoBundlerClient,
  policyId?: string,
): Paymaster {
  switch (paymasterType) {
    case PaymasterType.Pimlico:
      return new Pm.PimlicoPaymaster(paymasterUrl, policyId);
    case PaymasterType.StackUp:
      return new Pm.StackUpPaymaster(paymasterUrl);
    case PaymasterType.Base:
      return new Pm.BasePaymaster(paymasterUrl, bundlerClient);
    case PaymasterType.Alchemy:
      return new Pm.AlchemyPaymaster(paymasterUrl, policyId);
    case PaymasterType.Example:
      return new Pm.ExamplePaymaster(paymasterUrl);

    default:
      throw new Error(`Unknown paymaster type ${paymasterType}`);
  }
}
```

<br>

6. And thats it! In order to test that you have done the implementation correctly you can clone our [example repo found here](https://github.com/defi-wonderland/sponsored-txs-hardhat-example) and link it to your local plugin, see the simple guide below for steps on how to do that!

<br>

### Testing the paymaster locally

1. Make sure you are in the sponsored transaction repo you forked and are ready to test your paymaster implementation

1. run `yarn && yarn build`

1. Run `yarn link`

1. Clone the [example repo](https://github.com/defi-wonderland/sponsored-txs-hardhat-example) and `cd` into it

1. run `yarn link @defi-wonderland/sponsored-txs-hardhat-plugin`

1. Now open the example repo in your code editor of choice and navigate to the `hardhat.config.ts` file

1. Here we need to set our `paymasterType` to the paymaster we just made! If your paymaster does not run on goerli feel free to change the network as well!

<br>

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
        paymasterType: 'example' // The type of paymaster it is
      }
    }
  }
};
```
<br>

8. Next we need to set the environment variable in the `.env`

<br>

```
GOERLI_RPC_URL=https://example_rpc
PRIVATE_KEY=YOUR_PK
```
9. Now we can test everything by running `npx hardhat run scripts/deploy.ts`

10. Assuming all goes well and you are done testing your implementation feel free to make a PR to the official plugin and we will do our best to review it in a timely manner!

## Licensing

The primary license for Sponsored Transactions is MIT, see [`LICENSE`](./LICENSE).
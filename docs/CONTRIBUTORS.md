# Contributors

## Adding a new paymaster to the plugin

### Adding the paymaster

If you operate a paymaster and would like to add support for your paymaster into the plugin please follow the steps below

1. Located inside `src/paymasters` you will see all other paymasters please create a typescript file for this example we will call it `ExamplePaymaster.ts`

1. Now inside `ExamplePaymaster.ts` we will need to inherit the `Paymaster` class and input the neccesarry types. Here is an example setup below. Some paymaster might need access to a bundler client or policy id, feel free to add those into the constructor of your class we will get to how those will be passed in a later step.

<br>

```ts
import { SponsorUserOperationReturnType } from 'permissionless/actions/pimlico';
import { PartialUserOperation } from '../types';
import { Paymaster } from './Paymaster';

/**
 * Example class for paymasters.
 */
export class ExamplePaymaster extends Paymaster {

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

4. Next we will register your new paymaster as a type for users to select in their hardhat config. Go to `src/type.ts` and add your paymaster info to the `PaymasterType` enum and update the natspec to reflect the changes, heres how we would do it with `ExamplePaymaster.ts`. **It is important the value you set is unique to your API for our interpreter to properly parse it**. As you can see base is not set to `base` as there would be conflicts which providers that use it as a param to decide the chain so it is set to `paymaster.base` to be unique.

<br>

```ts
/**
 * The type of paymaster class
 * @property Pimlico for the Pimlico paymaster
 * @property Base for the Base paymaster
 * @property StackUp for the StackUp paymaster
 * @property Alchemy for the Alchemy paymaster
 * @property Example for the example paymaster
 */
export enum PaymasterType {
  Pimlico = 'pimlico',
  Base = 'paymaster.base',
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
  }
}
```

<br>

6. Finally be sure to update the README's list of supported paymaster to reflect your changes, the table can be found [here](./README.md#supported-paymaster-types)

7. And thats it! In order to test that you have done the implementation correctly you can clone our [example repo found here](https://github.com/defi-wonderland/sponsored-txs-hardhat-example) and link it to your local plugin, see the simple guide below for steps on how to do that!

<br>

### Testing the paymaster locally

1. Make sure you are in the sponsored transaction repo you forked and are ready to test your paymaster implementation

1. run `yarn && yarn build`

1. Run `yarn link`

1. Clone the [example repo](https://github.com/defi-wonderland/hardhat-account-abstraction-example) and `cd` into it

1. run `yarn link @defi-wonderland/hardhat-account-abstraction`

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
      accountAbstraction: {
        bundlerUrl: 'https://example.com', // The bundler that the UserOperations will be sent to
        paymasterUrl: 'https://example.com', // The paymaster API that will be used for sponsoring transactions
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

10. Assuming all goes well and you are done testing your implementation feel free to make a PR to the official plugin with a description on how the reviewer can test your new paymaster and we will do our best to review it in a timely manner!

### Running the integration tests

1. When adding a paymaster we need to also run our integration tests inside the plugin's repository to do so follow these steps

1. Set the environment variables:
```
# NOTE: Environment variables are only needed if you are running integration tests

E2E_BUNDLER_URL=<bundler url>
E2E_PAYMASTER_URL=<paymaster url we are adding>
E2E_SEPOLIA_RPC=<rpc to sepolia>
```
<br>

3. Run `yarn test:integration` and observe thne results
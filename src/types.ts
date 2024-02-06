/**
 * The partial user operation that is sent to be sponsored
 * @property sender The sender of the transaction
 * @property nonce The nonce of the transaction
 * @property initCode The init code of the transaction
 * @property callData The call data of the transaction
 * @property maxFeePerGas The max fee per gas of the transaction
 * @property maxPriorityFeePerGas The max priority fee per gas of the transaction
 * @property signature The signature of the transaction
 */
export type PartialUserOperation = {
  sender: `0x${string}`;
  nonce: bigint;
  initCode: `0x${string}`;
  callData: `0x${string}`;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  signature: `0x${string}`;
};

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
}

/**
 * Literal type of the paymaster types so input to the config can be a string
 */
export type PaymasterTypeLiteral = keyof {
  [K in keyof typeof PaymasterType as string]: K;
};

export type EstimateGasTxn = {
  from?: `0x${string}`;
  to?: `0x${string}`;
  data?: `0x${string}`;
  value?: bigint | `0x${string}`;
};

/**
 * The type for the getSmartAccountData function
 * @property initCode The init code of the smart account
 * @property senderAddress The sender address of the smart account
 */

export type GetSmartAccountDataReturnType = {
  initCode: `0x${string}`;
  senderAddress: `0x${string}`;
};

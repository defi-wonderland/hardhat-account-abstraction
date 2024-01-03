export type PartialUserOperation = {
  sender: `0x${string}`;
  nonce: bigint;
  initCode: `0x${string}`;
  callData: `0x${string}`;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  signature: `0x${string}`;
};

export enum PaymasterType {
  Pimlico = 'pimlico',
  Biconomy = 'biconomy',
}

export type PaymasterTypeLiteral = keyof {
  [K in keyof typeof PaymasterType as string]: K;
};
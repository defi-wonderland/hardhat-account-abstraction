// This file was autogenerated by hardhat-viem, do not edit it.
// prettier-ignore
// tslint:disable
// eslint-disable

import type { Address } from "viem";
import type { GetContractReturnType } from '@nomicfoundation/hardhat-viem/types';
import '@nomicfoundation/hardhat-viem/types';

export interface OwnmableContract$Type {
  _format: 'hh-sol-artifact-1';
  contractName: 'OwnmableContract';
  sourceName: 'contracts/OwnableContract.sol';
  abi: [
    {
      inputs: [];
      stateMutability: 'nonpayable';
      type: 'constructor';
    },
    {
      anonymous: false;
      inputs: [
        {
          indexed: false;
          internalType: 'address';
          name: '';
          type: 'address';
        },
      ];
      name: 'OwnerChanged';
      type: 'event';
    },
    {
      inputs: [];
      name: 'owner';
      outputs: [
        {
          internalType: 'address';
          name: '';
          type: 'address';
        },
      ];
      stateMutability: 'view';
      type: 'function';
    },
    {
      inputs: [
        {
          internalType: 'address';
          name: 'newOwner';
          type: 'address';
        },
      ];
      name: 'transferOwnership';
      outputs: [];
      stateMutability: 'nonpayable';
      type: 'function';
    },
  ];
  bytecode: '0x608060405234801561001057600080fd5b50336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550610334806100606000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c80638da5cb5b1461003b578063f2fde38b14610059575b600080fd5b610043610075565b60405161005091906101e2565b60405180910390f35b610073600480360381019061006e919061022e565b610099565b005b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610127576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161011e906102de565b60405180910390fd5b806000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055507fa2ea9883a321a3e97b8266c2b078bfeec6d50c711ed71f874a90d500ae2eaf368160405161019691906101e2565b60405180910390a150565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006101cc826101a1565b9050919050565b6101dc816101c1565b82525050565b60006020820190506101f760008301846101d3565b92915050565b600080fd5b61020b816101c1565b811461021657600080fd5b50565b60008135905061022881610202565b92915050565b600060208284031215610244576102436101fd565b5b600061025284828501610219565b91505092915050565b600082825260208201905092915050565b7f4f6e6c79206f776e65722063616e207472616e73666572206f776e657273686960008201527f7000000000000000000000000000000000000000000000000000000000000000602082015250565b60006102c860218361025b565b91506102d38261026c565b604082019050919050565b600060208201905081810360008301526102f7816102bb565b905091905056fea2646970667358221220d1d14226466152b9c978319b89b989403a379259babd971bacad3224379f14ed64736f6c63430008130033';
  deployedBytecode: '0x608060405234801561001057600080fd5b50600436106100365760003560e01c80638da5cb5b1461003b578063f2fde38b14610059575b600080fd5b610043610075565b60405161005091906101e2565b60405180910390f35b610073600480360381019061006e919061022e565b610099565b005b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610127576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161011e906102de565b60405180910390fd5b806000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055507fa2ea9883a321a3e97b8266c2b078bfeec6d50c711ed71f874a90d500ae2eaf368160405161019691906101e2565b60405180910390a150565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006101cc826101a1565b9050919050565b6101dc816101c1565b82525050565b60006020820190506101f760008301846101d3565b92915050565b600080fd5b61020b816101c1565b811461021657600080fd5b50565b60008135905061022881610202565b92915050565b600060208284031215610244576102436101fd565b5b600061025284828501610219565b91505092915050565b600082825260208201905092915050565b7f4f6e6c79206f776e65722063616e207472616e73666572206f776e657273686960008201527f7000000000000000000000000000000000000000000000000000000000000000602082015250565b60006102c860218361025b565b91506102d38261026c565b604082019050919050565b600060208201905081810360008301526102f7816102bb565b905091905056fea2646970667358221220d1d14226466152b9c978319b89b989403a379259babd971bacad3224379f14ed64736f6c63430008130033';
  linkReferences: {};
  deployedLinkReferences: {};
}

declare module '@nomicfoundation/hardhat-viem/types' {
  export function deployContract(
    contractName: 'OwnmableContract',
    constructorArgs?: [],
    config?: DeployContractConfig,
  ): Promise<GetContractReturnType<OwnmableContract$Type['abi']>>;
  export function deployContract(
    contractName: 'contracts/OwnableContract.sol:OwnmableContract',
    constructorArgs?: [],
    config?: DeployContractConfig,
  ): Promise<GetContractReturnType<OwnmableContract$Type['abi']>>;

  export function sendDeploymentTransaction(
    contractName: 'OwnmableContract',
    constructorArgs?: [],
    config?: SendDeploymentTransactionConfig,
  ): Promise<{
    contract: GetContractReturnType<OwnmableContract$Type['abi']>;
    deploymentTransaction: GetTransactionReturnType;
  }>;
  export function sendDeploymentTransaction(
    contractName: 'contracts/OwnableContract.sol:OwnmableContract',
    constructorArgs?: [],
    config?: SendDeploymentTransactionConfig,
  ): Promise<{
    contract: GetContractReturnType<OwnmableContract$Type['abi']>;
    deploymentTransaction: GetTransactionReturnType;
  }>;

  export function getContractAt(
    contractName: 'OwnmableContract',
    address: Address,
    config?: GetContractAtConfig,
  ): Promise<GetContractReturnType<OwnmableContract$Type['abi']>>;
  export function getContractAt(
    contractName: 'contracts/OwnableContract.sol:OwnmableContract',
    address: Address,
    config?: GetContractAtConfig,
  ): Promise<GetContractReturnType<OwnmableContract$Type['abi']>>;
}

import { GetUserOperationReceiptReturnType, UserOperation } from 'permissionless';
import { randomBytes, toBeHex, toBigInt } from 'ethers';
import { getSenderAddress } from './mock';
import { concat, createPublicClient, encodeFunctionData } from 'viem';
import fs from 'fs';

/**
 * Converts all BigInts in an object to strings because the nonce
 * @param obj An object that may contain BigInts
 * @returns The object with all BigInts converted to strings in hexadecimal form
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function convertBigIntsToString(obj: any) {
  for (const key in obj) {
    if (typeof obj[key] === 'bigint') {
      // Convert 0n to '0x', and other BigInts to their string representation
      // NOTE: base expects gas values to be non-zero, but nonce might be zero so we need to be sure to exclude it
      obj[key] = obj[key] === 0n && key !== 'nonce' ? '0x1' : '0x' + obj[key].toString(16);
    }

    // Recursively convert BigInts in nested objects
    if (typeof obj[key] === 'object') {
      obj[key] = convertBigIntsToString(obj[key]);
    }
  }

  return obj;
}

/**
 * Converts a bigint to a 32 byte padded hexadecimal string
 * @param bigintValue The bigint value
 * @returns The hexadecimal string
 */

export function bigintToPaddedHex(bigintValue: bigint): `0x${string}` {
  // Convert the bigint to a hexadecimal string
  let hexString = bigintValue.toString(16);

  // Ensure the length is even to represent full bytes
  if (hexString.length % 2 !== 0) {
    hexString = '0' + hexString;
  }

  // Calculate the padding length (64 hex characters for 32 bytes)
  const paddingLength = 64 - hexString.length;

  // Pad the string with trailing zeros
  hexString = hexString + '0'.repeat(paddingLength);

  return ('0x' + hexString) as `0x${string}`;
}

/*
 * Determines the init code and sender address for a smart account already deployed or to be deployed
 * @param publicClient The public client to use to query the sender address
 * @param simpleAccountFactoryAddress The factory address to use
 * @param owner The owner of the smart account
 * @param entryPoint The entry point to use
 * @returns A promise that resolves to the init code and sender address
 */
export async function getSmartAccountData(
  publicClient: ReturnType<typeof createPublicClient>,
  simpleAccountFactoryAddress: `0x${string}`,
  owner: `0x${string}`,
  entryPoint: `0x${string}`,
): Promise<{
  initCode: `0x${string}`;
  senderAddress: `0x${string}`;
}> {
  const initCode = concat([
    simpleAccountFactoryAddress,
    encodeFunctionData({
      abi: [
        {
          inputs: [
            { name: 'owner', type: 'address' },
            { name: 'salt', type: 'uint256' },
          ],
          name: 'createAccount',
          outputs: [{ name: 'ret', type: 'address' }],
          stateMutability: 'nonpayable',
          type: 'function',
        },
      ],
      args: [owner, BigInt(owner)],
    }),
  ]);

  const senderAddress = await getSenderAddress(publicClient, {
    initCode: initCode,
    entryPoint: entryPoint,
  });

  return {
    initCode,
    senderAddress,
  };
}

/**
 * Saves the tx data to a JSON file
 * @param sponsoredUserOperation The sponsored user operation
 * @param receipt The receipt returned by the bundler
 */
export async function txToJson(
  sponsoredUserOperation: UserOperation,
  receipt: GetUserOperationReceiptReturnType,
): Promise<void> {
  const deploymentData = convertBigIntsToString(Object.assign(receipt, sponsoredUserOperation));

  // Create folder if doesn't exist
  const folderName = './sponsored-transactions';
  try {
    // If successfull, folder should not be created
    await fs.promises.access(folderName);
  } catch {
    await fs.promises.mkdir(folderName);
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const fileName = `${folderName}/sponsored_${timestamp}.json`;
  const latestFileName = `${folderName}/sponsored_latest.json`;

  // Create the file with timestamp
  await fs.promises.writeFile(fileName, JSON.stringify(deploymentData, null, 2), {
    flag: 'w',
  });

  // Create the file with latest
  await fs.promises.writeFile(latestFileName, JSON.stringify(deploymentData, null, 2), {
    flag: 'w',
  });
}

/**
 * Gets a random 32 byte hexadecimal string
 * @returns The hexadecimal string
 */
export function getRandomHex32ByteString(): `0x${string}` {
  return toBeHex(toBigInt(randomBytes(32))) as `0x${string}`;
}

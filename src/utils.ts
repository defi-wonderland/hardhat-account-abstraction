/**
 * Generates a random BigInt between min and max (inclusive)
 * @param min The minimum value
 * @param max The maximum value
 * @returns A random BigInt between min and max (inclusive)
 */
export function getRandomBigInt(min: bigint, max: bigint): bigint {
  // The Math.random() function returns a floating-point, pseudo-random number in the range 0 to less than 1
  // So, we need to adjust it to our desired range (min to max)
  const range = max - min + BigInt(1);
  const rand = BigInt(Math.floor(Number(range) * Math.random()));
  return min + rand;
}

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
  }

  return obj;
}

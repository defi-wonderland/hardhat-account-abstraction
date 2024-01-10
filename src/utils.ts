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

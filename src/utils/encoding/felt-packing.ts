/**
 * Unpacks 4 32 bit numbers from a hex string
 * @param packed The hex string that contains the packed values
 * @returns Array of 4 32 bit hex strings
 */
export function unpack4x32Bit(packed: string): string[] {
  if (packed.slice(0, 2) == '0x') {
    packed = packed.slice(2);
  }
  const num4 = `0x${packed.slice(-8)}`;
  const num3 = `0x${packed.slice(-16, -8)}`;
  const num2 = `0x${packed.slice(-24, -16)}`;
  const num1 = `0x${packed.slice(-32, -24)}`;
  return [num1, num2, num3, num4];
}

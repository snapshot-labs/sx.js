import { SplitUint256 } from './split-uint256';
import { bytesToHex, hexToBytes } from './bytes';

export class IntsSequence {
  values: bigint[];
  bytesLength: number;

  constructor(values: bigint[], bytesLength: number) {
    this.values = values;
    this.bytesLength = bytesLength;
  }

  toSplitUint256(): SplitUint256 {
    const rem = this.bytesLength % 8;
    let uint: bigint = this.values[this.values.length - 1];
    let shift = BigInt(0);
    if (rem == 0) {
      shift += BigInt(64);
    } else {
      shift += BigInt(rem * 8);
    }
    for (let i = 0; i < this.values.length - 1; i++) {
      uint += this.values[this.values.length - 2 - i] << BigInt(shift);
      shift += BigInt(64);
    }
    return SplitUint256.fromUint(uint);
  }

  static LEFromString(str: string): IntsSequence {
    const ints_array: bigint[] = [];
    for (let i = 0; i < str.length; i += 8) {
      let bytes = Buffer.from(str.slice(i, i + 8));
      let leBytes = bytes.reverse();
      ints_array.push(BigInt(bytesToHex(leBytes)));
    }
    return new IntsSequence(ints_array, str.length);
  }

  static fromBytes(bytes: number[]): IntsSequence {
    const ints_array: bigint[] = [];
    for (let i = 0; i < bytes.length; i += 8) {
      ints_array.push(BigInt(bytesToHex(bytes.slice(i + 0, i + 8))));
    }
    return new IntsSequence(ints_array, bytes.length);
  }

  static fromUint(uint: bigint): IntsSequence {
    let hex = uint.toString(16);
    if (hex.length % 2 != 0) {
      hex = `0x0${hex}`;
    } else {
      hex = `0x${hex}`;
    }
    return IntsSequence.fromBytes(hexToBytes(hex));
  }
}

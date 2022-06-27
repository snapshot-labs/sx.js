import { utils, BigNumber } from 'ethers';
import { _TypedDataEncoder } from '@ethersproject/hash';

export const EIP712_TYPES = {
  Transaction: [
    {
      name: 'to',
      type: 'address'
    },
    {
      name: 'value',
      type: 'uint256'
    },
    {
      name: 'data',
      type: 'bytes'
    },
    {
      name: 'operation',
      type: 'uint8'
    },
    {
      name: 'nonce',
      type: 'uint256'
    }
  ]
};

export interface MetaTransaction {
  to: string;
  value: string | number | BigNumber;
  data: string;
  operation: number;
  nonce: number;
}

/**
 * Computes an execution hash and a set of transaction hashes for a proposal for L1 execution via the Zodiac Module
 * @param verifyingContract The verifying l1 contract
 * @param txs Array of meta transactions
 * @returns An array of transaction hashes and an overall keccak hash of those hashes
 */
export function createExecutionHash(
  txs: MetaTransaction[],
  verifyingContract: string,
  chainId: number
): {
  executionHash: string;
  txHashes: string[];
} {
  const domain = {
    chainId: chainId,
    verifyingContract: verifyingContract
  };
  const txHashes = txs.map((tx) => _TypedDataEncoder.hash(domain, EIP712_TYPES, tx));
  const abiCoder = new utils.AbiCoder();
  const executionHash = utils.keccak256(abiCoder.encode(['bytes32[]'], [txHashes]));
  return {
    executionHash: executionHash,
    txHashes: txHashes
  };
}

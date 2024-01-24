import { AbiCoder } from '@ethersproject/abi';
import type { MetaTransaction } from '../utils/encoding/execution-hash';

export default function createAxiomExecutor() {
  return {
    type: 'axiom',
    getExecutionData(executorAddress: string, transactions: MetaTransaction[]) {
      const abiCoder = new AbiCoder();

      const executionParams = abiCoder.encode(
        ['tuple(address to, uint256 value, bytes data, uint8 operation, uint256 salt)[]'],
        [transactions]
      );

      return {
        executor: executorAddress,
        executionParams: [executionParams]
      };
    }
  };
}

import { createExecutionHash, MetaTransaction } from '../utils/encoding/execution-hash';
import { SplitUint256 } from '../utils/split-uint256';

export class EthRelayerExecutor {
  executor: string;

  constructor(executor: string) {
    this.executor = executor;
  }

  getExecutionData(destination: string, transactions: MetaTransaction[], chainId: number) {
    const { executionHash } = createExecutionHash(transactions, destination, chainId);
    const executionHashSplit = SplitUint256.fromHex(executionHash);

    return {
      executor: this.executor,
      executionParams: [destination, executionHashSplit.low, executionHashSplit.high]
    };
  }
}

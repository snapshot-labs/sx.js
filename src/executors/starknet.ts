import { createStarknetExecutionParams, Call } from '../utils/encoding/starknet-execution-params';

export class StarknetExecutor {
  getExecutionData(calls: Call[]) {
    return {
      executor: '1',
      executionParams: createStarknetExecutionParams(calls)
    };
  }
}

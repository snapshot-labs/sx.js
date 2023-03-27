import createStarknetExecutor from './starknet';
import createVanillaExecutor from './vanilla';
import createEthRelayerExecutor from './ethRelayer';
import createAvatarExecutor from './avatar';
import type { ExecutorType, NetworkConfig, ExecutionInput } from '../types';

export function getEvmExecutionData(
  type: ExecutorType,
  executorAddress: string,
  input?: ExecutionInput
) {
  if (type === 'SimpleQuorumVanilla') {
    return createVanillaExecutor().getExecutionData(executorAddress);
  }

  if (['SimpleQuorumAvatar', 'SimpleQuorumTimelock'].includes(type) && input?.transactions) {
    return createAvatarExecutor().getExecutionData(executorAddress, input.transactions);
  }

  throw new Error(`Not enough data to create execution for executor ${executorAddress}`);
}

export function getExecutionData(
  executorAddress: string,
  networkConfig: NetworkConfig,
  input?: ExecutionInput
) {
  const executor = networkConfig.executors[executorAddress];
  if (!executor) throw new Error(`Unknown executor ${executorAddress}`);

  if (executor.type === 'starknet' && input?.calls) {
    return createStarknetExecutor().getExecutionData(executorAddress, input?.calls);
  }

  if (executor.type === 'ethRelayer' && input?.transactions) {
    return createEthRelayerExecutor(executor.params).getExecutionData(
      executorAddress,
      input.transactions
    );
  }

  if (executor.type === 'vanilla') {
    return createVanillaExecutor().getExecutionData(executorAddress);
  }

  if (executor.type === 'avatar' && input?.transactions) {
    return createAvatarExecutor().getExecutionData(executorAddress, input.transactions);
  }

  throw new Error(`Not enough data to create execution for executor ${executorAddress}`);
}

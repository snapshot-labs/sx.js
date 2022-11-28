import { hash } from 'starknet';
import { StarknetExecutor } from '../../../src/executors';

describe('StarknetExecutor', () => {
  const calls = [
    {
      to: '0x06AbD599AB530c5b3bc603111Bdd20d77890Db330402dC870Fc9866f50eD6d2A',
      functionSelector: hash.getSelectorFromName('transfer'),
      calldata: ['0x01']
    }
  ];

  it('should create execution data', () => {
    const executor = new StarknetExecutor();
    const data = executor.getExecutionData(calls);

    expect(data).toEqual({
      executor: '1',
      executionParams: [
        '0x5',
        '0x06AbD599AB530c5b3bc603111Bdd20d77890Db330402dC870Fc9866f50eD6d2A',
        '0x83afd3f4caedc6eebf44246fe54e38c95e3179a5ec9ea81740eca5b482d12e',
        '0x0',
        '0x1',
        '0x01'
      ]
    });
  });
});

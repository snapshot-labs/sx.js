import createStarknetExecutor from '../../../src/executors/starknet';

describe('starknetExecutor', () => {
  const starknetExecutor = createStarknetExecutor();

  const calls = [
    {
      contractAddress: '0x06AbD599AB530c5b3bc603111Bdd20d77890Db330402dC870Fc9866f50eD6d2A',
      entrypoint: 'transfer',
      calldata: ['0x01']
    }
  ];

  it('should create execution data', () => {
    const data = starknetExecutor.getExecutionData('1', calls);

    expect(data).toEqual({
      executor: '1',
      executionParams: []
    });
  });
});

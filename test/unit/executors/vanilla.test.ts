import { VanillaExecutor } from '../../../src/executors';

describe('VanillaExecutor', () => {
  const address = '0x70d94f64cfab000f8e26318f4413dfdaa1f19a3695e3222297edc62bbc936c7';

  it('should create execution data', () => {
    const executor = new VanillaExecutor(address);
    const data = executor.getExecutionData();

    expect(data).toEqual({
      executor: address,
      executionParams: []
    });
  });
});

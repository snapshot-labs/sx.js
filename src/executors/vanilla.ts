export class VanillaExecutor {
  executor: string;

  constructor(executor: string) {
    this.executor = executor;
  }

  getExecutionData() {
    return {
      executor: this.executor,
      executionParams: []
    };
  }
}

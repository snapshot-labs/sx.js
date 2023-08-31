module.exports = {
  setupFiles: ['<rootDir>/setup.ts'],
  roots: ['<rootDir>/unit'],
  sandboxInjectedGlobals: ['Math'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          types: ['jest']
        }
      }
    ]
  }
};

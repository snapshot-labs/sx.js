const baseConfig = require('./jest.config.base');

module.exports = {
  ...baseConfig,
  // TODO: EVM uses local node currently
  roots: ['<rootDir>/integration/starknet']
};

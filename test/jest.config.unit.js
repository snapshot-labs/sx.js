const baseConfig = require('./jest.config.base');

module.exports = {
  ...baseConfig,
  roots: ['<rootDir>/unit']
};

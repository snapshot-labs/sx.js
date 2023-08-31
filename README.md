# sx.js

### Running integration tests

Tests are run using [hardhat](https://hardhat.org/) and [starknet-hardhat-plugin](https://github.com/0xSpaceShard/starknet-hardhat-plugin).
Those tools are installed automatically when installing dependencies.

Make sure to have Docker installed to be able to run `starknet-devnet` container when running tests.

## Running sx-evm tests

```
yarn test:integration:evm
```

## Running sx-starknet tests

```
yarn test:integration:starknet
```

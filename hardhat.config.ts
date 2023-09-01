import { HardhatUserConfig } from 'hardhat/types';
import '@shardlabs/starknet-hardhat-plugin';
import '@nomiclabs/hardhat-ethers';

const config: HardhatUserConfig = {
  networks: {
    ethereumLocal: {
      url: 'http://localhost:8545',
      chainId: 31337
    },
    starknetLocal: {
      url: 'http://localhost:5050'
    }
  },
  starknet: {
    network: 'starknetLocal'
  }
};

export default config;

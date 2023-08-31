import { HardhatUserConfig } from 'hardhat/types';
import '@shardlabs/starknet-hardhat-plugin';
import '@nomiclabs/hardhat-ethers';

const config: HardhatUserConfig = {
  networks: {
    ethereumLocal: {
      url: 'http://localhost:8545',
      chainId: 31337
    },
    integratedDevnet: {
      url: 'http://127.0.0.1:5050',
      args: ['--seed', '1']
    }
  },
  starknet: {
    network: 'integratedDevnet'
  }
};

export default config;

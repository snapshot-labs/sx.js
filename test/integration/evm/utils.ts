import { ContractFactory, ContractInterface } from '@ethersproject/contracts';
import SpaceFactoryContract from './fixtures/SpaceFactory.json';
import VanillaAuthenciatorContract from './fixtures/VanillaAuthenticator.json';
import EthTxAuthenticatorContract from './fixtures/EthTxAuthenticator.json';
import EthSigAuthenticatorContract from './fixtures/EthSigAuthenticator.json';
import VanillaVotingStrategyContract from './fixtures/VanillaVotingStrategy.json';
import VanillaExecutionStrategyContract from './fixtures/VanillaExecutionStrategy.json';
import type { Signer } from '@ethersproject/abstract-signer';
import type { NetworkConfig } from '../../../src/types';

export type TestConfig = {
  spaceFactory: string;
  vanillaAuthenticator: string;
  ethTxAuthenticator: string;
  ethSigAuthenticator: string;
  votingStrategy: string;
  executionStrategy: string;
  networkConfig: NetworkConfig;
};

type ContractDetails = {
  abi: ContractInterface;
  bytecode: {
    object: string;
  };
};

export async function deployDependency(
  signer: Signer,
  contractDetails: ContractDetails,
  ...args: any[]
) {
  const factory = new ContractFactory(contractDetails.abi, contractDetails.bytecode.object, signer);

  const contract = await factory.deploy(...args);

  return contract.address;
}

export async function setup(signer: Signer): Promise<TestConfig> {
  const spaceFactory = await deployDependency(signer, SpaceFactoryContract);
  const vanillaAuthenticator = await deployDependency(signer, VanillaAuthenciatorContract);
  const ethTxAuthenticator = await deployDependency(signer, EthTxAuthenticatorContract);
  const ethSigAuthenticator = await deployDependency(
    signer,
    EthSigAuthenticatorContract,
    'SOC',
    '1'
  );
  const votingStrategy = await deployDependency(signer, VanillaVotingStrategyContract);
  const executionStrategy = await deployDependency(signer, VanillaExecutionStrategyContract);

  return {
    spaceFactory,
    vanillaAuthenticator,
    ethTxAuthenticator,
    ethSigAuthenticator,
    votingStrategy,
    executionStrategy,
    networkConfig: {
      spaceFactory: '0x00',
      authenticators: {
        [vanillaAuthenticator]: {
          type: 'vanilla'
        },
        [ethTxAuthenticator]: {
          type: 'ethTx'
        },
        [ethSigAuthenticator]: {
          type: 'ethSig'
        }
      },
      strategies: {
        [votingStrategy]: {
          type: 'vanilla'
        }
      },
      executors: {
        [executionStrategy]: {
          type: 'vanilla'
        }
      }
    }
  };
}

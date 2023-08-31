import { Account, CallData, uint256 } from 'starknet';
import { starknet } from 'hardhat';
import { hexPadLeft } from '../../../src/utils/encoding';
import { AddressType, Leaf, generateMerkleRoot } from '../../../src/utils/merkletree';
import sxFactoryCasm from './fixtures/sx_Factory.casm.json';
import sxFactorySierra from './fixtures/sx_Factory.sierra.json';
import sxErc20VotesPresetCasm from './fixtures/sx_ERC20VotesPreset.casm.json';
import sxErc20VotesPresetSierra from './fixtures/sx_ERC20VotesPreset.sierra.json';
import sxSpaceCasm from './fixtures/sx_Space.casm.json';
import sxSpaceSierra from './fixtures/sx_Space.sierra.json';
import sxVanillaAuthenticatorCasm from './fixtures/sx_VanillaAuthenticator.casm.json';
import sxVanillaAuthenticatorSierra from './fixtures/sx_VanillaAuthenticator.sierra.json';
import sxEthSigAuthenticatorCasm from './fixtures/sx_EthSigAuthenticator.casm.json';
import sxEthSigAuthenticatorSierra from './fixtures/sx_EthSigAuthenticator.sierra.json';
import sxEthTxAuthenticatorCasm from './fixtures/sx_EthTxAuthenticator.casm.json';
import sxEthTxAuthenticatorSierra from './fixtures/sx_EthTxAuthenticator.sierra.json';
import sxStarkSigAuthenticatorCasm from './fixtures/sx_StarkSigAuthenticator.casm.json';
import sxStarkSigAuthenticatorSierra from './fixtures/sx_StarkSigAuthenticator.sierra.json';
import sxStarkTxAuthenticatorCasm from './fixtures/sx_StarkTxAuthenticator.casm.json';
import sxStarkTxAuthenticatorSierra from './fixtures/sx_StarkTxAuthenticator.sierra.json';
import sxVanillaExecutionStrategyCasm from './fixtures/sx_VanillaExecutionStrategy.casm.json';
import sxVanillaExecutionStrategySierra from './fixtures/sx_VanillaExecutionStrategy.sierra.json';
import sxEthRelayerExecutionStrategyCasm from './fixtures/sx_EthRelayerExecutionStrategy.casm.json';
import sxEthRelayerExecutionStrategySierra from './fixtures/sx_EthRelayerExecutionStrategy.sierra.json';
import sxVanillaProposalValidationStrategyCasm from './fixtures/sx_VanillaProposalValidationStrategy.casm.json';
import sxVanillaProposalValidationStrategySierra from './fixtures/sx_VanillaProposalValidationStrategy.sierra.json';
import sxProposingPowerProposalValidationStrategyCasm from './fixtures/sx_ProposingPowerProposalValidationStrategy.casm.json';
import sxProposingPowerProposalValidationStrategySierra from './fixtures/sx_ProposingPowerProposalValidationStrategy.sierra.json';
import sxVanillaVotingStrategyCasm from './fixtures/sx_VanillaVotingStrategy.casm.json';
import sxVanillaVotingStrategySierra from './fixtures/sx_VanillaVotingStrategy.sierra.json';
import sxMerkleWhitelistVotingStrategyCasm from './fixtures/sx_MerkleWhitelistVotingStrategy.casm.json';
import sxMerkleWhitelistVotingStrategySierra from './fixtures/sx_MerkleWhitelistVotingStrategy.sierra.json';
import sxErc20VotesVotingStrategyCasm from './fixtures/sx_ERC20VotesVotingStrategy.casm.json';
import sxErc20VotesVotingStrategySierra from './fixtures/sx_ERC20VotesVotingStrategy.sierra.json';
import { NetworkConfig } from '../../../src/types';
import { StarkNetTx } from '../../../src/clients';

const L1_COMMIT = '0x8bf85537c80becba711447f66a9a4452e3575e29';

export type TestConfig = {
  owner: string;
  factory: string;
  erc20VotesToken: string;
  spaceAddress: string;
  vanillaAuthenticator: string;
  ethSigAuthenticator: string;
  ethTxAuthenticator: string;
  starkSigAuthenticator: string;
  starkTxAuthenticator: string;
  vanillaExecutionStrategy: string;
  ethRelayerExecutionStrategy: string;
  vanillaProposalValidationStrategy: string;
  proposingPowerProposalValidationStrategy: string;
  vanillaVotingStrategy: string;
  merkleWhitelistVotingStrategy: string;
  erc20VotesVotingStrategy: string;
  merkleWhitelistStrategyMetadata: {
    tree: {
      type: AddressType;
      address: string;
      votingPower: bigint;
    }[];
  };
  networkConfig: NetworkConfig;
};

async function deployDependency(account: Account, sierra: any, casm: any, args: any[] = []) {
  const {
    deploy: { contract_address }
  } = await account.declareAndDeploy({
    contract: sierra,
    casm,
    constructorCalldata: args
  });

  return contract_address;
}

export async function setup(account: Account): Promise<TestConfig> {
  const masterSpaceResult = await account.declareIfNot({
    contract: sxSpaceSierra as any,
    casm: sxSpaceCasm as any
  });

  const factoryResult = await account.declareAndDeploy({
    contract: sxFactorySierra as any,
    casm: sxFactoryCasm as any
  });

  const erc20VotesToken = await deployDependency(
    account,
    sxErc20VotesPresetSierra,
    sxErc20VotesPresetCasm,
    CallData.compile({
      name: 'VOTES',
      symbol: 'VOTES',
      supply: uint256.bnToUint256(1000n),
      owner: account.address
    })
  );

  await account.execute({
    contractAddress: erc20VotesToken,
    entrypoint: 'delegate',
    calldata: CallData.compile({
      delegatee: account.address
    })
  });

  const vanillaAuthenticator = await deployDependency(
    account,
    sxVanillaAuthenticatorSierra,
    sxVanillaAuthenticatorCasm
  );

  const ethSigAuthenticator = await deployDependency(
    account,
    sxEthSigAuthenticatorSierra,
    sxEthSigAuthenticatorCasm
  );

  const ethTxAuthenticator = await deployDependency(
    account,
    sxEthTxAuthenticatorSierra,
    sxEthTxAuthenticatorCasm,
    CallData.compile({
      starknet_commit_address: {
        address: L1_COMMIT
      }
    })
  );

  const starkSigAuthenticator = await deployDependency(
    account,
    sxStarkSigAuthenticatorSierra,
    sxStarkSigAuthenticatorCasm,
    CallData.compile({
      name: 'sx-sn',
      version: '0.1.0'
    })
  );

  const starkTxAuthenticator = await deployDependency(
    account,
    sxStarkTxAuthenticatorSierra,
    sxStarkTxAuthenticatorCasm
  );

  const vanillaExecutionStrategy = await deployDependency(
    account,
    sxVanillaExecutionStrategySierra,
    sxVanillaExecutionStrategyCasm,
    [1, 0]
  );

  const ethRelayerExecutionStrategy = await deployDependency(
    account,
    sxEthRelayerExecutionStrategySierra,
    sxEthRelayerExecutionStrategyCasm
  );

  const vanillaProposalValidationStrategy = await deployDependency(
    account,
    sxVanillaProposalValidationStrategySierra,
    sxVanillaProposalValidationStrategyCasm
  );

  const proposingPowerProposalValidationStrategy = await deployDependency(
    account,
    sxProposingPowerProposalValidationStrategySierra,
    sxProposingPowerProposalValidationStrategyCasm
  );

  const vanillaVotingStrategy = await deployDependency(
    account,
    sxVanillaVotingStrategySierra,
    sxVanillaVotingStrategyCasm
  );

  const merkleWhitelistVotingStrategy = await deployDependency(
    account,
    sxMerkleWhitelistVotingStrategySierra,
    sxMerkleWhitelistVotingStrategyCasm
  );

  const erc20VotesVotingStrategy = await deployDependency(
    account,
    sxErc20VotesVotingStrategySierra,
    sxErc20VotesVotingStrategyCasm
  );

  const masterSpaceClassHash = masterSpaceResult.class_hash;
  const factoryAddress = factoryResult.deploy.contract_address;

  const leaf = new Leaf(AddressType.ETHEREUM, '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 42n);
  const merkleWhitelistStrategyMetadata = {
    tree: [leaf].map(leaf => ({
      type: leaf.type,
      address: leaf.address,
      votingPower: leaf.votingPower
    }))
  };
  const hashes = [leaf.hash];

  const merkleTreeRoot = generateMerkleRoot(hashes);

  const networkConfig: NetworkConfig = {
    eip712ChainId: '0x534e5f474f45524c49',
    spaceFactory: factoryAddress,
    masterSpace: masterSpaceClassHash as string,
    authenticators: {
      [hexPadLeft(vanillaAuthenticator)]: {
        type: 'vanilla'
      },
      [hexPadLeft(ethSigAuthenticator)]: {
        type: 'ethSig'
      },
      [hexPadLeft(ethTxAuthenticator)]: {
        type: 'ethTx'
      },
      [hexPadLeft(starkSigAuthenticator)]: {
        type: 'starkSig'
      },
      [hexPadLeft(starkTxAuthenticator)]: {
        type: 'starkTx'
      }
    },
    strategies: {
      [hexPadLeft(vanillaVotingStrategy)]: {
        type: 'vanilla'
      },
      [hexPadLeft(merkleWhitelistVotingStrategy)]: {
        type: 'whitelist'
      },
      [hexPadLeft(erc20VotesVotingStrategy)]: {
        type: 'erc20Votes'
      }
    }
  };

  const client = new StarkNetTx({
    starkProvider: account,
    ethUrl: 'https://rpc.brovider.xyz/5',
    networkConfig
  });

  const txId = await client.deploySpace({
    account,
    params: {
      controller: account.address,
      votingDelay: 0,
      minVotingDuration: 0,
      maxVotingDuration: 86400,
      proposalValidationStrategy: {
        addr: proposingPowerProposalValidationStrategy,
        params: CallData.compile({
          threshold: uint256.bnToUint256(1),
          allowed_strategies: [
            {
              address: vanillaVotingStrategy,
              params: ['0x0']
            },
            {
              address: merkleWhitelistVotingStrategy,
              params: [merkleTreeRoot]
            },
            {
              address: erc20VotesVotingStrategy,
              params: [erc20VotesToken]
            }
          ]
        })
      },
      metadataUri: 'ipfs://QmQnbnRF7vsFXYi4ivED2RSmZNC7wi4QKWhFMzSsGjEWp7',
      daoUri: '',
      authenticators: [
        vanillaAuthenticator,
        ethSigAuthenticator,
        ethTxAuthenticator,
        starkSigAuthenticator,
        starkTxAuthenticator
      ],
      votingStrategies: [
        {
          addr: vanillaVotingStrategy,
          params: ['0x0']
        },
        {
          addr: merkleWhitelistVotingStrategy,
          params: [merkleTreeRoot]
        },
        {
          addr: erc20VotesVotingStrategy,
          params: [erc20VotesToken]
        }
      ],
      votingStrategiesMetadata: ['', '', '']
    }
  });

  const receipt = await account.getTransactionReceipt(txId);
  const spaceAddress = (receipt as any).events[0].from_address; // hacky right now, find better way to read it, returned value is not what we expect

  return {
    owner: account.address,
    factory: factoryAddress,
    erc20VotesToken,
    spaceAddress,
    vanillaAuthenticator,
    ethSigAuthenticator,
    ethTxAuthenticator,
    starkSigAuthenticator,
    starkTxAuthenticator,
    vanillaExecutionStrategy,
    ethRelayerExecutionStrategy,
    vanillaProposalValidationStrategy,
    proposingPowerProposalValidationStrategy,
    vanillaVotingStrategy,
    merkleWhitelistVotingStrategy,
    erc20VotesVotingStrategy,
    merkleWhitelistStrategyMetadata,
    networkConfig
  };
}

export async function postMessageToL2(
  l2Address: string,
  functionName: string,
  payload: string[],
  fee: number
) {
  return starknet.devnet.sendMessageToL2(l2Address, functionName, L1_COMMIT, payload, 0, fee);
}

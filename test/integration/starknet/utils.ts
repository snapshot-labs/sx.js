import { Account, CallData, hash, shortString, uint256 } from 'starknet';
import { hexPadLeft } from '../../../src/utils/encoding';
import { AddressType, Leaf, generateMerkleRoot } from '../../../src/utils/merkletree';
import sxFactoryCasm from './fixtures/sx_Factory.casm.json';
import sxFactorySierra from './fixtures/sx_Factory.sierra.json';
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
import sxVanillaProposalValidationStrategyCasm from './fixtures/sx_VanillaProposalValidationStrategy.casm.json';
import sxVanillaProposalValidationStrategySierra from './fixtures/sx_VanillaProposalValidationStrategy.sierra.json';
import sxProposingPowerProposalValidationStrategyCasm from './fixtures/sx_ProposingPowerProposalValidationStrategy.casm.json';
import sxProposingPowerProposalValidationStrategySierra from './fixtures/sx_ProposingPowerProposalValidationStrategy.sierra.json';
import sxVanillaVotingStrategyCasm from './fixtures/sx_VanillaVotingStrategy.casm.json';
import sxVanillaVotingStrategySierra from './fixtures/sx_VanillaVotingStrategy.sierra.json';
import sxMerkleWhitelistVotingStrategyCasm from './fixtures/sx_MerkleWhitelistVotingStrategy.casm.json';
import sxMerkleWhitelistVotingStrategySierra from './fixtures/sx_MerkleWhitelistVotingStrategy.sierra.json';
import { NetworkConfig } from '../../../src/types';
import { StarkNetTx } from '../../../src/clients';

const L1_COMMIT = '0x8bf85537c80becba711447f66a9a4452e3575e29';

export type TestConfig = {
  owner: string;
  factory: string;
  spaceAddress: string;
  vanillaAuthenticator: string;
  ethSigAuthenticator: string;
  ethTxAuthenticator: string;
  starkSigAuthenticator: string;
  starkTxAuthenticator: string;
  vanillaExecutionStrategy: string;
  vanillaProposalValidationStrategy: string;
  proposingPowerProposalValidationStrategy: string;
  vanillaVotingStrategy: string;
  merkleWhitelistVotingStrategy: string;
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
  const masterSpaceResult = await account.declareAndDeploy({
    contract: sxSpaceSierra as any,
    casm: sxSpaceCasm as any,
    constructorCalldata: CallData.compile({
      owner: account.address,
      min_voting_duration: 0,
      max_voting_duration: 86400,
      voting_delay: 0,
      proposal_validation_strategy: {
        address: '0x0',
        params: []
      },
      proposal_validation_strategy_metadata_URI: shortString.splitLongString('ipfs://'),
      voting_strategies: [],
      voting_strategies_metadata_URIs: [],
      authenticators: [],
      metadata_URI: shortString.splitLongString('ipfs://'),
      dao_URI: shortString.splitLongString('ipfs://')
    })
  });

  const factoryResult = await account.declareAndDeploy({
    contract: sxFactorySierra as any,
    casm: sxFactoryCasm as any
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

  const masterSpaceClassHash = masterSpaceResult.declare.class_hash;
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
      }
    },
    executors: {
      [hexPadLeft(vanillaExecutionStrategy)]: {
        type: 'vanilla'
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
            }
          ]
        })
      },
      metadataUri: 'ipfs://QmNrm6xKuib1THtWkiN5CKtBEerQCDpUtmgDqiaU2xDmca',
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
        }
      ],
      votingStrategiesMetadata: ['', '']
    }
  });

  const receipt = await account.getTransactionReceipt(txId);
  const spaceAddress = (receipt as any).events[0].from_address; // hacky right now, find better way to read it, returned value is not what we expect

  return {
    owner: account.address,
    factory: factoryAddress,
    spaceAddress,
    vanillaAuthenticator,
    ethSigAuthenticator,
    ethTxAuthenticator,
    starkSigAuthenticator,
    starkTxAuthenticator,
    vanillaExecutionStrategy,
    vanillaProposalValidationStrategy,
    proposingPowerProposalValidationStrategy,
    vanillaVotingStrategy,
    merkleWhitelistVotingStrategy,
    merkleWhitelistStrategyMetadata,
    networkConfig
  };
}

export async function postMessageToL2(
  l2Address: string,
  selector: string,
  payload: string[],
  fee: number
) {
  const res = await fetch('http://127.0.0.1:5050/postman/send_message_to_l2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      l1_contract_address: L1_COMMIT,
      l2_contract_address: l2Address,
      entry_point_selector: hash.getSelectorFromName(selector),
      payload,
      paid_fee_on_l1: `0x${fee.toString(16)}`,
      nonce: '0x0'
    })
  });

  return res.json();
}

import { Account, CallData, hash } from 'starknet';
import { hexPadLeft } from '../../../src/utils/encoding';
import sxFactoryCasm from './fixtures/sx_Factory.casm.json';
import sxFactorySierra from './fixtures/sx_Factory.sierra.json';
import sxSpaceCasm from './fixtures/sx_Space.casm.json';
import sxSpaceSierra from './fixtures/sx_Space.sierra.json';
import sxVanillaAuthenticatorCasm from './fixtures/sx_VanillaAuthenticator.casm.json';
import sxVanillaAuthenticatorSierra from './fixtures/sx_VanillaAuthenticator.sierra.json';
import sxEthTxAuthenticatorCasm from './fixtures/sx_EthTxAuthenticator.casm.json';
import sxEthTxAuthenticatorSierra from './fixtures/sx_EthTxAuthenticator.sierra.json';
import sxStarkSigAuthenticatorCasm from './fixtures/sx_StarkSigAuthenticator.casm.json';
import sxStarkSigAuthenticatorSierra from './fixtures/sx_StarkSigAuthenticator.sierra.json';
import sxVanillaExecutionStrategyCasm from './fixtures/sx_VanillaExecutionStrategy.casm.json';
import sxVanillaExecutionStrategySierra from './fixtures/sx_VanillaExecutionStrategy.sierra.json';
import sxVanillaProposalValidationStrategyCasm from './fixtures/sx_VanillaProposalValidationStrategy.casm.json';
import sxVanillaProposalValidationStrategySierra from './fixtures/sx_VanillaProposalValidationStrategy.sierra.json';
import sxVanillaVotingStrategyCasm from './fixtures/sx_VanillaVotingStrategy.casm.json';
import sxVanillaVotingStrategySierra from './fixtures/sx_VanillaVotingStrategy.sierra.json';
import { NetworkConfig } from '../../../src/types';
import { StarkNetTx } from '../../../src/clients';

const L1_COMMIT = '0x8bf85537c80becba711447f66a9a4452e3575e29';

export type TestConfig = {
  owner: string;
  factory: string;
  spaceAddress: string;
  vanillaAuthenticator: string;
  ethTxAuthenticator: string;
  starkSigAuthenticator: string;
  vanillaExecutionStrategy: string;
  vanillaProposalValidationStrategy: string;
  vanillaVotingStrategy: string;
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
      voting_strategies: [],
      authenticators: []
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

  const vanillaVotingStrategy = await deployDependency(
    account,
    sxVanillaVotingStrategySierra,
    sxVanillaVotingStrategyCasm
  );

  const masterSpaceClassHash = masterSpaceResult.declare.class_hash;
  const factoryAddress = factoryResult.deploy.contract_address;

  const networkConfig: NetworkConfig = {
    eip712ChainId: 5,
    starknetEip712ChainId: '0x534e5f474f45524c49',
    spaceFactory: factoryAddress,
    masterSpace: masterSpaceClassHash as string,
    authenticators: {
      [hexPadLeft(vanillaAuthenticator)]: {
        type: 'vanilla'
      },
      [hexPadLeft(ethTxAuthenticator)]: {
        type: 'ethTx'
      },
      [hexPadLeft(starkSigAuthenticator)]: {
        type: 'starkSig'
      }
    },
    strategies: {
      [hexPadLeft(vanillaVotingStrategy)]: {
        type: 'vanilla'
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
        addr: vanillaProposalValidationStrategy,
        params: '0x0'
      },
      metadataUri: 'ipfs://QmNrm6xKuib1THtWkiN5CKtBEerQCDpUtmgDqiaU2xDmca',
      authenticators: [vanillaAuthenticator, ethTxAuthenticator],
      votingStrategies: [
        {
          addr: vanillaVotingStrategy,
          params: '0x0'
        }
      ]
    }
  });

  const receipt = await account.getTransactionReceipt(txId);
  const spaceAddress = (receipt as any).events[0].from_address; // hacky right now, find better way to read it, returned value is not what we expect

  return {
    owner: account.address,
    factory: factoryAddress,
    spaceAddress,
    vanillaAuthenticator,
    ethTxAuthenticator,
    starkSigAuthenticator,
    vanillaExecutionStrategy,
    vanillaProposalValidationStrategy,
    vanillaVotingStrategy,
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

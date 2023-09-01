import { Account, CallData, hash, uint256 } from 'starknet';
import { Signer } from '@ethersproject/abstract-signer';
import { Interface } from '@ethersproject/abi';
import { Contract, ContractFactory, ContractInterface } from '@ethersproject/contracts';
import { Wallet } from '@ethersproject/wallet';
import { ethers } from 'hardhat';
import { StarkNetTx } from '../../../src/clients';
import { executeContractCallWithSigners } from './safeUtils';
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
import GnosisSafeL2Contract from './fixtures/l1/GnosisSafeL2.json';
import GnosisSafeProxyFactoryContract from './fixtures/l1/GnosisSafeProxyFactory.json';
import ModuleProxyFactoryContract from './fixtures/l1/ModuleProxyFactory.json';
import L1AvatarExecutionStrategyMockMessagingContract from './fixtures/l1/L1AvatarExecutionStrategyMockMessaging.json';
import MockStarknetMessaging from './fixtures/l1/MockStarknetMessaging.json';
import { NetworkConfig } from '../../../src/types';

const L1_COMMIT = '0x8bf85537c80becba711447f66a9a4452e3575e29';

export type TestConfig = {
  starknetCore: string;
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
  l1AvatarExecutionStrategyContract: Contract;
  safeContract: Contract;
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

async function deployL1Dependency(
  signer: Signer,
  contractDetails: {
    abi: ContractInterface;
    bytecode: string;
  },
  ...args: any[]
) {
  const factory = new ContractFactory(contractDetails.abi, contractDetails.bytecode, signer);

  const contract = await factory.deploy(...args);

  return contract.address;
}

export async function setup({
  starknetAccount,
  ethereumWallet
}: {
  starknetAccount: Account;
  ethereumWallet: Wallet;
}): Promise<TestConfig> {
  const masterSpaceResult = await starknetAccount.declareIfNot({
    contract: sxSpaceSierra as any,
    casm: sxSpaceCasm as any
  });

  const factoryResult = await starknetAccount.declareAndDeploy({
    contract: sxFactorySierra as any,
    casm: sxFactoryCasm as any
  });

  const erc20VotesToken = await deployDependency(
    starknetAccount,
    sxErc20VotesPresetSierra,
    sxErc20VotesPresetCasm,
    CallData.compile({
      name: 'VOTES',
      symbol: 'VOTES',
      supply: uint256.bnToUint256(1000n),
      owner: starknetAccount.address
    })
  );

  await starknetAccount.execute({
    contractAddress: erc20VotesToken,
    entrypoint: 'delegate',
    calldata: CallData.compile({
      delegatee: starknetAccount.address
    })
  });

  const vanillaAuthenticator = await deployDependency(
    starknetAccount,
    sxVanillaAuthenticatorSierra,
    sxVanillaAuthenticatorCasm
  );

  const ethSigAuthenticator = await deployDependency(
    starknetAccount,
    sxEthSigAuthenticatorSierra,
    sxEthSigAuthenticatorCasm
  );

  const ethTxAuthenticator = await deployDependency(
    starknetAccount,
    sxEthTxAuthenticatorSierra,
    sxEthTxAuthenticatorCasm,
    CallData.compile({
      starknet_commit_address: {
        address: L1_COMMIT
      }
    })
  );

  const starkSigAuthenticator = await deployDependency(
    starknetAccount,
    sxStarkSigAuthenticatorSierra,
    sxStarkSigAuthenticatorCasm,
    CallData.compile({
      name: 'sx-sn',
      version: '0.1.0'
    })
  );

  const starkTxAuthenticator = await deployDependency(
    starknetAccount,
    sxStarkTxAuthenticatorSierra,
    sxStarkTxAuthenticatorCasm
  );

  const vanillaExecutionStrategy = await deployDependency(
    starknetAccount,
    sxVanillaExecutionStrategySierra,
    sxVanillaExecutionStrategyCasm,
    [1, 0]
  );

  const ethRelayerExecutionStrategy = await deployDependency(
    starknetAccount,
    sxEthRelayerExecutionStrategySierra,
    sxEthRelayerExecutionStrategyCasm
  );

  const vanillaProposalValidationStrategy = await deployDependency(
    starknetAccount,
    sxVanillaProposalValidationStrategySierra,
    sxVanillaProposalValidationStrategyCasm
  );

  const proposingPowerProposalValidationStrategy = await deployDependency(
    starknetAccount,
    sxProposingPowerProposalValidationStrategySierra,
    sxProposingPowerProposalValidationStrategyCasm
  );

  const vanillaVotingStrategy = await deployDependency(
    starknetAccount,
    sxVanillaVotingStrategySierra,
    sxVanillaVotingStrategyCasm
  );

  const merkleWhitelistVotingStrategy = await deployDependency(
    starknetAccount,
    sxMerkleWhitelistVotingStrategySierra,
    sxMerkleWhitelistVotingStrategyCasm
  );

  const erc20VotesVotingStrategy = await deployDependency(
    starknetAccount,
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
    starkProvider: starknetAccount,
    ethUrl: 'https://rpc.brovider.xyz/5',
    networkConfig
  });

  const txId = await client.deploySpace({
    account: starknetAccount,
    params: {
      controller: starknetAccount.address,
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

  const receipt = await starknetAccount.getTransactionReceipt(txId);
  const spaceAddress = (receipt as any).events[0].from_address; // hacky right now, find better way to read it, returned value is not what we expect

  const { l1AvatarExecutionStrategyContract, safeContract, starknetCore } =
    await setupL1ExecutionStrategy(ethereumWallet, {
      spaceAddress,
      ethRelayerAddress: ethRelayerExecutionStrategy,
      quorum: 1n
    });

  return {
    starknetCore,
    owner: starknetAccount.address,
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
    l1AvatarExecutionStrategyContract,
    safeContract,
    networkConfig
  };
}

export async function setupL1ExecutionStrategy(
  signer: Wallet,
  {
    spaceAddress,
    ethRelayerAddress,
    quorum
  }: {
    spaceAddress: string;
    ethRelayerAddress: string;
    quorum: bigint;
  }
) {
  const signerAddress = await signer.getAddress();

  const singleton = await deployL1Dependency(signer, GnosisSafeL2Contract);
  const factory = await deployL1Dependency(signer, GnosisSafeProxyFactoryContract);
  const starknetCore = await deployL1Dependency(signer, MockStarknetMessaging, 5 * 60);

  const gnosisSafeProxyFactoryContract = new Contract(
    factory,
    GnosisSafeProxyFactoryContract.abi,
    signer
  );

  const template = await gnosisSafeProxyFactoryContract.callStatic.createProxy(singleton, '0x');
  await gnosisSafeProxyFactoryContract.createProxy(singleton, '0x');

  const safeContract = new Contract(template, GnosisSafeL2Contract.abi, signer);
  await safeContract.setup(
    [signerAddress],
    1,
    ethers.constants.AddressZero,
    '0x',
    ethers.constants.AddressZero,
    ethers.constants.AddressZero,
    0,
    ethers.constants.AddressZero
  );

  const moduleFactory = await deployL1Dependency(signer, ModuleProxyFactoryContract);
  const masterL1AvatarExecutionStrategy = await deployL1Dependency(
    signer,
    L1AvatarExecutionStrategyMockMessagingContract,
    '0x0000000000000000000000000000000000000001',
    '0x0000000000000000000000000000000000000001',
    '0x0000000000000000000000000000000000000001',
    1,
    [],
    0
  );

  const encodedInitParams = ethers.utils.defaultAbiCoder.encode(
    ['address', 'address', 'address', 'uint256', 'uint256[]', 'uint256'],
    [template, template, starknetCore, ethRelayerAddress, [spaceAddress], quorum]
  );

  const l1AvatarExecutionStrategyMockMessagingInterface = new Interface(
    L1AvatarExecutionStrategyMockMessagingContract.abi
  );
  const initData = l1AvatarExecutionStrategyMockMessagingInterface.encodeFunctionData('setUp', [
    encodedInitParams
  ]);

  const masterCopyAddress = masterL1AvatarExecutionStrategy.toLowerCase().replace(/^0x/, '');

  //This is the bytecode of the module proxy contract
  const byteCode = `0x602d8060093d393df3363d3d373d3d3d363d73${masterCopyAddress}5af43d82803e903d91602b57fd5bf3`;

  const salt = ethers.utils.solidityKeccak256(
    ['bytes32', 'uint256'],
    [ethers.utils.solidityKeccak256(['bytes'], [initData]), '0x01']
  );

  // TODO: can it be deployed without proxy?
  const expectedAddress = ethers.utils.getCreate2Address(
    moduleFactory,
    salt,
    ethers.utils.keccak256(byteCode)
  );

  const moduleFactoryContract = new Contract(moduleFactory, ModuleProxyFactoryContract.abi, signer);
  await moduleFactoryContract.deployModule(masterL1AvatarExecutionStrategy, initData, '0x01');

  const l1AvatarExecutionStrategyContract = new Contract(
    expectedAddress,
    L1AvatarExecutionStrategyMockMessagingContract.abi
  );

  await executeContractCallWithSigners(
    safeContract,
    safeContract,
    'enableModule',
    [expectedAddress],
    [signer]
  );

  return {
    starknetCore,
    l1AvatarExecutionStrategyContract,
    safeContract
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

export async function setTime(time: number) {
  const res = await fetch('http://127.0.0.1:5050/set_time', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      time
    })
  });

  return res.json();
}

export async function increaseTime(timeIncrease: number) {
  const res = await fetch('http://127.0.0.1:5050/increase_time', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      time: timeIncrease
    })
  });

  return res.json();
}

export async function loadL1MessagingContract(networkUrl: string, address: string) {
  const res = await fetch('http://127.0.0.1:5050/postman/load_l1_messaging_contract', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      networkUrl,
      address
    })
  });

  return res.json();
}

export async function flush() {
  const res = await fetch('http://127.0.0.1:5050/postman/flush', {
    method: 'POST'
  });

  return res.json();
}

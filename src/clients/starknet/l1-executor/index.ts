import { Signer } from '@ethersproject/abstract-signer';
import { Contract, ContractFactory } from '@ethersproject/contracts';
import L1ExecutorContract from './abis/L1AvatarExecutionStrategy.json';

type DeployParams = {
  owner: string;
  target: string;
  starknetCore: string;
  executionRelayer: string;
  starknetSpaces: string[];
  quorum: bigint;
};

type ExecuteParams = {
  executor: string;
  space: string;
  proposal: {
    startTimestamp: bigint;
    minEndTimestamp: bigint;
    maxEndTimestamp: bigint;
    finalizationStatus: 0 | 1 | 2;
    executionPayloadHash: string;
    executionStrategy: string;
    authorAddressType: 0 | 1 | 2;
    author: string;
    activeVotingStrategies: string;
  };
  votesFor: string;
  votesAgainst: string;
  votesAbstain: string;
  executionHash: string;
  payload: string;
};

export class L1Executor {
  async deploy({
    signer,
    params: { owner, target, starknetCore, executionRelayer, starknetSpaces, quorum }
  }: {
    signer: Signer;
    params: DeployParams;
  }) {
    const factory = new ContractFactory(
      L1ExecutorContract.abi,
      L1ExecutorContract.bytecode.object,
      signer
    );

    const deploy = await factory.deploy(
      owner,
      target,
      starknetCore,
      executionRelayer,
      starknetSpaces,
      quorum
    );

    return {
      address: deploy.address,
      txId: deploy.deployTransaction.hash
    };
  }

  async execute({
    signer,
    executor,
    space,
    proposal,
    votesFor,
    votesAgainst,
    votesAbstain,
    executionHash,
    payload
  }: {
    signer: Signer;
  } & ExecuteParams) {
    const contract = new Contract(executor, L1ExecutorContract.abi, signer);

    return contract.execute(
      space,
      proposal,
      votesFor,
      votesAgainst,
      votesAbstain,
      executionHash,
      payload
    );
  }
}

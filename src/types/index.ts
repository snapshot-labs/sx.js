import type { BigNumberish, Provider } from 'starknet';
import type { Call } from 'starknet';
import type { MetaTransaction } from '../utils/encoding';
import type { NetworkConfig } from './networkConfig';

export * from './networkConfig';

export enum Choice {
  Against = 0,
  For = 1,
  Abstain = 2
}

export type ProposeCallArgs = {
  author: string;
  executionStrategy: {
    address: string;
    params: string;
  };
  strategiesParams: string[];
};

export type VoteCallArgs = {
  voter: string;
  proposalId: number;
  choice: number;
  votingStrategies: IndexedConfig[];
};

export type UpdateProposalCallArgs = {
  author: string;
  proposalId: number;
  executionStrategy: {
    address: string;
    params: string;
  };
};

export type Authenticator = {
  type: string;
  createProposeCall(envelope: Envelope<Propose>, args: ProposeCallArgs): Call;
  createVoteCall(envelope: Envelope<Vote>, args: VoteCallArgs): Call;
  createUpdateProposalCall(envelope: Envelope<UpdateProposal>, args: UpdateProposalCallArgs): Call;
};

export interface Strategy {
  type: string;
  getParams(
    call: 'propose' | 'vote',
    address: string,
    index: number,
    envelope: Envelope<Message>,
    clientConfig: ClientConfig
  ): Promise<string>;
  getExtraProposeCalls(
    address: string,
    index: number,
    envelope: Envelope<Message>,
    clientConfig: ClientConfig
  ): Promise<Call[]>;
  getVotingPower: (
    strategyAddress: string,
    voterAddress: string,
    timestamp: number,
    params: string[],
    clientConfig: ClientConfig
  ) => Promise<bigint>;
}

export type ClientOpts = {
  ethUrl: string;
  starkProvider: Provider;
  networkConfig?: NetworkConfig;
};

export type ClientConfig = {
  ethUrl: string;
  starkProvider: Provider;
  networkConfig: NetworkConfig;
};

export type EthereumSigClientOpts = ClientOpts & {
  manaUrl: string;
};

export type EthereumSigClientConfig = ClientConfig & {
  manaUrl: string;
};

// TODO: normalize with EVM
export type AddressConfig = {
  addr: string;
  params: string;
};

export type IndexedConfig = {
  index: number;
  params: string;
};

export type StrategyConfig = {
  index: number;
  address: string;
};

export type Propose = {
  space: string;
  authenticator: string;
  strategies: StrategyConfig[];
  executionStrategy: AddressConfig;
  metadataUri: string;
};

export type UpdateProposal = {
  space: string;
  proposal: number;
  authenticator: string;
  executionStrategy: AddressConfig;
  metadataUri: string;
};

export type Vote = {
  space: string;
  authenticator: string;
  strategies: StrategyConfig[];
  proposal: number;
  choice: Choice;
};

export type Message = Propose | Vote | UpdateProposal;

export type Envelope<T extends Message> = {
  address: string;
  sig?: [bigint, bigint];
  data: T;
};

export type StarknetEIP712ProposeMessage = {
  space: string;
  author: string;
  executionStrategy: {
    address: string;
    params: string[];
  };
  userProposalValidationParams: string[];
  salt: string;
};

export type StarknetEIP712UpdateProposalMessage = {
  space: string;
  author: string;
  proposalId: { low: BigNumberish; high: BigNumberish };
  executionStrategy: {
    address: string;
    params: string[];
  };
  salt: string;
};

export type StarknetEIP712VoteMessage = {
  space: string;
  voter: string;
  proposalId: { low: BigNumberish; high: BigNumberish };
  choice: string;
  userVotingStrategies: { index: number; params: string[] }[];
};

export type StrategiesAddresses = { index: number; address: string }[];

export type ExecutionInput = {
  calls?: Call[];
  transactions?: MetaTransaction[];
};

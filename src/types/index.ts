import type { Provider } from 'starknet';
import type { Call } from 'starknet';
import type { MetaTransaction } from '../utils/encoding';
import type { NetworkConfig } from './networkConfig';

export * from './networkConfig';

export enum Choice {
  Against = 0,
  For = 1,
  Abstain = 2
}

export type Authenticator = {
  type: string;
  createCall(envelope: Envelope<Message>, selector: string, calldata: string[]): Call;
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

export type VanillaProposeMessage = Propose;
export type VanillaVoteMessage = Vote;
export type EthSigProposeMessage = {
  space: string;
  authenticator: string;
  strategies: number[];
  executor: string;
  executionParams: string[];
  metadataUri: string;
  author: string;
  executionHash: string;
  strategiesHash: string;
  strategiesParamsHash: string;
  salt: number;
};
export type EthSigVoteMessage = {
  space: string;
  authenticator: string;
  strategies: number[];
  voter: string;
  strategiesHash: string;
  strategiesParamsHash: string;
  salt: number;
};

export type Message =
  | VanillaProposeMessage
  | VanillaVoteMessage
  | UpdateProposal
  | EthSigProposeMessage
  | EthSigVoteMessage;

export type Envelope<T extends Message> = {
  address: string;
  sig: T extends EthSigProposeMessage | EthSigVoteMessage ? string : null;
  data: {
    message: T;
  };
};

export type StrategiesAddresses = { index: number; address: string }[];

export type ExecutionInput = {
  calls?: Call[];
  transactions?: MetaTransaction[];
};

export type ExecutorType = 'SimpleQuorumVanilla' | 'SimpleQuorumAvatar' | 'SimpleQuorumTimelock';

export type VanillaAuthenticatorConfig = {
  type: 'vanilla';
};

export type EthTxAuthenticatorConfig = {
  type: 'ethTx';
};

export type EthSigAuthenticatorConfig = {
  type: 'ethSig';
};

export type StarkSigAuthenticatorConfig = {
  type: 'starkSig';
};

export type StarkTxAuthenticatorConfig = {
  type: 'starkTx';
};

export type VanillaStrategyConfig = {
  type: 'vanilla';
};

export type CompStrategyConfig = {
  type: 'comp';
};

export type OzVotesStrategyConfig = {
  type: 'ozVotes';
};

export type WhitelistStrategyConfig = {
  type: 'whitelist';
};

export type SingleSlotProofStrategyConfig = {
  type: 'singleSlotProof';
  params: {
    fossilL1HeadersStoreAddress: string;
    fossilFactRegistryAddress: string;
  };
};

export type StarknetExecutionConfig = {
  type: 'starknet';
};

export type VanillaExecutionConfig = {
  type: 'vanilla';
};

export type EthRelayerExecutionConfig = {
  type: 'ethRelayer';
  params: {
    destination: string;
    chainId: number;
  };
};

export type AvatarExecutionConfig = {
  type: 'avatar';
};

export type NetworkConfig = {
  eip712ChainId: number;
  starknetEip712ChainId: string;
  spaceFactory: string;
  masterSpace: string;
  authenticators: {
    [key: string]:
      | VanillaAuthenticatorConfig
      | EthTxAuthenticatorConfig
      | EthSigAuthenticatorConfig
      | StarkSigAuthenticatorConfig
      | StarkTxAuthenticatorConfig
      | undefined;
  };
  strategies: {
    [key: string]:
      | VanillaStrategyConfig
      | CompStrategyConfig
      | OzVotesStrategyConfig
      | WhitelistStrategyConfig
      | SingleSlotProofStrategyConfig
      | undefined;
  };
  executors: {
    [key: string]:
      | StarknetExecutionConfig
      | VanillaExecutionConfig
      | EthRelayerExecutionConfig
      | AvatarExecutionConfig
      | undefined;
  };
};

export type EvmNetworkConfig = Omit<
  NetworkConfig,
  'starknetEip712ChainId' | 'spaceFactory' | 'executors'
> & {
  proxyFactory: string;
  executionStrategiesImplementations: {
    [key in ExecutorType]?: string;
  };
};

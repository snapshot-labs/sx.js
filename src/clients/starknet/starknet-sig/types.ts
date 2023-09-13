export const baseDomain = {
  name: 'sx-sn',
  version: '0.1.0'
};

export const domainTypes = {
  StarkNetDomain: [
    { name: 'name', type: 'felt252' },
    { name: 'version', type: 'felt252' },
    { name: 'chainId', type: 'felt252' },
    { name: 'verifyingContract', type: 'ContractAddress' }
  ]
};

export const sharedTypes = {
  Strategy: [
    { name: 'address', type: 'felt252' },
    { name: 'params', type: 'felt*' }
  ],
  IndexedStrategy: [
    { name: 'index', type: 'felt252' },
    { name: 'params', type: 'felt*' }
  ],
  u256: [
    { name: 'low', type: 'felt252' },
    { name: 'high', type: 'felt252' }
  ]
};

export const proposeTypes = {
  StarkNetDomain: domainTypes.StarkNetDomain,
  Propose: [
    { name: 'space', type: 'ContractAddress' },
    { name: 'author', type: 'ContractAddress' },
    { name: 'metadataUri', type: 'felt*' },
    { name: 'executionStrategy', type: 'Strategy' },
    { name: 'userProposalValidationParams', type: 'felt*' },
    { name: 'salt', type: 'felt252' }
  ],
  Strategy: sharedTypes.Strategy
};

export const voteTypes = {
  StarkNetDomain: domainTypes.StarkNetDomain,
  Vote: [
    { name: 'space', type: 'ContractAddress' },
    { name: 'voter', type: 'ContractAddress' },
    { name: 'proposalId', type: 'u256' },
    { name: 'choice', type: 'felt252' },
    { name: 'userVotingStrategies', type: 'IndexedStrategy*' },
    { name: 'metadataUri', type: 'felt*' }
  ],
  IndexedStrategy: sharedTypes.IndexedStrategy,
  u256: sharedTypes.u256
};

export const updateProposalTypes = {
  StarkNetDomain: domainTypes.StarkNetDomain,
  UpdateProposal: [
    { name: 'space', type: 'ContractAddress' },
    { name: 'author', type: 'ContractAddress' },
    { name: 'proposalId', type: 'u256' },
    { name: 'executionStrategy', type: 'Strategy' },
    { name: 'metadataUri', type: 'felt*' },
    { name: 'salt', type: 'felt252' }
  ],
  Strategy: sharedTypes.Strategy,
  u256: sharedTypes.u256
};

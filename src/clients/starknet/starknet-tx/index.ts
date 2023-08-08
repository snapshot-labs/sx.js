import { Account, CallData, ValidateType, shortString, uint256 } from 'starknet';
import { getStrategiesParams } from '../../../utils/strategies';
import { getAuthenticator } from '../../../authenticators/starknet';
import { defaultNetwork } from '../../../networks';
import SpaceAbi from './abis/Space.json';
import {
  Vote,
  Propose,
  Envelope,
  ClientOpts,
  ClientConfig,
  UpdateProposal,
  AddressConfig
} from '../../../types';

type SpaceParams = {
  controller: string;
  votingDelay: number;
  minVotingDuration: number;
  maxVotingDuration: number;
  proposalValidationStrategy: AddressConfig;
  metadataUri: string;
  authenticators: string[];
  votingStrategies: AddressConfig[];
};

type UpdateSettingsInput = {
  minVotingDuration?: number;
  maxVotingDuration?: number;
  votingDelay?: number;
  metadataUri?: string;
  daoUri?: string;
  proposalValidationStrategy?: AddressConfig;
  proposalValidationStrategyMetadataUri?: string;
  authenticatorsToAdd?: string[];
  authenticatorsToRemove?: string[];
  votingStrategiesToAdd?: AddressConfig[];
  votingStrategiesToRemove?: number[];
  votingStrategyMetadataUrisToAdd?: string[];
};

const NO_UPDATE_U32 = '0xf2cda9b1';
const NO_UPDATE_ADDRESS = '0xf2cda9b13ed04e585461605c0d6e804933ca828111bd94d4e6a96c75e8b048';
export class StarkNetTx {
  config: ClientConfig;

  constructor(opts: ClientOpts) {
    this.config = {
      networkConfig: defaultNetwork,
      ...opts
    };
  }

  async deploySpace({
    account,
    params: {
      controller,
      votingDelay,
      minVotingDuration,
      maxVotingDuration,
      proposalValidationStrategy,
      authenticators,
      votingStrategies
    }
  }: {
    account: Account;
    params: SpaceParams;
    salt?: string;
  }): Promise<string> {
    const res = await account.execute({
      contractAddress: this.config.networkConfig.spaceFactory,
      entrypoint: 'deploy',
      calldata: CallData.compile({
        class_hash: this.config.networkConfig.masterSpace,
        contract_address_salt: 0,
        calldata: CallData.compile({
          owner: controller,
          max_voting_duration: maxVotingDuration,
          min_voting_duration: minVotingDuration,
          voting_delay: votingDelay,
          proposal_validation_strategy: {
            address: proposalValidationStrategy.addr,
            params: [proposalValidationStrategy.params]
          },
          voting_strategies: votingStrategies.map(strategy => ({
            address: strategy.addr,
            params: [strategy.params]
          })),

          authenticators: authenticators
        })
      })
    });

    return res.transaction_hash;
  }

  async propose(account: Account, envelope: Envelope<Propose>) {
    const authorAddress = envelope.signatureData?.address || account.address;

    const authenticator = getAuthenticator(envelope.data.authenticator, this.config.networkConfig);
    if (!authenticator) {
      throw new Error('Invalid authenticator');
    }

    const strategiesParams = await getStrategiesParams(
      'propose',
      envelope.data.strategies,
      authorAddress,
      envelope.data,
      this.config
    );

    const call = authenticator.createProposeCall(envelope, {
      author: authorAddress,
      executionStrategy: {
        address: envelope.data.executionStrategy.addr,
        params: envelope.data.executionStrategy.params
      },
      strategiesParams
    });

    const calls = [call];

    const fee = await account.estimateFee(calls);
    return account.execute(calls, undefined, {
      maxFee: fee.suggestedMaxFee
    });
  }

  async updateProposal(account: Account, envelope: Envelope<UpdateProposal>) {
    const authorAddress = envelope.signatureData?.address || account.address;

    const authenticator = getAuthenticator(envelope.data.authenticator, this.config.networkConfig);
    if (!authenticator) {
      throw new Error('Invalid authenticator');
    }

    const call = authenticator.createUpdateProposalCall(envelope, {
      author: authorAddress,
      proposalId: envelope.data.proposal,
      executionStrategy: {
        address: envelope.data.executionStrategy.addr,
        params: envelope.data.executionStrategy.params
      }
    });

    const calls = [call];

    const fee = await account.estimateFee(calls);
    return account.execute(calls, undefined, {
      maxFee: fee.suggestedMaxFee
    });
  }

  async vote(account: Account, envelope: Envelope<Vote>) {
    const voterAddress = envelope.signatureData?.address || account.address;

    const authenticator = getAuthenticator(envelope.data.authenticator, this.config.networkConfig);
    if (!authenticator) {
      throw new Error('Invalid authenticator');
    }

    const strategiesParams = await getStrategiesParams(
      'vote',
      envelope.data.strategies,
      voterAddress,
      envelope.data,
      this.config
    );

    const call = authenticator.createVoteCall(envelope, {
      voter: voterAddress,
      proposalId: envelope.data.proposal,
      choice: envelope.data.choice,
      votingStrategies: envelope.data.strategies.map((strategyConfig, i) => ({
        index: strategyConfig.index,
        params: strategiesParams[i]
      }))
    });

    const fee = await account.estimateFee(call);
    return account.execute(call, undefined, {
      maxFee: fee.suggestedMaxFee
    });
  }

  async updateSettings({
    signer,
    space,
    settings
  }: {
    signer: Account;
    space: string;
    settings: UpdateSettingsInput;
  }) {
    const encodeString = (str: string) => {
      return str.split('').map(c => `0x${c.charCodeAt(0).toString(16)})`);
    };

    const settingsData = [
      {
        min_voting_duration: settings.minVotingDuration || NO_UPDATE_U32,
        max_voting_duration: settings.maxVotingDuration || NO_UPDATE_U32,
        voting_delay: settings.votingDelay || NO_UPDATE_U32,
        metadata_URI: (settings.metadataUri && encodeString(settings.metadataUri)) || [],
        dao_URI: (settings.daoUri && encodeString(settings.daoUri)) || [],
        proposal_validation_strategy: settings.proposalValidationStrategy || {
          address: NO_UPDATE_ADDRESS,
          params: []
        },
        proposal_validation_strategy_metadata_URI:
          settings.proposalValidationStrategyMetadataUri || [],
        authenticators_to_add: settings.authenticatorsToAdd || [],
        authenticators_to_remove: settings.authenticatorsToRemove || [],
        voting_strategies_to_add: settings.votingStrategiesToAdd || [],
        voting_strategies_to_remove: settings.votingStrategiesToRemove || [],
        voting_strategies_metadata_URIs_to_add:
          (settings.votingStrategyMetadataUrisToAdd &&
            settings.votingStrategyMetadataUrisToAdd.map(str => encodeString(str))) ||
          []
      }
    ];

    const calldata = new CallData(SpaceAbi);
    calldata.validate(ValidateType.INVOKE, 'update_settings', settingsData);

    return signer.execute({
      contractAddress: space,
      entrypoint: 'update_settings',
      calldata: calldata.compile('update_settings', settingsData)
    });
  }

  async cancelProposal({
    signer,
    space,
    proposal
  }: {
    signer: Account;
    space: string;
    proposal: number;
  }) {
    return signer.execute({
      contractAddress: space,
      entrypoint: 'cancel_proposal',
      calldata: CallData.compile({
        proposal_id: uint256.bnToUint256(proposal)
      })
    });
  }

  async setMinVotingDuration({
    signer,
    space,
    minVotingDuration
  }: {
    signer: Account;
    space: string;
    minVotingDuration: number;
  }) {
    return this.updateSettings({
      signer,
      space,
      settings: {
        minVotingDuration
      }
    });
  }

  async setMaxVotingDuration({
    signer,
    space,
    maxVotingDuration
  }: {
    signer: Account;
    space: string;
    maxVotingDuration: number;
  }) {
    return this.updateSettings({
      signer,
      space,
      settings: {
        maxVotingDuration
      }
    });
  }

  async setVotingDelay({
    signer,
    space,
    votingDelay
  }: {
    signer: Account;
    space: string;
    votingDelay: number;
  }) {
    return this.updateSettings({
      signer,
      space,
      settings: {
        votingDelay
      }
    });
  }

  async setMetadataUri({
    signer,
    space,
    metadataUri
  }: {
    signer: Account;
    space: string;
    metadataUri: string;
  }) {
    return this.updateSettings({
      signer,
      space,
      settings: {
        metadataUri
      }
    });
  }

  async transferOwnership({
    signer,
    space,
    owner
  }: {
    signer: Account;
    space: string;
    owner: string;
  }) {
    return signer.execute({
      contractAddress: space,
      entrypoint: 'transfer_ownership',
      calldata: CallData.compile({
        new_owner: owner
      })
    });
  }
}

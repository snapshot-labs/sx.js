import { Account, CallData } from 'starknet';
import { getStrategiesParams } from '../../../utils/strategies';
import { getAuthenticator } from '../../../authenticators/starknet';
import { defaultNetwork } from '../../../networks';
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
    const authenticator = getAuthenticator(envelope.data.authenticator, this.config.networkConfig);
    if (!authenticator) {
      throw new Error('Invalid authenticator');
    }

    const strategiesParams = await getStrategiesParams(
      'propose',
      envelope.data.strategies,
      envelope.address,
      envelope.data,
      this.config
    );

    const call = authenticator.createProposeCall(envelope, {
      author: envelope.address,
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
    const authenticator = getAuthenticator(envelope.data.authenticator, this.config.networkConfig);
    if (!authenticator) {
      throw new Error('Invalid authenticator');
    }

    const call = authenticator.createUpdateProposalCall(envelope, {
      author: envelope.address,
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
    const authenticator = getAuthenticator(envelope.data.authenticator, this.config.networkConfig);
    if (!authenticator) {
      throw new Error('Invalid authenticator');
    }

    const strategiesParams = await getStrategiesParams(
      'vote',
      envelope.data.strategies,
      envelope.address,
      envelope.data,
      this.config
    );

    const call = authenticator.createVoteCall(envelope, {
      voter: envelope.address,
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
}

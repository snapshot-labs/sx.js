import { Account } from 'starknet';
import { getStrategiesParams } from '../../../utils/strategies';
import { getAuthenticator } from '../../../authenticators/starknet';
import { defaultNetwork } from '../../../networks';
import { Vote, Propose, Envelope, ClientOpts, ClientConfig, UpdateProposal } from '../../../types';

export class StarkNetTx {
  config: ClientConfig;

  constructor(opts: ClientOpts) {
    this.config = {
      networkConfig: defaultNetwork,
      ...opts
    };
  }

  async propose(account: Account, envelope: Envelope<Propose>) {
    const authenticator = getAuthenticator(
      envelope.data.message.authenticator,
      this.config.networkConfig
    );
    if (!authenticator) {
      throw new Error('Invalid authenticator');
    }

    const strategiesParams = await getStrategiesParams(
      'propose',
      envelope.data.message.strategies,
      envelope.address,
      envelope.data.message,
      this.config
    );

    const call = authenticator.createProposeCall(envelope, {
      author: envelope.address,
      executionStrategy: {
        address: envelope.data.message.executionStrategy.addr,
        params: envelope.data.message.executionStrategy.params
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
    const authenticator = getAuthenticator(
      envelope.data.message.authenticator,
      this.config.networkConfig
    );
    if (!authenticator) {
      throw new Error('Invalid authenticator');
    }

    const call = authenticator.createUpdateProposalCall(envelope, {
      author: envelope.address,
      proposalId: envelope.data.message.proposal,
      executionStrategy: {
        address: envelope.data.message.executionStrategy.addr,
        params: envelope.data.message.executionStrategy.params
      }
    });

    const calls = [call];

    const fee = await account.estimateFee(calls);
    return account.execute(calls, undefined, {
      maxFee: fee.suggestedMaxFee
    });
  }

  async vote(account: Account, envelope: Envelope<Vote>) {
    const authenticator = getAuthenticator(
      envelope.data.message.authenticator,
      this.config.networkConfig
    );
    if (!authenticator) {
      throw new Error('Invalid authenticator');
    }

    const strategiesParams = await getStrategiesParams(
      'vote',
      envelope.data.message.strategies,
      envelope.address,
      envelope.data.message,
      this.config
    );

    const call = authenticator.createVoteCall(envelope, {
      voter: envelope.address,
      proposalId: envelope.data.message.proposal,
      choice: envelope.data.message.choice,
      votingStrategies: envelope.data.message.strategies.map((strategyConfig, i) => ({
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

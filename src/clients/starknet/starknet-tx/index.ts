import { Account, hash, CallData, ValidateType } from 'starknet';
import { getStrategiesParams } from '../../../utils/strategies';
import { getAuthenticator } from '../../../authenticators/starknet';
import { defaultNetwork } from '../../../networks';
import SpaceAbi from './abi/space.json';
import { Vote, Propose, Envelope, ClientOpts, ClientConfig, UpdateProposal } from '../../../types';

const { getSelectorFromName } = hash;

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

    const args = [
      envelope.address,
      {
        address: envelope.data.message.executionStrategy.addr,
        params: envelope.data.message.executionStrategy.params
      },
      strategiesParams // TODO: should be encoded somehow, waiting for contract to be implemented
    ];

    const callData = new CallData(SpaceAbi);
    callData.validate(ValidateType.INVOKE, 'propose', args);

    const call = authenticator.createCall(
      envelope,
      getSelectorFromName('propose'),
      callData.compile('propose', args)
    );

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

    const args = [
      envelope.address,
      envelope.data.message.proposal,
      {
        address: envelope.data.message.executionStrategy.addr,
        params: envelope.data.message.executionStrategy.params
      }
    ];

    const callData = new CallData(SpaceAbi);
    callData.validate(ValidateType.INVOKE, 'update_proposal', args);

    const call = authenticator.createCall(
      envelope,
      getSelectorFromName('update_proposal'),
      callData.compile('update_proposal`', args)
    );

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

    const args = [
      envelope.address,
      envelope.data.message.proposal,
      envelope.data.message.choice,
      envelope.data.message.strategies.map((strategyConfig, i) => ({
        index: strategyConfig.index,
        params: strategiesParams[i]
      }))
    ];

    const calldata = new CallData(SpaceAbi);
    calldata.validate(ValidateType.INVOKE, 'vote', args);

    const call = authenticator.createCall(
      envelope,
      getSelectorFromName('vote'),
      calldata.compile('vote', args)
    );

    const fee = await account.estimateFee(call);
    return account.execute(call, undefined, {
      maxFee: fee.suggestedMaxFee
    });
  }
}

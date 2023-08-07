import randomBytes from 'randombytes';
import { Account, typedData, uint256 } from 'starknet';
import { getStrategiesParams } from '../../../utils/strategies';
import { baseDomain, proposeTypes, updateProposalTypes, voteTypes } from './types';
import {
  ClientConfig,
  ClientOpts,
  Envelope,
  Propose,
  UpdateProposal,
  Vote,
  StarknetEIP712ProposeMessage,
  StarknetEIP712UpdateProposalMessage,
  StarknetEIP712VoteMessage
} from '../../../types';
import { defaultNetwork } from '../../..';

export class StarknetSig {
  config: ClientConfig;

  constructor(opts: ClientOpts) {
    this.config = {
      networkConfig: defaultNetwork,
      ...opts
    };
  }

  generateSalt() {
    return `0x${randomBytes(4).toString('hex')}`;
  }

  public async sign<
    T extends
      | StarknetEIP712ProposeMessage
      | StarknetEIP712UpdateProposalMessage
      | StarknetEIP712VoteMessage
  >(
    signer: Account,
    verifyingContract: string,
    message: T,
    types: any,
    primaryType: string
  ): Promise<[bigint, bigint]> {
    const domain = {
      ...baseDomain,
      chainId: this.config.networkConfig.starknetEip712ChainId,
      verifyingContract
    };

    const proposeData: typedData.TypedData = {
      types,
      primaryType,
      domain,
      message
    };

    const signature = (await signer.signMessage(proposeData)) as any;

    return [signature.r, signature.s];
  }

  public async propose({
    signer,
    data
  }: {
    signer: Account;
    data: Propose;
  }): Promise<Envelope<Propose>> {
    const address = signer.address;

    const strategiesParams = await getStrategiesParams(
      'propose',
      data.strategies,
      address,
      data,
      this.config
    );

    const message = {
      space: data.space,
      author: address,
      executionStrategy: {
        address: data.executionStrategy.addr,
        params: [data.executionStrategy.params]
      },
      userProposalValidationParams: strategiesParams,
      salt: this.generateSalt()
    };

    const sig = await this.sign(signer, data.authenticator, message, proposeTypes, 'Propose');

    return {
      address,
      sig,
      data
    };
  }

  public async updateProposal({
    signer,
    data
  }: {
    signer: Account;
    data: UpdateProposal;
  }): Promise<Envelope<UpdateProposal>> {
    const address = signer.address;

    const message = {
      space: data.space,
      author: address,
      proposalId: uint256.bnToUint256(data.proposal),
      executionStrategy: {
        address: data.executionStrategy.addr,
        params: [data.executionStrategy.params]
      },
      salt: this.generateSalt()
    };

    const sig = await this.sign(
      signer,
      data.authenticator,
      message,
      updateProposalTypes,
      'UpdateProposal'
    );

    return {
      address,
      sig,
      data
    };
  }

  public async vote({ signer, data }: { signer: Account; data: Vote }): Promise<Envelope<Vote>> {
    const address = signer.address;

    const strategiesParams = await getStrategiesParams(
      'vote',
      data.strategies,
      address,
      data,
      this.config
    );

    const message = {
      space: data.space,
      voter: address,
      proposalId: uint256.bnToUint256(data.proposal),
      choice: `0x${data.choice.toString(16)}`,
      userVotingStrategies: data.strategies.map((strategy, index) => ({
        index: strategy.index,
        params: [strategiesParams[index]]
      }))
    };

    const sig = await this.sign(signer, data.authenticator, message, voteTypes, 'Vote');

    return {
      address,
      sig,
      data
    };
  }
}

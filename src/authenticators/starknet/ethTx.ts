import { Call, CallData } from 'starknet';
import EthTxAuthenticatorAbi from './abis/EthTxAuthenticator.json';
import {
  Authenticator,
  Envelope,
  Propose,
  Vote,
  UpdateProposal,
  ProposeCallArgs,
  VoteCallArgs,
  UpdateProposalCallArgs
} from '../../types';

const callData = new CallData(EthTxAuthenticatorAbi);

export default function createEthTxAuthenticator(): Authenticator {
  return {
    type: 'ethTx',
    createProposeCall(envelope: Envelope<Propose>, args: ProposeCallArgs): Call {
      const { space, authenticator } = envelope.data.message;

      const compiled = callData.compile('authenticate_propose', [
        space,
        args.author,
        {
          address: args.executionStrategy.address,
          params: [args.executionStrategy.params]
        },
        args.strategiesParams
      ]);

      return {
        contractAddress: authenticator,
        entrypoint: 'authenticate_propose',
        calldata: compiled
      };
    },
    createVoteCall(envelope: Envelope<Vote>, args: VoteCallArgs): Call {
      const { space, authenticator } = envelope.data.message;

      const compiled = callData.compile('authenticate_vote', [
        space,
        args.voter,
        args.proposalId,
        args.choice,
        args.votingStrategies.map(strategy => ({
          index: strategy.index,
          params: [strategy.params]
        }))
      ]);

      return {
        contractAddress: authenticator,
        entrypoint: 'authenticate_vote',
        calldata: compiled
      };
    },
    createUpdateProposalCall(
      envelope: Envelope<UpdateProposal>,
      args: UpdateProposalCallArgs
    ): Call {
      const { space, authenticator } = envelope.data.message;

      const compiled = callData.compile('authenticate_update_proposal', [
        space,
        args.author,
        args.proposalId,
        {
          address: args.executionStrategy.address,
          params: [args.executionStrategy.params]
        }
      ]);

      return {
        contractAddress: authenticator,
        entrypoint: 'authenticate_update_proposal',
        calldata: compiled
      };
    }
  };
}

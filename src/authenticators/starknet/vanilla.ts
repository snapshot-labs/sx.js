import { Call, CallData, ValidateType } from 'starknet';
import SpaceAbi from '../../clients/starknet/starknet-tx/abi/space.json';
import {
  Authenticator,
  Envelope,
  VanillaProposeMessage,
  EthSigProposeMessage,
  VanillaVoteMessage,
  ProposeCallArgs,
  VoteCallArgs,
  UpdateProposalCallArgs,
  EthSigVoteMessage,
  UpdateProposal
} from '../../types';

export default function createVanillaAuthenticator(): Authenticator {
  return {
    type: 'vanilla',
    createProposeCall(
      envelope: Envelope<VanillaProposeMessage | EthSigProposeMessage>,
      selector: string,
      args: ProposeCallArgs
    ): Call {
      const { space, authenticator } = envelope.data.message;

      const argsList = [args.author, args.executionStrategy, args.strategiesParams];

      const callData = new CallData(SpaceAbi);
      callData.validate(ValidateType.INVOKE, 'propose', argsList);

      const calldata = callData.compile('propose', argsList);

      return {
        contractAddress: authenticator,
        entrypoint: 'authenticate',
        calldata: [space, selector, calldata.length, ...calldata]
      };
    },
    createVoteCall(
      envelope: Envelope<VanillaVoteMessage | EthSigVoteMessage>,
      selector: string,
      args: VoteCallArgs
    ): Call {
      const { space, authenticator } = envelope.data.message;

      const argsList = [args.voter, args.proposalId, args.choice, args.votingStrategies];

      const callData = new CallData(SpaceAbi);
      callData.validate(ValidateType.INVOKE, 'vote', argsList);

      const calldata = callData.compile('vote', argsList);

      return {
        contractAddress: authenticator,
        entrypoint: 'authenticate',
        calldata: [space, selector, calldata.length, ...calldata]
      };
    },
    createUpdateProposalCall(
      envelope: Envelope<UpdateProposal>,
      selector: string,
      args: UpdateProposalCallArgs
    ): Call {
      const { space, authenticator } = envelope.data.message;

      const argsList = [args.author, args.proposalId, args.executionStrategy];

      const callData = new CallData(SpaceAbi);
      callData.validate(ValidateType.INVOKE, 'update_proposal', argsList);

      const calldata = callData.compile('update_proposal', argsList);

      return {
        contractAddress: authenticator,
        entrypoint: 'authenticate',
        calldata: [space, selector, calldata.length, ...calldata]
      };
    }
  };
}

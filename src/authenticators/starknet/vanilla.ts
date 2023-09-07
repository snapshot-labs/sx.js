import { Call, CallData, hash, shortString, uint256 } from 'starknet';
import SpaceAbi from '../../clients/starknet/starknet-tx/abis/Space.json';
import { getChoiceEnum, getUserAddressEnum } from '../../utils/starknet-enums';
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

const callData = new CallData(SpaceAbi);

export default function createVanillaAuthenticator(): Authenticator {
  return {
    type: 'vanilla',
    createProposeCall(envelope: Envelope<Propose>, args: ProposeCallArgs): Call {
      const { space, authenticator } = envelope.data;

      const calldata = callData.compile('propose', [
        getUserAddressEnum('ETHEREUM', args.author),
        args.executionStrategy,
        args.strategiesParams,
        shortString.splitLongString(args.metadataUri)
      ]);

      return {
        contractAddress: authenticator,
        entrypoint: 'authenticate',
        calldata: [space, hash.getSelectorFromName('propose'), calldata.length, ...calldata]
      };
    },
    createVoteCall(envelope: Envelope<Vote>, args: VoteCallArgs): Call {
      const { space, authenticator } = envelope.data;

      const calldata = callData.compile('vote', [
        getUserAddressEnum('ETHEREUM', args.voter),
        uint256.bnToUint256(args.proposalId),
        getChoiceEnum(args.choice),
        args.votingStrategies,
        shortString.splitLongString(args.metadataUri)
      ]);

      return {
        contractAddress: authenticator,
        entrypoint: 'authenticate',
        calldata: [space, hash.getSelectorFromName('vote'), calldata.length, ...calldata]
      };
    },
    createUpdateProposalCall(
      envelope: Envelope<UpdateProposal>,
      args: UpdateProposalCallArgs
    ): Call {
      const { space, authenticator } = envelope.data;

      const calldata = callData.compile('update_proposal', [
        getUserAddressEnum('ETHEREUM', args.author),
        uint256.bnToUint256(args.proposalId),
        args.executionStrategy,
        shortString.splitLongString(args.metadataUri)
      ]);

      return {
        contractAddress: authenticator,
        entrypoint: 'authenticate',
        calldata: [space, hash.getSelectorFromName('update_proposal'), calldata.length, ...calldata]
      };
    }
  };
}

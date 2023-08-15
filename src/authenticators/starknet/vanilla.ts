import { Call, CallData, hash, shortString, uint256 } from 'starknet';
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

export default function createVanillaAuthenticator(): Authenticator {
  return {
    type: 'vanilla',
    createProposeCall(envelope: Envelope<Propose>, args: ProposeCallArgs): Call {
      const { space, authenticator } = envelope.data;

      // NOTE: not using Abi as starknet.js doesn't support enums yet
      const calldata = CallData.compile({
        enum_index: 1, // Ethereum
        author: args.author,
        executionStrategy: args.executionStrategy,
        strategiesParams: args.strategiesParams,
        metadata_URI: shortString.splitLongString(args.metadataUri)
      });

      return {
        contractAddress: authenticator,
        entrypoint: 'authenticate',
        calldata: [space, hash.getSelectorFromName('propose'), calldata.length, ...calldata]
      };
    },
    createVoteCall(envelope: Envelope<Vote>, args: VoteCallArgs): Call {
      const { space, authenticator } = envelope.data;

      // NOTE: not using Abi as starknet.js doesn't support enums yet
      const calldata = CallData.compile({
        enum_index: 1, // Ethereum
        voter: args.voter,
        proposal_id: uint256.bnToUint256(args.proposalId),
        choice: args.choice,
        voting_strategies: args.votingStrategies,
        metadata_URI: shortString.splitLongString(args.metadataUri)
      });

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

      // NOTE: not using Abi as starknet.js doesn't support enums yet
      const calldata = CallData.compile({
        enum_index: 1, // Ethereum
        author: args.author,
        proposal_id: uint256.bnToUint256(args.proposalId),
        execution_strategy: args.executionStrategy,
        metadata_URI: shortString.splitLongString(args.metadataUri)
      });

      return {
        contractAddress: authenticator,
        entrypoint: 'authenticate',
        calldata: [space, hash.getSelectorFromName('update_proposal'), calldata.length, ...calldata]
      };
    }
  };
}

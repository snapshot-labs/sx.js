import { Call, CallData, shortString, uint256 } from 'starknet';
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

export default function createStarkSigAuthenticator(): Authenticator {
  return {
    type: 'starkSig',
    createProposeCall(envelope: Envelope<Propose>, args: ProposeCallArgs): Call {
      const { authenticator } = envelope.data;

      if (!envelope.signatureData?.signature) {
        throw new Error('signature is required for this authenticator');
      }

      if (!envelope.signatureData?.message) {
        throw new Error('message is required for this authenticator');
      }

      const compiled = CallData.compile({
        signature: envelope.signatureData.signature,
        space: envelope.data.space,
        author: envelope.signatureData.address,
        executionStrategy: {
          address: args.executionStrategy.address,
          params: args.executionStrategy.params
        },
        userProposalValidationParams: args.strategiesParams,
        salt: envelope.signatureData.message.salt,
        accountType: shortString.encodeShortString('snake')
      });

      return {
        contractAddress: authenticator,
        entrypoint: 'authenticate_propose',
        calldata: compiled
      };
    },
    createVoteCall(envelope: Envelope<Vote>, args: VoteCallArgs): Call {
      const { authenticator } = envelope.data;

      if (!envelope.signatureData?.signature) {
        throw new Error('signature is required for this authenticator');
      }

      if (!envelope.signatureData?.message) {
        throw new Error('message is required for this authenticator');
      }

      const compiled = CallData.compile({
        signature: envelope.signatureData.signature,
        space: envelope.data.space,
        voter: envelope.signatureData.address,
        proposalId: uint256.bnToUint256(args.proposalId),
        choice: `0x${args.choice.toString(16)}`,
        userVotingStrategies: args.votingStrategies.map(strategy => ({
          index: strategy.index,
          params: strategy.params
        })),
        accountType: shortString.encodeShortString('snake')
      });

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
      const { authenticator } = envelope.data;

      if (!envelope.signatureData?.signature) {
        throw new Error('signature is required for this authenticator');
      }

      if (!envelope.signatureData?.message) {
        throw new Error('message is required for this authenticator');
      }

      const compiled = CallData.compile({
        signature: envelope.signatureData.signature,
        space: envelope.data.space,
        author: envelope.signatureData.address,
        proposalId: uint256.bnToUint256(args.proposalId),
        executionStrategy: {
          address: args.executionStrategy.address,
          params: args.executionStrategy.params
        },
        salt: envelope.signatureData.message.salt,
        accountType: shortString.encodeShortString('snake')
      });

      return {
        contractAddress: authenticator,
        entrypoint: 'authenticate_update_proposal',
        calldata: compiled
      };
    }
  };
}

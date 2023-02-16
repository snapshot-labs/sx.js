import type { Call } from 'starknet';
import type {
  Authenticator,
  Envelope,
  VanillaProposeMessage,
  VanillaVoteMessage
} from '../../types';

export default function createVanillaAuthenticator(): Authenticator {
  return {
    type: 'vanilla',
    createCall(
      envelope: Envelope<VanillaProposeMessage | VanillaVoteMessage>,
      selector: string,
      calldata: string[]
    ): Call {
      const { space, authenticator } = envelope.data.message;

      return {
        contractAddress: authenticator,
        entrypoint: 'authenticate',
        calldata: [space, selector, calldata.length, ...calldata]
      };
    }
  };
}

import { getRSVFromSig } from '../../utils/encoding';
import { SplitUint256 } from '../../utils/split-uint256';
import type { Call } from 'starknet';
import type { Authenticator, Envelope, EthSigProposeMessage, EthSigVoteMessage } from '../../types';

export default function createEthSigAuthenticator(): Authenticator {
  return {
    type: 'ethSig',
    createCall(
      envelope: Envelope<EthSigProposeMessage | EthSigVoteMessage>,
      selector: string,
      calldata: string[]
    ): Call {
      const { sig, data } = envelope;
      const { space, authenticator, salt } = data.message;
      const { r, s, v } = getRSVFromSig(sig);
      const rawSalt = SplitUint256.fromHex(`0x${salt.toString(16)}`);

      return {
        contractAddress: authenticator,
        entrypoint: 'authenticate',
        calldata: [
          r.low,
          r.high,
          s.low,
          s.high,
          v,
          rawSalt.low,
          rawSalt.high,
          space,
          selector,
          calldata.length,
          ...calldata
        ]
      };
    }
  };
}

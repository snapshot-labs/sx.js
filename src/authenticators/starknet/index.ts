import createVanillaAuthenticator from './vanilla';
import createEthTxAuthenticator from './ethTx';
import createStarkSigAuthenticator from './starkSig';
import { hexPadLeft } from '../../utils/encoding';
import type { Authenticator, NetworkConfig } from '../../types';

export function getAuthenticator(
  address: string,
  networkConfig: NetworkConfig
): Authenticator | null {
  const authenticator = networkConfig.authenticators[hexPadLeft(address)];
  if (!authenticator) return null;

  if (authenticator.type === 'vanilla') {
    return createVanillaAuthenticator();
  }

  if (authenticator.type === 'ethTx') {
    return createEthTxAuthenticator();
  }

  if (authenticator.type === 'starkSig') {
    return createStarkSigAuthenticator();
  }

  return null;
}

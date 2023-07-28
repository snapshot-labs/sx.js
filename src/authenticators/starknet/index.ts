import createVanillaAuthenticator from './vanilla';
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

  return null;
}

import createVanillaStrategy from './vanilla';
import { hexPadLeft } from '../../utils/encoding';
import type { Strategy, NetworkConfig } from '../../types';

export function getStrategy(address: string, networkConfig: NetworkConfig): Strategy | null {
  const strategy = networkConfig.strategies[hexPadLeft(address)];
  if (!strategy) return null;

  if (strategy.type === 'vanilla') {
    return createVanillaStrategy();
  }

  return null;
}

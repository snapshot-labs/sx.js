import { getStrategy } from '../../../../src/strategies/starknet';
import { defaultNetwork } from '../../../../src/networks';

describe('voting strategies', () => {
  describe('getStrategy', () => {
    it('should return correct strategy from predefined default addresses', () => {
      expect(
        getStrategy(
          '0x0277bc9bb7b7e7f48faaf5a2023f247e5c7cd81bfab1221bd7e91c9d4894ec1a',
          defaultNetwork
        )?.type
      ).toBe('vanilla');
    });
  });
});

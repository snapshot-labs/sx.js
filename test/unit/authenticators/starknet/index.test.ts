import { getAuthenticator } from '../../../../src/authenticators/starknet';
import { defaultNetwork } from '../../../../src/networks';

describe('authenticators', () => {
  describe('getAuthenticator', () => {
    it('should return correct authenticator from predefined default addresses', () => {
      expect(
        getAuthenticator(
          '0x02c38c9a8f20e1c4c974503e1cac5a06658161df4a8be3b24762168c99c58dbd',
          defaultNetwork
        )?.type
      ).toBe('vanilla');

      expect(
        getAuthenticator(
          '0x00e6533da3322019c3e26bd6942b647a74593af805021003bab707267717952a',
          defaultNetwork
        )?.type
      ).toBe('ethTx');
    });
  });
});

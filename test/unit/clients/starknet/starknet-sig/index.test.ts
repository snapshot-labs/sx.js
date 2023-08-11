import { Account, Provider } from 'starknet';
import { StarkNetSig } from '../../../../../src/clients/starknet/starknet-sig';

describe('StarkNetSig', () => {
  const address = '0x7d2f37b75a5e779f7da01c22acee1b66c39e8ba470ee5448f05e1462afcedb4';
  const privateKey = '0xcd613e30d8f16adf91b7584a2265b1f5';

  const starkProvider = new Provider({
    sequencer: {
      baseUrl: 'http://127.0.0.1:5050'
    }
  });

  const account = new Account(starkProvider, address, privateKey);

  const client = new StarkNetSig({
    starkProvider,
    ethUrl: 'https://rpc.brovider.xyz/5'
  });

  beforeAll(() => {
    jest.spyOn(client, 'generateSalt').mockImplementation(() => '0x0');
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should create propose envelope', async () => {
    const envelope = await client.propose({
      signer: account,
      data: {
        space: '0x06330d3e48f59f5411c201ee2e9e9ccdc738fb3bb192b0e77e4eda26fa1a22f8',
        authenticator: '0x00e6533da3322019c3e26bd6942b647a74593af805021003bab707267717952a',
        strategies: [],
        executionStrategy: {
          addr: '0x040de235a2b53e921d37c2ea2b160750ca2e94f01d709f78f870963559de8fbe',
          params: ['0x101']
        },
        metadataUri: 'ipfs://QmNrm6xKuib1THtWkiN5CKtBEerQCDpUtmgDqiaU2xDmca'
      }
    });

    expect(envelope).toMatchSnapshot();
  });

  it('should create update proposal envelope', async () => {
    const envelope = await client.updateProposal({
      signer: account,
      data: {
        space: '0x06330d3e48f59f5411c201ee2e9e9ccdc738fb3bb192b0e77e4eda26fa1a22f8',
        authenticator: '0x00e6533da3322019c3e26bd6942b647a74593af805021003bab707267717952a',
        executionStrategy: {
          addr: '0x040de235a2b53e921d37c2ea2b160750ca2e94f01d709f78f870963559de8fbe',
          params: ['0x101']
        },
        proposal: 1,
        metadataUri: 'ipfs://QmNrm6xKuib1THtWkiN5CKtBEerQCDpUtmgDqiaU2xDmca'
      }
    });

    expect(envelope).toMatchSnapshot();
  });

  it('should create vote envelope', async () => {
    const envelope = await client.vote({
      signer: account,
      data: {
        space: '0x06330d3e48f59f5411c201ee2e9e9ccdc738fb3bb192b0e77e4eda26fa1a22f8',
        authenticator: '0x00e6533da3322019c3e26bd6942b647a74593af805021003bab707267717952a',
        strategies: [
          {
            address: '0x0277bc9bb7b7e7f48faaf5a2023f247e5c7cd81bfab1221bd7e91c9d4894ec1a',
            index: 0
          }
        ],
        proposal: 1,
        choice: 1
      }
    });

    expect(envelope).toMatchSnapshot();
  });
});

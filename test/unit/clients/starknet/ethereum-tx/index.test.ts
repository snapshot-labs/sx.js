import { Provider, constants } from 'starknet';
import { EthereumTx } from '../../../../../src/clients/starknet/ethereum-tx';

describe('EthereumTx', () => {
  const ethUrl = process.env.GOERLI_NODE_URL as string;
  const starkProvider = new Provider({
    sequencer: {
      baseUrl: 'https://alpha4.starknet.io',
      chainId: constants.StarknetChainId.SN_GOERLI
    }
  });

  const ethereumTx = new EthereumTx({
    ethUrl,
    starkProvider
  });

  it('should return propose hash', async () => {
    const envelope = {
      address: '0x556B14CbdA79A36dC33FcD461a04A5BCb5dC2A70',
      data: {
        message: {
          space: '0x06330d3e48f59f5411c201ee2e9e9ccdc738fb3bb192b0e77e4eda26fa1a22f8',
          authenticator: '0x00e6533da3322019c3e26bd6942b647a74593af805021003bab707267717952a',
          strategies: [],
          executionStrategy: {
            addr: '0x040de235a2b53e921d37c2ea2b160750ca2e94f01d709f78f870963559de8fbe',
            params: '0x101'
          },
          metadataUri: 'ipfs://QmNrm6xKuib1THtWkiN5CKtBEerQCDpUtmgDqiaU2xDmca'
        }
      }
    };

    const result = await ethereumTx.getProposeHash(envelope);
    expect(result).toEqual('0x3ad40633624c0bdf77b702ffb5a8dac0f3d53d8558956615c1445fc6dfb48ce');
  });

  it('should return vote hash', async () => {
    const envelope = {
      address: '0x556B14CbdA79A36dC33FcD461a04A5BCb5dC2A70',
      data: {
        message: {
          space: '0x06330d3e48f59f5411c201ee2e9e9ccdc738fb3bb192b0e77e4eda26fa1a22f8',
          authenticator: '0x00e6533da3322019c3e26bd6942b647a74593af805021003bab707267717952a',
          strategies: [
            {
              index: 0,
              address: '0x0277bc9bb7b7e7f48faaf5a2023f247e5c7cd81bfab1221bd7e91c9d4894ec1a'
            }
          ],
          proposal: 32,
          choice: 1
        }
      }
    };

    const result = await ethereumTx.getVoteHash(envelope);
    expect(result).toEqual('0x6dc6c54be8e65b19bd10609478d5ee43853df398340762220fe6d7a94a379f5');
  });

  it('should return update proposal hash', async () => {
    const envelope = {
      address: '0x556B14CbdA79A36dC33FcD461a04A5BCb5dC2A70',
      data: {
        message: {
          space: '0x06330d3e48f59f5411c201ee2e9e9ccdc738fb3bb192b0e77e4eda26fa1a22f8',
          authenticator: '0x00e6533da3322019c3e26bd6942b647a74593af805021003bab707267717952a',
          proposal: 32,
          executionStrategy: {
            addr: '0x040de235a2b53e921d37c2ea2b160750ca2e94f01d709f78f870963559de8fbe',
            params: '0x101'
          },
          metadataUri: 'ipfs://QmNrm6xKuib1THtWkiN5CKtBEerQCDpUtmgDqiaU2xDmca'
        }
      }
    };

    const result = await ethereumTx.getUpdateProposalHash(envelope);
    expect(result).toEqual('0x1325c9102ba8343c4e118efc0986cb7298b3fc23a7f0fb941118560692c0bde');
  });
});

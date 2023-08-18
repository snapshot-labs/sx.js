import { Provider, constants } from 'starknet';
import { EthereumTx } from '../../../../../src/clients/starknet/ethereum-tx';
import { Wallet } from '@ethersproject/wallet';

describe('EthereumTx', () => {
  const ethPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

  const ethUrl = process.env.GOERLI_NODE_URL as string;
  const starkProvider = new Provider({
    sequencer: {
      baseUrl: 'https://alpha4.starknet.io',
      chainId: constants.StarknetChainId.SN_GOERLI
    }
  });

  const wallet = new Wallet(ethPrivateKey);

  const ethereumTx = new EthereumTx({
    ethUrl,
    starkProvider
  });

  it('should return propose hash', async () => {
    const data = {
      space: '0x06330d3e48f59f5411c201ee2e9e9ccdc738fb3bb192b0e77e4eda26fa1a22f8',
      authenticator: '0x00e6533da3322019c3e26bd6942b647a74593af805021003bab707267717952a',
      strategies: [
        {
          address: '0x0277bc9bb7b7e7f48faaf5a2023f247e5c7cd81bfab1221bd7e91c9d4894ec1a',
          index: 0
        }
      ],
      executionStrategy: {
        addr: '0x040de235a2b53e921d37c2ea2b160750ca2e94f01d709f78f870963559de8fbe',
        params: ['0x101']
      },
      metadataUri: 'ipfs://QmNrm6xKuib1THtWkiN5CKtBEerQCDpUtmgDqiaU2xDmca'
    };

    const result = await ethereumTx.getProposeHash(wallet, data);
    expect(result).toEqual('0x10120e24e09c13c45028d155fe2befa932618a0afd6b81db8d15cf7e9fe771e');
  });

  it('should return vote hash', async () => {
    const data = {
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
    };

    const result = await ethereumTx.getVoteHash(wallet, data);
    expect(result).toEqual('0x56b96d4c0cc4da80f41f11285486d1a1b8cd500df267d9dff9baca4aefc6da2');
  });

  it('should return update proposal hash', async () => {
    const data = {
      space: '0x06330d3e48f59f5411c201ee2e9e9ccdc738fb3bb192b0e77e4eda26fa1a22f8',
      authenticator: '0x00e6533da3322019c3e26bd6942b647a74593af805021003bab707267717952a',
      proposal: 32,
      executionStrategy: {
        addr: '0x040de235a2b53e921d37c2ea2b160750ca2e94f01d709f78f870963559de8fbe',
        params: ['0x101']
      },
      metadataUri: 'ipfs://QmNrm6xKuib1THtWkiN5CKtBEerQCDpUtmgDqiaU2xDmca'
    };

    const result = await ethereumTx.getUpdateProposalHash(wallet, data);
    expect(result).toEqual('0x612204abe7ec1f8975360b848882b53578bbc03bf2bac834c9566cc828a2ab4');
  });
});

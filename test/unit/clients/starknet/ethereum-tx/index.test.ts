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
      strategies: [],
      executionStrategy: {
        addr: '0x040de235a2b53e921d37c2ea2b160750ca2e94f01d709f78f870963559de8fbe',
        params: '0x101'
      },
      metadataUri: 'ipfs://QmNrm6xKuib1THtWkiN5CKtBEerQCDpUtmgDqiaU2xDmca'
    };

    const result = await ethereumTx.getProposeHash(wallet, data);
    expect(result).toEqual('0x592ee3452c4a64acb4d79edecf6178ecafca04773abd79ef3a78bde1166fc3');
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
    expect(result).toEqual('0x3b8c154177b1caa5913c39d61922d380042b84653796ef869d8b0c202908842');
  });

  it('should return update proposal hash', async () => {
    const data = {
      space: '0x06330d3e48f59f5411c201ee2e9e9ccdc738fb3bb192b0e77e4eda26fa1a22f8',
      authenticator: '0x00e6533da3322019c3e26bd6942b647a74593af805021003bab707267717952a',
      proposal: 32,
      executionStrategy: {
        addr: '0x040de235a2b53e921d37c2ea2b160750ca2e94f01d709f78f870963559de8fbe',
        params: '0x101'
      },
      metadataUri: 'ipfs://QmNrm6xKuib1THtWkiN5CKtBEerQCDpUtmgDqiaU2xDmca'
    };

    const result = await ethereumTx.getUpdateProposalHash(wallet, data);
    expect(result).toEqual('0x538b5e3063624c112f5e1b0708ab59ba9d500538e57ea1b7f72f6dea0d56af');
  });
});

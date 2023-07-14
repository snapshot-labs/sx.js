import { JsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { EthereumSig } from '../../../../../src/clients/evm/ethereum-sig';

describe('EthereumSig', () => {
  const space = '0xef8cd9081d7969c5cdcbb84dd8d577d2daefb649';
  const authenticator = '0xc537d997ddc783e071f82ccbfaa0d768d310001b';
  const executor = '0x6241b5c89350bb3c465179706cf26050ea32444f';

  const provider = new JsonRpcProvider('http://127.0.0.1:8545');
  const signer = new Wallet(
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    provider
  );
  const ethSigClient = new EthereumSig();

  beforeAll(() => {
    jest.spyOn(ethSigClient, 'generateSalt').mockImplementation(() => 0);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should create propose envelope', async () => {
    const envelope = await ethSigClient.propose({
      signer,
      data: {
        space,
        authenticator,
        strategies: [{ index: 0, address: '0xc1245c5dca7885c73e32294140f1e5d30688c202' }],
        executionStrategy: { addr: executor, params: '0x00' },
        metadataUri: 'ipfs://QmNrm6xKuib1THtWkiN5CKtBEerQCDpUtmgDqiaU2xDmca'
      }
    });

    expect(envelope).toMatchSnapshot();
  });

  it('should create update proposal envelope', async () => {
    const envelope = await ethSigClient.updateProposal({
      signer,
      data: {
        space,
        proposal: 1,
        authenticator,
        executionStrategy: { addr: executor, params: '0x00' },
        metadataUri: 'ipfs://QmNrm6xKuib1THtWkiN5CKtBEerQCDpUtmgDqiaU2xDmca'
      }
    });

    expect(envelope).toMatchSnapshot();
  });

  it('should create vote envelope', async () => {
    const envelope = await ethSigClient.vote({
      signer,
      data: {
        space,
        authenticator,
        strategies: [{ index: 0, address: '0xc1245c5dca7885c73e32294140f1e5d30688c202' }],
        proposal: 1,
        choice: 1,
        metadataUri: ''
      }
    });

    expect(envelope).toMatchSnapshot();
  });
});

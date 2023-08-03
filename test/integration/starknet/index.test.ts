import { EthereumTx, StarkNetTx } from '../../../src/clients';
import { Account, Provider, constants } from 'starknet';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { Choice } from '../../../src/types';

describe('StarkNetTx', () => {
  expect(process.env.ETH_PK).toBeDefined();
  expect(process.env.STARKNET_ADDRESS).toBeDefined();
  expect(process.env.STARKNET_PK).toBeDefined();

  const ethUrl = process.env.GOERLI_NODE_URL as string;
  const ethPrivKey = process.env.ETH_PK as string;
  const address = process.env.STARKNET_ADDRESS as string;
  const privKey = process.env.STARKNET_PK as string;

  const starkProvider = new Provider({
    sequencer: {
      baseUrl: 'https://alpha4.starknet.io',
      chainId: constants.StarknetChainId.SN_GOERLI
    }
  });

  const ethProvider = new JsonRpcProvider('https://rpc.brovider.xyz/5');
  const wallet = new Wallet(ethPrivKey, ethProvider);
  const walletAddress = wallet.address;
  const account = new Account(starkProvider, address, privKey);

  describe('vanilla authenticator', () => {
    const client = new StarkNetTx({ starkProvider, ethUrl });
    const space = '0x06330d3e48f59f5411c201ee2e9e9ccdc738fb3bb192b0e77e4eda26fa1a22f8';
    const authenticator = '0x02c38c9a8f20e1c4c974503e1cac5a06658161df4a8be3b24762168c99c58dbd';
    const strategy = 0;
    const strategyAddress = '0x0277bc9bb7b7e7f48faaf5a2023f247e5c7cd81bfab1221bd7e91c9d4894ec1a';
    const executor = '0x040de235a2b53e921d37c2ea2b160750ca2e94f01d709f78f870963559de8fbe';

    it('StarkNetTx.propose()', async () => {
      const envelope = {
        address: walletAddress,
        data: {
          space,
          authenticator,
          strategies: [],
          executionStrategy: {
            addr: executor,
            params: '0x00'
          },
          metadataUri: 'ipfs://QmNrm6xKuib1THtWkiN5CKtBEerQCDpUtmgDqiaU2xDmca'
        }
      };

      const receipt = await client.propose(account, envelope);
      console.log('Receipt', receipt);

      await starkProvider.waitForTransaction(receipt.transaction_hash);

      expect(receipt.transaction_hash).toBeDefined();
    }, 60e3);

    it('StarkNetTx.vote()', async () => {
      const envelope = {
        address: walletAddress,
        data: {
          space,
          authenticator,
          strategies: [
            {
              index: strategy,
              address: strategyAddress
            }
          ],
          proposal: 33,
          choice: Choice.For
        }
      };

      const receipt = await client.vote(account, envelope);
      console.log('Receipt', receipt);

      await starkProvider.waitForTransaction(receipt.transaction_hash);

      expect(receipt.transaction_hash).toBeDefined();
    }, 60e3);
  });

  describe.only('ethTx authenticator', () => {
    const ethTxClient = new EthereumTx({ starkProvider, ethUrl });

    const client = new StarkNetTx({ starkProvider, ethUrl });
    const space = '0x06330d3e48f59f5411c201ee2e9e9ccdc738fb3bb192b0e77e4eda26fa1a22f8';
    const authenticator = '0x00e6533da3322019c3e26bd6942b647a74593af805021003bab707267717952a';
    const strategy = 0;
    const strategyAddress = '0x0277bc9bb7b7e7f48faaf5a2023f247e5c7cd81bfab1221bd7e91c9d4894ec1a';
    const executor = '0x040de235a2b53e921d37c2ea2b160750ca2e94f01d709f78f870963559de8fbe';

    describe('propose', () => {
      const envelope = {
        address: walletAddress,
        data: {
          space,
          authenticator,
          strategies: [],
          executionStrategy: {
            addr: executor,
            params: '0x101'
          },
          metadataUri: 'ipfs://QmNrm6xKuib1THtWkiN5CKtBEerQCDpUtmgDqiaU2xDmca'
        }
      };

      it('EthereumTx.initializePropose', async () => {
        const res = await ethTxClient.initializePropose(wallet, envelope);

        console.log('Receipt', res);
        expect(res.hash).toBeDefined();
      });

      it.only('StarkNetTx.propose()', async () => {
        const receipt = await client.propose(account, envelope);
        console.log('Receipt', receipt);

        await starkProvider.waitForTransaction(receipt.transaction_hash);

        expect(receipt.transaction_hash).toBeDefined();
      }, 60e3);
    });

    describe('vote', () => {
      const envelope = {
        address: walletAddress,
        data: {
          space,
          authenticator,
          strategies: [
            {
              index: strategy,
              address: strategyAddress
            }
          ],
          proposal: 34,
          choice: Choice.For
        }
      };

      it('EthereumTx.initializeVote', async () => {
        const res = await ethTxClient.initializeVote(wallet, envelope);

        console.log('Receipt', res);
        expect(res.hash).toBeDefined();
      });

      it.only('StarkNetTx.vote()', async () => {
        const receipt = await client.vote(account, envelope);
        console.log('Receipt', receipt);

        await starkProvider.waitForTransaction(receipt.transaction_hash);

        expect(receipt.transaction_hash).toBeDefined();
      }, 60e3);
    });
  });
});

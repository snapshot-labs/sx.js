import { Account, Provider } from 'starknet';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { EthereumTx, StarkNetTx } from '../../../src/clients';
import { Choice } from '../../../src/types';
import { postMessageToL2, setup, TestConfig } from './utils';

describe('StarkNetTx', () => {
  const ethUrl = 'https://rpc.brovider.xyz/5';
  const address = '0x7db41c74cfbc2eb3f9166998c9c57154cfdf743083ee29fd3a3a164ce42c681';
  const privateKey = '0xd38597b88d0ae55d45f8d8f4b3aa77cd';
  const ethPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

  const starkProvider = new Provider({
    sequencer: {
      baseUrl: 'http://127.0.0.1:5050'
    }
  });

  const ethProvider = new JsonRpcProvider('https://rpc.brovider.xyz/5');
  const wallet = new Wallet(ethPrivateKey, ethProvider);
  const walletAddress = wallet.address;
  const account = new Account(starkProvider, address, privateKey);

  let client: StarkNetTx;
  let ethTxClient: EthereumTx;
  let testConfig: TestConfig;
  let spaceAddress = '';

  beforeAll(async () => {
    testConfig = await setup(account);
    spaceAddress = testConfig.spaceAddress;

    client = new StarkNetTx({
      starkProvider,
      ethUrl,
      networkConfig: testConfig.networkConfig
    });
    ethTxClient = new EthereumTx({
      starkProvider,
      ethUrl,
      networkConfig: testConfig.networkConfig,
      sequencerUrl: 'http://127.0.0.1:5050'
    });
  }, 180_000);

  describe('vanilla authenticator', () => {
    it('StarkNetTx.propose()', async () => {
      const envelope = {
        address: walletAddress,
        data: {
          space: spaceAddress,
          authenticator: testConfig.vanillaAuthenticator,
          strategies: [],
          executionStrategy: {
            addr: testConfig.vanillaExecutionStrategy,
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
          space: spaceAddress,
          authenticator: testConfig.vanillaAuthenticator,
          strategies: [
            {
              index: 0,
              address: testConfig.vanillaVotingStrategy
            }
          ],
          proposal: 1,
          choice: Choice.For
        }
      };

      const receipt = await client.vote(account, envelope);
      console.log('Receipt', receipt);

      await starkProvider.waitForTransaction(receipt.transaction_hash);

      expect(receipt.transaction_hash).toBeDefined();
    }, 60e3);
  });

  describe('ethTx authenticator', () => {
    it('StarkNetTx.propose()', async () => {
      const envelope = {
        address: walletAddress,
        data: {
          space: spaceAddress,
          authenticator: testConfig.ethTxAuthenticator,
          strategies: [],
          executionStrategy: {
            addr: testConfig.vanillaExecutionStrategy,
            params: '0x101'
          },
          metadataUri: 'ipfs://QmNrm6xKuib1THtWkiN5CKtBEerQCDpUtmgDqiaU2xDmca'
        }
      };

      const payload = await ethTxClient.getProposeHash(envelope);
      const fee = await ethTxClient.estimateProposeFee(envelope);

      await postMessageToL2(
        testConfig.ethTxAuthenticator,
        'commit',
        [walletAddress, payload],
        fee.overall_fee
      );

      const receipt = await client.propose(account, envelope);
      console.log('Receipt', receipt);

      await starkProvider.waitForTransaction(receipt.transaction_hash);

      expect(receipt.transaction_hash).toBeDefined();
    }, 60e3);

    it('StarkNetTx.vote()', async () => {
      const envelope = {
        address: walletAddress,
        data: {
          space: spaceAddress,
          authenticator: testConfig.ethTxAuthenticator,
          strategies: [
            {
              index: 0,
              address: testConfig.vanillaVotingStrategy
            }
          ],
          proposal: 2,
          choice: Choice.For
        }
      };

      const payload = await ethTxClient.getVoteHash(envelope);
      const fee = await ethTxClient.estimateVoteFee(envelope);

      await postMessageToL2(
        testConfig.ethTxAuthenticator,
        'commit',
        [walletAddress, payload],
        fee.overall_fee
      );

      const receipt = await client.vote(account, envelope);
      console.log('Receipt', receipt);

      await starkProvider.waitForTransaction(receipt.transaction_hash);

      expect(receipt.transaction_hash).toBeDefined();
    }, 60e3);
  });
});

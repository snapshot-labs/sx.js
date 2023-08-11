import { Account, Provider } from 'starknet';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { EthereumTx, StarkNetSig, StarkNetTx } from '../../../src/clients';
import { Choice } from '../../../src/types';
import { postMessageToL2, setup, TestConfig } from './utils';

describe('StarkNetTx', () => {
  const ethUrl = 'https://rpc.brovider.xyz/5';
  const address = '0x7d2f37b75a5e779f7da01c22acee1b66c39e8ba470ee5448f05e1462afcedb4';
  const privateKey = '0xcd613e30d8f16adf91b7584a2265b1f5';
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
  let starkSigClient: StarkNetSig;
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
    starkSigClient = new StarkNetSig({
      starkProvider,
      ethUrl,
      networkConfig: testConfig.networkConfig
    });
  }, 180_000);

  describe('vanilla authenticator', () => {
    it('StarkNetTx.propose()', async () => {
      const envelope = {
        signatureData: {
          address: walletAddress
        },
        data: {
          space: spaceAddress,
          authenticator: testConfig.vanillaAuthenticator,
          strategies: [],
          executionStrategy: {
            addr: testConfig.vanillaExecutionStrategy,
            params: ['0x00']
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
        signatureData: {
          address: walletAddress
        },
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
      const data = {
        space: spaceAddress,
        authenticator: testConfig.ethTxAuthenticator,
        strategies: [],
        executionStrategy: {
          addr: testConfig.vanillaExecutionStrategy,
          params: ['0x101']
        },
        metadataUri: 'ipfs://QmNrm6xKuib1THtWkiN5CKtBEerQCDpUtmgDqiaU2xDmca'
      };

      const payload = await ethTxClient.getProposeHash(wallet, data);
      const fee = await ethTxClient.estimateProposeFee(wallet, data);

      await postMessageToL2(
        testConfig.ethTxAuthenticator,
        'commit',
        [walletAddress, payload],
        fee.overall_fee
      );

      const receipt = await client.propose(account, {
        signatureData: {
          address: walletAddress
        },
        data
      });
      console.log('Receipt', receipt);

      await starkProvider.waitForTransaction(receipt.transaction_hash);

      expect(receipt.transaction_hash).toBeDefined();
    }, 60e3);

    it('StarkNetTx.vote()', async () => {
      const data = {
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
      };

      const payload = await ethTxClient.getVoteHash(wallet, data);
      const fee = await ethTxClient.estimateVoteFee(wallet, data);

      await postMessageToL2(
        testConfig.ethTxAuthenticator,
        'commit',
        [walletAddress, payload],
        fee.overall_fee
      );

      const receipt = await client.vote(account, {
        signatureData: {
          address: walletAddress
        },
        data
      });
      console.log('Receipt', receipt);

      await starkProvider.waitForTransaction(receipt.transaction_hash);

      expect(receipt.transaction_hash).toBeDefined();
    }, 60e3);
  });

  describe('starkSig authenticator', () => {
    it('StarkNetTx.propose()', async () => {
      const data = {
        space: spaceAddress,
        authenticator: testConfig.starkSigAuthenticator,
        strategies: [],
        executionStrategy: {
          addr: testConfig.vanillaExecutionStrategy,
          params: ['0x00']
        },
        metadataUri: 'ipfs://QmNrm6xKuib1THtWkiN5CKtBEerQCDpUtmgDqiaU2xDmca'
      };

      const envelope = await starkSigClient.propose({ signer: account, data });

      const receipt = await client.propose(account, envelope);
      console.log('Receipt', receipt);

      await starkProvider.waitForTransaction(receipt.transaction_hash);

      expect(receipt.transaction_hash).toBeDefined();
    }, 60e3);

    it('StarkNetTx.vote()', async () => {
      const data = {
        space: spaceAddress,
        authenticator: testConfig.starkSigAuthenticator,
        strategies: [
          {
            index: 0,
            address: testConfig.vanillaVotingStrategy
          }
        ],
        proposal: 3,
        choice: Choice.For
      };

      const envelope = await starkSigClient.vote({ signer: account, data });

      const receipt = await client.vote(account, envelope);
      console.log('Receipt', receipt);

      await starkProvider.waitForTransaction(receipt.transaction_hash);

      expect(receipt.transaction_hash).toBeDefined();
    }, 60e3);
  });

  describe('vanilla authenticator + merkle tree strategy', () => {
    it('StarkNetTx.propose()', async () => {
      const envelope = {
        signatureData: {
          address: walletAddress
        },
        data: {
          space: spaceAddress,
          authenticator: testConfig.vanillaAuthenticator,
          strategies: [],
          executionStrategy: {
            addr: testConfig.vanillaExecutionStrategy,
            params: ['0x00']
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
        signatureData: {
          address: walletAddress
        },
        data: {
          space: spaceAddress,
          authenticator: testConfig.vanillaAuthenticator,
          strategies: [
            {
              index: 1,
              address: testConfig.merkleWhitelistVotingStrategy,
              metadata: testConfig.merkleWhitelistStrategyMetadata
            }
          ],
          proposal: 4,
          choice: Choice.For
        }
      };

      const receipt = await client.vote(account, envelope);
      console.log('Receipt', receipt);

      await starkProvider.waitForTransaction(receipt.transaction_hash);

      expect(receipt.transaction_hash).toBeDefined();
    }, 60e3);
  });

  it('should cancel proposal', async () => {
    const res = await client.cancelProposal({
      signer: account,
      space: spaceAddress,
      proposal: 3
    });

    expect(res.transaction_hash).toBeDefined();
  });

  it('should set min voting duration', async () => {
    const res = await client.setMinVotingDuration({
      signer: account,
      space: spaceAddress,
      minVotingDuration: 1
    });

    expect(res.transaction_hash).toBeDefined();
  });

  it('should set max voting duration', async () => {
    const res = await client.setMaxVotingDuration({
      signer: account,
      space: spaceAddress,
      maxVotingDuration: 1
    });

    expect(res.transaction_hash).toBeDefined();
  });

  it('should set voting delay', async () => {
    const res = await client.setVotingDelay({
      signer: account,
      space: spaceAddress,
      votingDelay: 1
    });

    expect(res.transaction_hash).toBeDefined();
  });

  it('should set metadataUri', async () => {
    const res = await client.setMetadataUri({
      signer: account,
      space: spaceAddress,
      metadataUri: ''
    });

    expect(res.transaction_hash).toBeDefined();
  });

  it('should transfer ownership', async () => {
    const res = await client.transferOwnership({
      signer: account,
      space: spaceAddress,
      owner: '0x7d2f37b75a5e779f7da01c22acee1b66c39e8ba470ee5448f05e1462afcedb4'
    });

    expect(res.transaction_hash).toBeDefined();
  });
});

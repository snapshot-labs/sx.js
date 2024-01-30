/* eslint-disable @typescript-eslint/no-unused-vars */

import { Contract, CallData } from 'starknet';
import { keccak256 } from '@ethersproject/keccak256';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import fetch from 'cross-fetch';
import EVMSlotValue from './abis/EVMSlotValue.json';
import SpaceAbi from '../../clients/starknet/starknet-tx/abis/Space.json';
import type { ClientConfig, Envelope, Strategy, Propose, Vote } from '../../types';
import { getUserAddressEnum } from '../../utils/starknet-enums';

export default function createEvmSlotValueStrategy({
  deployedOnChain
}: {
  deployedOnChain: string;
}): Strategy {
  function getEthRpcUrl(chainId: number) {
    const apiKey = '46a5dd9727bf48d4a132672d3f376146';

    // TODO: ideally we would use rpc.snapshotx.xyz here but those don't support eth_getProof with past lookup
    if (chainId === 1) return `https://mainnet.infura.io/v3/${apiKey}`;
    if (chainId === 5) return `https://goerli.infura.io/v3/${apiKey}`;
    if (chainId === 11155111) return `https://sepolia.infura.io/v3/${apiKey}`;
    if (chainId === 137) return `https://polygon-mainnet.infura.io/v3/${apiKey}`;
    if (chainId === 42161) return `https://arbitrum-mainnet.infura.io/v3/${apiKey}`;

    throw new Error(`Unsupported chainId ${chainId}`);
  }

  function getEthProvider(chainId: number) {
    return new StaticJsonRpcProvider(getEthRpcUrl(chainId), chainId);
  }

  function getSlotKey(voterAddress: string, slotIndex: number) {
    return keccak256(
      `0x${voterAddress.slice(2).padStart(64, '0')}${slotIndex.toString(16).padStart(64, '0')}`
    );
  }

  async function getBinaryTree(snapshotTimestamp: number, chainId: number) {
    const res = await fetch(
      `https://ds-indexer.api.herodotus.cloud/binsearch-path?timestamp=${snapshotTimestamp}&deployed_on_chain=${deployedOnChain}&accumulates_chain=${chainId}`,
      {
        headers: {
          accept: 'application/json'
        }
      }
    );

    return res.json();
  }

  async function getProof(
    l1TokenAddress: string,
    voterAddress: string,
    slotIndex: number,
    blockNumber: number,
    chainId: number
  ) {
    const provider = getEthProvider(chainId);

    const proof = await provider.send('eth_getProof', [
      l1TokenAddress,
      [getSlotKey(voterAddress, slotIndex)],
      `0x${blockNumber.toString(16)}`
    ]);

    return proof.storageProof[0].proof.map(
      (node: string) =>
        node
          .slice(2)
          .match(/.{1,16}/g)
          ?.map(
            (word: string) =>
              `0x${word
                .replace(/^(.(..)*)$/, '0$1')
                .match(/../g)
                ?.reverse()
                .join('')}`
          )
    );
  }

  return {
    type: 'evmSlotValue',
    async getParams(
      call: 'propose' | 'vote',
      signerAddress: string,
      address: string,
      index: number,
      metadata: Record<string, any> | null,
      envelope: Envelope<Propose | Vote>,
      clientConfig: ClientConfig
    ): Promise<string[]> {
      if (call === 'propose') throw new Error('Not supported for proposing');
      if (signerAddress.length !== 42) throw new Error('Not supported for non-Ethereum addresses');
      if (!metadata) throw new Error('Invalid metadata');

      const voteEnvelope = envelope as Envelope<Vote>;

      const spaceContract = new Contract(
        SpaceAbi,
        voteEnvelope.data.space,
        clientConfig.starkProvider
      );
      const proposalStruct = (await spaceContract.call('proposals', [
        voteEnvelope.data.proposal
      ])) as any;
      const startTimestamp = proposalStruct.start_timestamp;

      const { herodotusAccumulatesChainId: chainId } = clientConfig.networkConfig;
      const { contractAddress, slotIndex } = metadata;

      const tree = await getBinaryTree(startTimestamp, chainId);
      const l1BlockNumber = tree.path[1].blockNumber;

      const storageProof = await getProof(
        contractAddress,
        signerAddress,
        slotIndex,
        l1BlockNumber,
        chainId
      );

      return CallData.compile({
        storageProof
      });
    },
    async getVotingPower(
      strategyAddress: string,
      voterAddress: string,
      metadata: Record<string, any> | null,
      timestamp: number | null,
      params: string[],
      clientConfig: ClientConfig
    ): Promise<bigint> {
      if (!metadata) return 0n;

      const isEthereumAddress = voterAddress.length === 42;
      if (!isEthereumAddress) return 0n;

      const { herodotusAccumulatesChainId: chainId } = clientConfig.networkConfig;
      const { contractAddress, slotIndex } = metadata;

      if (!timestamp) {
        const provider = getEthProvider(chainId);
        const storage = await provider.getStorageAt(
          contractAddress,
          getSlotKey(voterAddress, slotIndex)
        );

        return BigInt(storage);
      }

      const contract = new Contract(EVMSlotValue, strategyAddress, clientConfig.starkProvider);

      const tree = await getBinaryTree(timestamp, chainId);
      const l1BlockNumber = tree.path[1].blockNumber;

      const storageProof = await getProof(
        contractAddress,
        voterAddress,
        slotIndex,
        l1BlockNumber,
        chainId
      );

      return contract.get_voting_power(
        timestamp,
        getUserAddressEnum(voterAddress.length === 42 ? 'ETHEREUM' : 'STARKNET', voterAddress),
        params,
        CallData.compile({
          storageProof
        })
      );
    }
  };
}

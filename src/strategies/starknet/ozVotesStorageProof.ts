/* eslint-disable @typescript-eslint/no-unused-vars */

import { Contract, CallData, num } from 'starknet';
import { Contract as EvmContract } from '@ethersproject/contracts';
import { keccak256 } from '@ethersproject/keccak256';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import fetch from 'cross-fetch';
import OzVotesToken from './abis/OzVotesToken.json';
import OZVotesStorageProof from './abis/OZVotesStorageProof.json';
import SpaceAbi from '../../clients/starknet/starknet-tx/abis/Space.json';
import type { ClientConfig, Envelope, Strategy, Propose, Vote } from '../../types';
import { getUserAddressEnum } from '../../utils/starknet-enums';

export default function createOzVotesStorageProofStrategy({
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

  async function getProofs(
    l1TokenAddress: string,
    voterAddress: string,
    numCheckpoints: number,
    slotIndex: number,
    blockNumber: number,
    chainId: number
  ) {
    const provider = getEthProvider(chainId);

    const checkpointSlotKey =
      BigInt(keccak256(getSlotKey(voterAddress, slotIndex))) + BigInt(numCheckpoints) - BigInt(1);
    const nextEmptySlotKey = checkpointSlotKey + BigInt(1);

    const proof = await provider.send('eth_getProof', [
      l1TokenAddress,
      [`0x${checkpointSlotKey.toString(16)}`, `0x${nextEmptySlotKey.toString(16)}`],
      `0x${blockNumber.toString(16)}`
    ]);

    const proofs = proof.storageProof.map(({ proof }) =>
      proof.map(
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
      )
    ) as string[][];

    return {
      proofs,
      checkpointIndex: BigInt(numCheckpoints) - BigInt(1)
    };
  }

  return {
    type: 'ozVotesStorageProof',
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

      const { herodotusAccumulatesChainId: chainId } = clientConfig.networkConfig;
      const { contractAddress, slotIndex } = metadata;

      const provider = getEthProvider(chainId);
      const tokenContract = new EvmContract(contractAddress, OzVotesToken, provider);
      const numCheckpoints: number = await tokenContract.numCheckpoints(signerAddress);
      if (numCheckpoints === 0) throw new Error('No checkpoints found');

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

      const tree = await getBinaryTree(startTimestamp, chainId);
      const l1BlockNumber = tree.path[1].blockNumber;

      const { proofs, checkpointIndex } = await getProofs(
        contractAddress,
        signerAddress,
        numCheckpoints,
        slotIndex,
        l1BlockNumber,
        chainId
      );

      return CallData.compile({
        checkpointIndex,
        checkpointMptProof: proofs[0],
        exclusionMpt: proofs[1]
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
      const provider = getEthProvider(chainId);

      const tokenContract = new EvmContract(contractAddress, OzVotesToken, provider);
      if (!timestamp) return tokenContract.getVotes(voterAddress);

      const numCheckpoints: number = await tokenContract.numCheckpoints(voterAddress);
      if (numCheckpoints === 0) return 0n;

      const contract = new Contract(
        OZVotesStorageProof,
        strategyAddress,
        clientConfig.starkProvider
      );

      const tree = await getBinaryTree(timestamp, chainId);
      const l1BlockNumber = tree.path[1].blockNumber;

      const { proofs, checkpointIndex } = await getProofs(
        contractAddress,
        voterAddress,
        numCheckpoints,
        slotIndex,
        l1BlockNumber,
        chainId
      );

      return contract.get_voting_power(
        timestamp,
        getUserAddressEnum('ETHEREUM', voterAddress),
        params,
        CallData.compile({
          checkpointIndex,
          checkpointMptProof: proofs[0],
          exclusionMptProof: proofs[1]
        })
      );
    }
  };
}

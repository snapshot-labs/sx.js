/* eslint-disable @typescript-eslint/no-unused-vars */

import { Contract, type Call } from 'starknet';
import ERC20VotesAbi from './abis/ERC20Votes.json';
import type { ClientConfig, Envelope, Strategy, Propose, Vote } from '../../types';
import { getUserAddressEnum } from '../../utils/starknet-enums';

export default function createErc20VotesStrategy(): Strategy {
  return {
    type: 'erc20Votes',
    async getParams(
      call: 'propose' | 'vote',
      signerAddress: string,
      address: string,
      index: number,
      metadata: Record<string, any> | null,
      envelope: Envelope<Propose | Vote>,
      clientConfig: ClientConfig
    ): Promise<string[]> {
      return [];
    },
    async getExtraProposeCalls(
      address: string,
      index: number,
      envelope: Envelope<Propose | Vote>,
      clientConfig: ClientConfig
    ): Promise<Call[]> {
      return [];
    },
    async getVotingPower(
      strategyAddress: string,
      voterAddress: string,
      metadata: Record<string, any> | null,
      timestamp: number,
      params: string[],
      clientConfig: ClientConfig
    ): Promise<bigint> {
      const contract = new Contract(ERC20VotesAbi, strategyAddress, clientConfig.starkProvider);

      return contract.get_voting_power(
        timestamp,
        getUserAddressEnum('STARKNET', voterAddress),
        params,
        []
      );
    }
  };
}

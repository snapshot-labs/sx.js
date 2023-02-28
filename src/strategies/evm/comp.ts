import { Contract } from '@ethersproject/contracts';
import ICompAbi from './abis/IComp.json';
import type { Provider } from '@ethersproject/providers';
import type { Strategy } from '../../clients/evm/types';

export default function createCompStrategy(): Strategy {
  return {
    type: 'comp',
    async getParams(): Promise<string> {
      return '0x00';
    },
    async getVotingPower(
      strategyAddress: string,
      voterAddress: string,
      block: number,
      params: string,
      provider: Provider
    ): Promise<bigint> {
      const compContract = new Contract(params, ICompAbi, provider);
      const votingPower = await compContract.getPriorVotes(voterAddress, block);

      return BigInt(votingPower.toString());
    }
  };
}

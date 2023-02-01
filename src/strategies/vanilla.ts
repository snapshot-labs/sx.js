/* eslint-disable @typescript-eslint/no-unused-vars */

import type { Call } from 'starknet';
import type {
  VanillaStrategyConfig,
  ClientConfig,
  Envelope,
  Strategy,
  VanillaProposeMessage,
  VanillaVoteMessage
} from '../types';

export default function createVanillaStrategy(): Strategy {
  return {
    type: 'vanilla',
    async getParams(
      call: 'propose' | 'vote',
      address: string,
      index: number,
      envelope: Envelope<VanillaProposeMessage | VanillaVoteMessage>,
      clientConfig: ClientConfig
    ): Promise<string[]> {
      return [];
    },
    async getExtraCalls(
      call: 'propose' | 'vote',
      address: string,
      index: number,
      envelope: Envelope<VanillaProposeMessage | VanillaVoteMessage>,
      clientConfig: ClientConfig
    ): Promise<Call[]> {
      return [];
    }
  };
}

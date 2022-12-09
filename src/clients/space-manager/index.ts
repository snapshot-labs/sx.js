import { Interface } from '@ethersproject/abi';
import { Contract } from '@ethersproject/contracts';
import { Wallet } from '@ethersproject/wallet';
import { createExecutionHash } from '../../utils/encoding/execution-hash';
import { SplitUint256 } from '../../utils/split-uint256';
import { getExecutionData } from '../../executors';
import { defaultNetwork } from '../../networks';
import ZodiacAbi from './abis/zodiac.json';
import type { Account } from 'starknet';
import type { MetaTransaction } from '../../utils/encoding/execution-hash';
import type { ClientOpts, ClientConfig, ExecutionInput } from '../../types';

export class SpaceManager {
  config: ClientConfig & {
    account: Account;
    ethereumWallet: Wallet;
  };

  zodiacInterface: Interface;

  constructor(opts: ClientOpts & { account: Account; ethereumWallet: Wallet }) {
    this.config = {
      networkConfig: defaultNetwork,
      ...opts
    };

    this.zodiacInterface = new Interface(ZodiacAbi);
  }

  async finalizeProposal(
    space: string,
    proposalId: number,
    executor: string,
    input?: ExecutionInput
  ) {
    const { executionParams } = getExecutionData(executor, this.config.networkConfig, input);

    const call = {
      contractAddress: space,
      entrypoint: 'finalizeProposal',
      calldata: [proposalId, executionParams.length, ...executionParams]
    };

    const fee = await this.config.account.estimateFee(call);
    return this.config.account.execute(call, undefined, {
      maxFee: fee.suggestedMaxFee
    });
  }

  async receiveProposal(space: string, executor: string, input?: ExecutionInput) {
    if (!input?.transactions) throw new Error('Expected transactions in input');

    const executorConfig = this.config.networkConfig.executors[executor];
    if (executorConfig?.type !== 'ethRelayer') throw new Error('Expected ethRelayer executor');

    const { destination, chainId } = executorConfig.params;

    const zodiacModule = new Contract(
      destination,
      this.zodiacInterface,
      this.config.ethereumWallet
    );

    const { executionHash, txHashes } = createExecutionHash(
      input.transactions,
      destination,
      chainId
    );
    const executionHashSplit = SplitUint256.fromHex(executionHash);

    const proposalOutcome = 1;

    return zodiacModule.receiveProposal(
      space,
      proposalOutcome,
      executionHashSplit.low,
      executionHashSplit.high,
      txHashes,
      { gasLimit: 110000 }
    );
  }

  async executeProposalTx(proposalIndex: number, executor: string, transaction: MetaTransaction) {
    const executorConfig = this.config.networkConfig.executors[executor];
    if (executorConfig?.type !== 'ethRelayer') throw new Error('Expected ethRelayer executor');

    const { destination } = executorConfig.params;

    const zodiacModule = new Contract(
      destination,
      this.zodiacInterface,
      this.config.ethereumWallet
    );

    return zodiacModule.executeProposalTx(
      proposalIndex,
      transaction.to,
      transaction.value,
      transaction.data,
      transaction.operation
    );
  }
}

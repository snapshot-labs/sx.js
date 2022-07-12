import {
  Account,
  AddTransactionResponse,
  Contract,
  defaultProvider as provider,
  hash
} from 'starknet';
import abi from './abi/auth.json';
import constants from './constants.json';
import { strToShortStringArr } from '../../utils/strings';

const { getSelectorFromName } = hash;

export class StarkNetTx {
  public auth: Contract;
  public account: Account;
  constructor(_account: Account) {
    // @ts-ignore
    this.auth = new Contract(abi as Abi, constants.auth, provider);
    this.account = _account;

    this.auth.connect(this.account);
  }

  async propose(
    author: string,
    space: string,
    executionHash: string,
    metadataUri: string
  ): Promise<any> {
    const blockNum: any = '1234567';
    const params: any = [];
    const metadataUriFelt = strToShortStringArr(metadataUri);
    const calldata: any[] = [author, executionHash, metadataUriFelt.length.toString()];

    // @ts-ignore
    metadataUriFelt.forEach((m) => calldata.push(m.toString()));
    calldata.push(blockNum);
    calldata.push(params.length.toString());

    const receipt = await this.auth.invoke(
      'execute',
      [
        /** to: */ space,
        /** function_selector: */ getSelectorFromName('propose'),
        /** calldata: */ calldata
      ],
      { maxFee: 0x19999999999999 }
    );

    // await provider.waitForTx(receipt.transaction_hash);
    await provider.waitForTransaction(receipt.transaction_hash);
    return receipt;
  }

  async vote(
    voter: string,
    space: string,
    proposal: string,
    choice: string
  ): Promise<AddTransactionResponse> {
    const params: any = [];

    const receipt = await this.auth.invoke(
      'execute',
      [
        // @ts-ignore
        /** to: */ space,
        /** function_selector: */ getSelectorFromName('vote'),
        /** calldata: */ [voter, proposal, choice, params.length.toString()]
      ],
      { maxFee: 0x19999999999999 }
    );
    console.log('Receipt', receipt);

    // await provider.waitForTx(receipt.transaction_hash);
    return receipt;
  }
}

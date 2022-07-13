import { StarkNetTx, StarkNetSig } from '../src/clients';
import { domain, voteTypes } from '../src/clients/starknet-sig/types';
import { config } from 'dotenv';
import { Account, defaultProvider as provider, ec } from 'starknet';

config();

const space = '0x0625dc1290b6e936be5f1a3e963cf629326b1f4dfd5a56738dea98e1ad31b7f3';
const starkKeyPair = ec.getKeyPair(process.env.PK as string);
const account = new Account(provider, process.env.ADDRESS as string, starkKeyPair);

const client = new StarkNetTx(account);
const signer = new StarkNetSig(account.address);

describe('', () => {
  
  it('StarkNetTx.propose()', async () => {
    const author = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
    const executionHash = '1';
    const metadataUri = 'ipfs://QmNrm6xKuib1THtWkiN5CKtBEerQCDpUtmgDqiaU2xDmca';
    const receipt = await client.propose(author, space, executionHash, metadataUri);
    expect(receipt.code).toBe('TRANSACTION_RECEIVED');
  }, 360e3);
                                                                                                                                                                                               
  it('StarkNetTx.vote()', async () => {
    const voter = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
    const proposal = '1';
    const choice = '2';
    const receipt = await client.vote(voter, space, proposal, choice);
    expect(receipt.code).toBe('TRANSACTION_RECEIVED');
  }, 360e3);

  it('StarknetSig.sign()', async () => {
    const typedData = {
      types: voteTypes,
      primaryType: 'Vote',
      domain,
      message: {
        space,
        proposal: 13,
        choice: 3
      }
    };
    const { address, sig, data } = await signer.sign(
      account,
      account.address,
      typedData.message,
      typedData.types,
      typedData.primaryType
    );
    const pubKey = ec.getKeyPair(process.env.PK as string).getPublic('hex');

    expect(await signer.verify(pubKey as string, address, sig, data)).toEqual(true);

    data.message.choice = 4;
    expect(await signer.verify(pubKey as string, address, sig, data)).toEqual(false);
  });
});

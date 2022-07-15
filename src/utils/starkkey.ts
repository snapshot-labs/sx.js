import { Signature, ec, typedData } from 'starknet';
import { TypedData } from 'starknet/src/utils/typedData/types';

export function verify(pubKey: string, address: string, data: TypedData, signature: Signature) {
  const safePubKey = BigInt(`0x${pubKey}`).toString();
  const msgHash = typedData.getMessageHash(data, address);
  const pubKeyPair = ec.getKeyPairFromPublicKey(safePubKey);
  return ec.verify(pubKeyPair, msgHash, signature);
}

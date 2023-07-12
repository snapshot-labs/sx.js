import { ec, typedData } from 'starknet';

export function verify(
  pubKey: string,
  address: string,
  data: typedData.TypedData,
  signature: ReturnType<typeof ec.starkCurve.sign>
) {
  const msgHash = typedData.getMessageHash(data, address);
  return ec.starkCurve.verify(signature.toDERHex(), msgHash, pubKey);
}

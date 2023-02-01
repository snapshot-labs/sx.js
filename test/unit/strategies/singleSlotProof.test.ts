import { defaultProvider } from 'starknet';
import createSingleSlotProofStrategy from '../../../src/strategies/singleSlotProof';
import { defaultNetwork } from '../../../src/networks';
import { getStorageVarAddress } from '../../../src/utils/encoding';
import { proposeEnvelope, voteEnvelope } from '../fixtures';

const ethUrl = process.env.GOERLI_NODE_URL as string;
const starkProvider = defaultProvider;

const latestL1Block = 8050780;

describe('singleSlotProofStrategy', () => {
  let mockStorageHash = '0x0';

  const singleSlotProofStrategy = createSingleSlotProofStrategy({
    fossilL1HeadersStoreAddress:
      '0x69606dd1655fdbbf8189e88566c54890be8f7e4a3650398ac17f6586a4a336d',
    fossilFactRegistryAddress: '0x2e39818908f0da118fde6b88b52e4dbdf13d2e171e488507f40deb6811bde3f'
  });
  const config = { starkProvider, ethUrl, networkConfig: defaultNetwork };

  let getStorageAtSpy;
  beforeAll(() => {
    const getStorageAt = starkProvider.getStorageAt;

    getStorageAtSpy = jest
      .spyOn(starkProvider, 'getStorageAt')
      .mockImplementation((contractAddress, key) => {
        if (
          contractAddress === '0x69606dd1655fdbbf8189e88566c54890be8f7e4a3650398ac17f6586a4a336d' &&
          key === getStorageVarAddress('_latest_l1_block')
        ) {
          return Promise.resolve(latestL1Block.toString(16));
        }

        if (
          contractAddress === '0x2e39818908f0da118fde6b88b52e4dbdf13d2e171e488507f40deb6811bde3f' &&
          key === '2842026109080255012094360634329872566622008440026082802794951354329726168434'
        ) {
          return Promise.resolve(mockStorageHash);
        }

        return getStorageAt.call(starkProvider, contractAddress, key);
      });
  });

  beforeEach(() => {
    mockStorageHash = '0x0';
  });

  afterAll(() => {
    getStorageAtSpy.mockRestore();
  });

  it('should return type', () => {
    expect(singleSlotProofStrategy.type).toBe('singleSlotProof');
  });

  it('should return params for vote', async () => {
    const params = await singleSlotProofStrategy.getParams(
      'vote',
      '0xd1b81feff3095ca9517fdfc7427e742ce96f7ca8f3b2664a21b2fba552493b',
      1,
      voteEnvelope,
      config
    );

    expect(params).toMatchSnapshot();
  });

  it('should return params for propose', async () => {
    const params = await singleSlotProofStrategy.getParams(
      'propose',
      '0xd1b81feff3095ca9517fdfc7427e742ce96f7ca8f3b2664a21b2fba552493b',
      1,
      proposeEnvelope,
      config
    );

    expect(params).toMatchSnapshot();
  });

  it('should return extra propose calls', async () => {
    const params = await singleSlotProofStrategy.getExtraCalls(
      'propose',
      '0xd1b81feff3095ca9517fdfc7427e742ce96f7ca8f3b2664a21b2fba552493b',
      1,
      proposeEnvelope,
      config
    );

    expect(params).toMatchSnapshot();
  });

  it('should return empty extra propose calls if already proven', async () => {
    mockStorageHash = '0x01';

    const params = await singleSlotProofStrategy.getExtraCalls(
      'propose',
      '0xd1b81feff3095ca9517fdfc7427e742ce96f7ca8f3b2664a21b2fba552493b',
      1,
      proposeEnvelope,
      config
    );

    expect(params).toMatchSnapshot();
  });
});

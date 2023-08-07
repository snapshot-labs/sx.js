export const proposeEnvelope = {
  address: '0x0538D033B879aC94C709c1E408CC081345427379',
  data: {
    space: '0x07e6e9047eb910f84f7e3b86cea7b1d7779c109c970a39b54379c1f4fa395b28',
    authenticator: '0x064cce9272197eba6353f5bbf060e097e516b411e66e83a9cf5910a08697df14',
    strategies: [
      {
        index: 1,
        address: '0x0277bc9bb7b7e7f48faaf5a2023f247e5c7cd81bfab1221bd7e91c9d4894ec1a'
      }
    ],
    executionStrategy: {
      addr: '0x04ecc83848a519cc22b0d0ffb70e65ec8dde85d3d13439eff7145d4063cf6b4d',
      params: '0x00'
    },
    metadataUri: 'ipfs://QmNrm6xKuib1THtWkiN5CKtBEerQCDpUtmgDqiaU2xDmca'
  }
};

export const voteEnvelope = {
  address: '0x0538D033B879aC94C709c1E408CC081345427379',
  data: {
    space: '0x07e6e9047eb910f84f7e3b86cea7b1d7779c109c970a39b54379c1f4fa395b28',
    authenticator: '0x064cce9272197eba6353f5bbf060e097e516b411e66e83a9cf5910a08697df14',
    strategies: [1],
    proposal: 3,
    choice: 1,
    voter: '0x0538D033B879aC94C709c1E408CC081345427379',
    strategiesHash: '0x078d74f61aeaa8286418fd34b3a12a610445eba11d00ecc82ecac2542d55f7a4',
    strategiesParamsHash: '0x04c643e1ba37b388f483a9dce226443876069bc87ff7ed6763c1f12048ff5cf9',
    salt: 0
  }
};

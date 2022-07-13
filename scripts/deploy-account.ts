import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { homedir } from 'os';

const NETWORK = 'alpha-goerli';

interface AccountInfo {
  PK: string;
  pubKey: string;
  address: string;
}

async function deployAccount(accountName: string) {
  try {
    execSync(`starknet deploy_account --account=${accountName}`);
  } catch (error) {
    console.log(error);
  }

  const accounts = readFileSync(
    homedir() + '/.starknet_accounts/starknet_open_zeppelin_accounts.json',
    'utf8'
  );
  const accountInfo = JSON.parse(accounts)[NETWORK][accountName];
  return {
    PK: accountInfo.private_key,
    pubKey: accountInfo.public_key,
    address: accountInfo.address
  } as AccountInfo;
}

async function main() {
  const accountName = 'newAccount3';
  try {
    const accountInfo = await deployAccount(accountName);
    console.log(accountInfo);
  } catch (error) {
    console.log(error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

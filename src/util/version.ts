import { readFileSync } from 'fs';

const VERSION = getVersion();
export default VERSION;

function getVersion(): string {
  try {
    return readFileSync(`${__dirname}/../../VERSION`).toString();
  } catch (error) {
    return 'dev';
  }
}

import * as Crypto from 'crypto';

// Only contains non-ambiguous characters.
// Needs to be a factor of 256 to avoid modulo bias.
const CHARSET = 'abcdefghijkmnpqrstuvwxyz23456789';

export default function randomString(length: number): string {
  let result = '';
  Crypto.randomBytes(length).forEach((b) => {
    result += CHARSET[b % CHARSET.length];
  });
  return result;
}

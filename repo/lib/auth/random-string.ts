import { randomBytes } from "crypto";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Generates a genuinely random string of the given length from a
 * 62-character alphanumeric alphabet, using Node's crypto.randomBytes
 * (never Math.random(), which is not cryptographically secure and must
 * never be used for anything that functions as an access credential).
 *
 * Uses rejection sampling rather than a plain `byte % alphabet.length`:
 * 256 isn't evenly divisible by 62, so a naive modulo would make
 * alphabet positions 0-7 come up slightly more often than 8-61 — a
 * real, if small, weakening of a value used as a security credential
 * (a club login token or an admin session token). The largest multiple
 * of 62 that fits in a byte is 62*4=248, so any byte >= 248 is
 * discarded and redrawn rather than reused, giving a truly uniform
 * selection across the whole alphabet.
 */
export function randomAlphanumeric(length: number): string {
  const maxUsable = Math.floor(256 / ALPHABET.length) * ALPHABET.length; // 248
  let result = "";
  while (result.length < length) {
    const byte = randomBytes(1)[0];
    if (byte < maxUsable) {
      result += ALPHABET[byte % ALPHABET.length];
    }
  }
  return result;
}

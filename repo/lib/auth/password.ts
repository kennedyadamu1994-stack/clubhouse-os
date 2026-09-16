import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCallback);

const SALT_BYTES = 16;
const KEY_LENGTH = 64;

/**
 * Hashes a plaintext password for storage (5 Sep security fix — the
 * admin login, step 2 of the security remediation plan). Uses Node's
 * built-in crypto.scrypt rather than a third-party library like bcrypt:
 * scrypt is memory-hard (genuinely resistant to GPU/ASIC brute-forcing,
 * unlike a fast general-purpose hash), ships in Node's standard library
 * with zero extra dependencies, and — critically for this deployment —
 * has no native C++ binding to compile, which is exactly the class of
 * problem that makes native `bcrypt` unreliable on Vercel's serverless
 * functions (confirmed via research before choosing this approach).
 *
 * Output format is "salt:hash", both hex-encoded, concatenated into one
 * string — this is what actually gets stored in the database. Storing
 * them together means verifyPassword never needs a separate salt column
 * or any bookkeeping about which salt belongs to which hash.
 *
 * A fresh random salt every time (never reused, never derived from the
 * password itself) is what defeats rainbow-table attacks — two admins
 * with the same password would still get completely different stored
 * hashes.
 */
export async function hashPassword(plaintext: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES).toString("hex");
  const derivedKey = (await scrypt(plaintext, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verifies a plaintext password against a stored "salt:hash" string
 * (see hashPassword's own doc comment for the format). Re-derives the
 * hash using the SAME salt pulled from the stored string, then compares
 * the two hashes — never the plaintext passwords themselves, since the
 * whole point of hashing is that the real password is never stored or
 * compared directly.
 *
 * Uses crypto.timingSafeEqual for the final comparison rather than
 * `===` or Buffer.equals — a naive string/buffer comparison exits as
 * soon as it finds the first mismatched byte, which means comparison
 * time leaks how many leading bytes were correct. That's a genuine,
 * exploitable timing side-channel for anything as sensitive as a
 * password hash; timingSafeEqual always takes the same amount of time
 * regardless of where (or whether) the buffers differ.
 */
export async function verifyPassword(plaintext: string, stored: string): Promise<boolean> {
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false; // malformed stored value — never crash a login attempt on bad data, just fail it
  const storedHash = Buffer.from(hashHex, "hex");
  const derivedKey = (await scrypt(plaintext, salt, KEY_LENGTH)) as Buffer;
  // timingSafeEqual throws if the two buffers have different lengths
  // (rather than returning false) — guard that explicitly so a
  // corrupted/truncated stored hash fails the login cleanly instead of
  // throwing an unhandled error partway through it.
  if (derivedKey.length !== storedHash.length) return false;
  return timingSafeEqual(derivedKey, storedHash);
}

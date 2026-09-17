import { randomAlphanumeric } from "./random-string";

/**
 * Generates a genuinely random admin session token (5 Sep security fix,
 * step 2: admin login). Shares its random-generation logic with
 * generateClubToken (lib/data/sheets/client.ts) via randomAlphanumeric
 * (lib/auth/random-string.ts) — see that module for why a plain
 * `byte % alphabet.length` would introduce a small but real bias. 32
 * characters of a 62-character alphabet gives well over 190 bits of
 * entropy, making the session token infeasible to guess or brute-force.
 */
export function generateSessionToken(): string {
  return randomAlphanumeric(32);
}

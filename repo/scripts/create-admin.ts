/**
 * One-time admin account setup (5 Sep security fix, step 2).
 *
 * Deliberately a command-line script, never a web page or API route —
 * a public "create admin account" endpoint would itself be a brand-new
 * vulnerability of exactly the kind this whole security pass exists to
 * close. This only ever runs on Kennedy's own machine (or a one-off
 * local run against the real database), never deployed, never reachable
 * over the web.
 *
 * Usage (run locally, with the real POSTGRES_URL in your environment —
 * e.g. pulled via `vercel env pull` first):
 *
 *   npx tsx scripts/create-admin.ts your@email.com "a real strong password"
 *
 * Refuses to overwrite an existing admin account (see createAdminUser's
 * own doc comment in lib/auth/store.ts) — this is account CREATION, not
 * a password-reset tool. To change an existing password, either delete
 * the row from admin_users directly in the database and re-run this, or
 * ask for a proper "change password" flow to be built.
 */
import { hashPassword } from "../lib/auth/password";
import { createAdminUser } from "../lib/auth/store";

async function main() {
  const [, , email, password] = process.argv;
  if (!email || !password) {
    console.error('Usage: npx tsx scripts/create-admin.ts your@email.com "your password"');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }
  const passwordHash = await hashPassword(password);
  const result = await createAdminUser(email, passwordHash);
  if (result.created) {
    console.log(`Admin account created for ${email.trim().toLowerCase()}.`);
  } else {
    console.log(
      `An admin account for ${email.trim().toLowerCase()} already exists, nothing changed. ` +
        "Delete the existing row from admin_users first if you genuinely need to reset it.",
    );
  }
}

main().catch((err) => {
  console.error("Failed to create admin account:", err);
  process.exit(1);
});

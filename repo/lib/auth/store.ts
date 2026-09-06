import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// Lazily constructed — NOT at module load time. This module is imported
// by app/admin/login/page.tsx, which (unlike every other page in this
// app) has no dynamic route params to make Next.js treat it as
// server-rendered-on-demand automatically. That meant Next tried to
// statically analyse/prerender the login page at BUILD time, which
// executes this module's top-level code — including a bare
// `neon(process.env.POSTGRES_URL!)` — in an environment that may have
// no real POSTGRES_URL set (a build sandbox, CI, etc.), throwing before
// the app ever runs. Deferring construction until the first real query
// actually happens avoids that entirely, regardless of which pages end
// up importing this module in the future.
let sqlClient: NeonQueryFunction<false, false> | null = null;
function getSql(): NeonQueryFunction<false, false> {
  if (!sqlClient) {
    sqlClient = neon(process.env.POSTGRES_URL!);
  }
  return sqlClient;
}

/**
 * Two tables, created lazily on first use (same pattern as
 * actions_log/inbox_reads in lib/data/postgres.ts):
 *
 *   admin_users — exactly one row for now (Kennedy confirmed a single
 *   fixed admin email is fine; the schema doesn't hard-code that limit,
 *   so adding more admins later is just inserting more rows, no
 *   migration needed).
 *
 *   admin_sessions — one row per active login. A session is deleted on
 *   logout and naturally stops being valid once expires_at passes (see
 *   getValidSession below) — expired rows aren't actively swept, they're
 *   just never treated as valid, which is fine at this scale (a handful
 *   of rows for a single admin) without needing a cleanup job.
 */
let tablesReady: Promise<void> | null = null;

function ensureTables(): Promise<void> {
  if (!tablesReady) {
    tablesReady = (async () => {
      await getSql()`
        CREATE TABLE IF NOT EXISTS admin_users (
          email TEXT PRIMARY KEY,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;
      await getSql()`
        CREATE TABLE IF NOT EXISTS admin_sessions (
          session_token TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          expires_at TIMESTAMPTZ NOT NULL
        );
      `;
    })();
  }
  return tablesReady;
}

export async function getAdminUser(email: string): Promise<{ email: string; password_hash: string } | null> {
  await ensureTables();
  const rows = (await getSql()`
    SELECT email, password_hash FROM admin_users WHERE email = ${email.trim().toLowerCase()};
  `) as { email: string; password_hash: string }[];
  return rows[0] ?? null;
}

/**
 * Creates the admin account. Deliberately refuses to overwrite an
 * existing row (ON CONFLICT DO NOTHING) rather than upserting — this is
 * the account-creation path, not a password-change path; silently
 * overwriting an existing admin's password here would let anyone who
 * can reach this function reset a real admin's credentials without
 * proving they knew the old one. Returns whether it actually created a
 * row, so a caller (the setup script/page) can tell a genuine first-time
 * setup apart from a no-op against an already-configured account.
 */
export async function createAdminUser(email: string, passwordHash: string): Promise<{ created: boolean }> {
  await ensureTables();
  const rows = (await getSql()`
    INSERT INTO admin_users (email, password_hash)
    VALUES (${email.trim().toLowerCase()}, ${passwordHash})
    ON CONFLICT (email) DO NOTHING
    RETURNING email;
  `) as { email: string }[];
  return { created: rows.length > 0 };
}

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

export async function createSession(email: string, sessionToken: string): Promise<void> {
  await ensureTables();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await getSql()`
    INSERT INTO admin_sessions (session_token, email, expires_at)
    VALUES (${sessionToken}, ${email.trim().toLowerCase()}, ${expiresAt.toISOString()});
  `;
}

/**
 * Returns the session's email if the token exists AND hasn't expired,
 * null otherwise. This is the single real gate every protected admin
 * route/action calls — a missing token, an unknown token, and an
 * expired token all fail the exact same way (null), so nothing about
 * the failure reason leaks to whatever's checking it.
 */
export async function getValidSession(sessionToken: string): Promise<{ email: string } | null> {
  if (!sessionToken) return null;
  await ensureTables();
  const rows = (await getSql()`
    SELECT email FROM admin_sessions
    WHERE session_token = ${sessionToken} AND expires_at > now();
  `) as { email: string }[];
  return rows[0] ?? null;
}

export async function deleteSession(sessionToken: string): Promise<void> {
  await ensureTables();
  await getSql()`DELETE FROM admin_sessions WHERE session_token = ${sessionToken};`;
}

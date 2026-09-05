"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminUser, createSession, deleteSession } from "./store";
import { verifyPassword } from "./password";
import { generateSessionToken } from "./session-token";
import { SESSION_COOKIE_NAME } from "./constants";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 days, matches store.ts's SESSION_DURATION_MS

/**
 * Attempts an admin login. Deliberately returns the SAME generic error
 * ("Incorrect email or password") whether the email doesn't exist or the
 * password is wrong — a distinct "no account with that email" message
 * would let an attacker enumerate which email addresses have admin
 * accounts, a real (if small) information leak this avoids entirely by
 * design, not by accident.
 *
 * Sets the session cookie httpOnly (client-side JS, including a future
 * XSS bug elsewhere in the app, can never read this cookie's value),
 * secure (never sent over a plain, unencrypted HTTP connection), and
 * sameSite: "lax" (the real, standard CSRF mitigation — a cookie set
 * this way is not sent on cross-site POST requests, which is exactly
 * the request type every one of the dangerous admin actions this login
 * protects uses).
 */
export async function loginAction(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const genericError = "Incorrect email or password.";
  if (!email || !password) return { ok: false, error: genericError };

  try {
    const user = await getAdminUser(email);
    if (!user) return { ok: false, error: genericError };

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) return { ok: false, error: genericError };

    const sessionToken = generateSessionToken();
    await createSession(user.email, sessionToken);

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: "/",
    });

    return { ok: true };
  } catch (err) {
    // Deliberately a DIFFERENT message from genericError — this branch
    // means something infrastructural went wrong (e.g. the database is
    // unreachable), not that the password was wrong. Conflating the two
    // would make a real connectivity problem look like a typo, which is
    // exactly the wrong thing to suggest to whoever's trying to log in.
    // Never throws across the action boundary (same fix already applied
    // to rotateClubToken) — a thrown error here gets redacted to a
    // useless generic message in production, or in this local/no-database
    // test, left the login button stuck on "Signing in…" forever with no
    // feedback at all, since nothing ever ran to tell the UI what happened.
    return {
      ok: false,
      error: err instanceof Error ? `Couldn't sign in: ${err.message}` : "Couldn't sign in, please try again.",
    };
  }
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (sessionToken) {
    await deleteSession(sessionToken);
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/admin/login");
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getValidSession } from "./store";
import { SESSION_COOKIE_NAME } from "./constants";

/**
 * The real access-control check (5 Sep security fix, step 2) — call
 * this at the top of /admin/requests's page component AND inside every
 * dangerous admin server action (resetClubTokenBalance,
 * clearAllRequestLogs, rotateClubToken, toggleActionLogged). Protecting
 * only the PAGE is not sufficient: server actions are independently
 * callable regardless of whether their page was ever visited, which is
 * exactly the gap that made those three actions exploitable by anyone
 * who discovered their names, even though /admin/requests itself was
 * never linked from the club-facing app. Every one of those functions
 * must call this itself, not rely on the caller having already been
 * through a protected page.
 *
 * Redirects to /admin/login when there's no valid session — used from
 * the page component, where a redirect is the right response to "not
 * logged in".
 */
export async function requireAdminOrRedirect(): Promise<{ email: string }> {
  const session = await getValidAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

/**
 * Same check, but returns null instead of redirecting — used from
 * inside a server action, where a redirect makes no sense (the caller
 * is a fetch-like RPC, not a page navigation). Every dangerous admin
 * action checks this FIRST, before doing anything else, and returns a
 * plain "not authorised" result if it's null — mirroring the same
 * never-throw-across-the-action-boundary pattern already fixed in
 * rotateClubToken, for the same reason (a thrown error gets redacted to
 * a useless generic message in production).
 */
export async function getValidAdminSession(): Promise<{ email: string } | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionToken) return null;
  try {
    return await getValidSession(sessionToken);
  } catch {
    // Fail CLOSED, not crash. If the session genuinely can't be
    // verified for any reason — including "the database is
    // unreachable" — the only safe behaviour is to treat that exactly
    // like "not logged in", never to grant access by default and never
    // to let this crash into an unhandled error page instead of a clean
    // redirect to login.
    return null;
  }
}

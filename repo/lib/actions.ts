"use server";

import { revalidatePath } from "next/cache";
import { getAdapter } from "@/lib/data";
import { appendRow, readTab, generateClubToken, updateClubToken } from "@/lib/data/sheets/client";
import { getValidAdminSession } from "@/lib/auth/guard";
import { sanitizeForSheet } from "@/lib/sheet-sanitize";

const NOTIFICATIONS_HEADERS = ["timestamp", "club name", "action label", "token cost", "notes"];

/**
 * Kennedy's email notification loop (27 Aug — replaces the never-wired
 * Actions_Log-watching version of apps-script/notify.gs, since the real
 * ledger is Postgres, not a sheet — see appendRow's own doc comment in
 * lib/data/sheets/client.ts). Writes one row to the NOTIFICATIONS tab
 * (workspace sheet, "CHOS Workspace") with exactly the columns
 * notify.gs's updated version name-matches against: timestamp, club
 * name, action label, token cost, notes. Apps Script watches this tab
 * and emails Kennedy — this function's only job is to give it a real
 * row to see, on every successful, non-duplicate action.
 *
 * Bootstraps the header row itself (28 Aug fix) if the tab is genuinely
 * empty — this closes a real sequencing gap found the same day as the
 * column-shift bug: if the app appended a data row before the header
 * row existed, that data would land in row 1 with nothing above it, and
 * notify.gs's own name-matching would then misread that data row as a
 * header row and silently do nothing. Checking first (readTab is
 * already cached, so this costs nothing on the hot path after the first
 * call) means correct headers exist no matter which side — the app or
 * the Apps Script — happens to touch the tab first.
 *
 * Never throws — a failed write here must not fail the action itself,
 * which has already succeeded in Postgres by the time this runs (see
 * the call site's fire-and-forget .catch()).
 *
 * One narrow known edge case: readTab's 5-minute cache means two actions
 * logged within the same few seconds of a genuinely brand-new tab could
 * both see "empty" and both write a header row. Harmless (an extra row
 * to delete by hand) and only possible once, ever, per tab — not worth
 * a lock/coordination mechanism for a one-time cold-start case.
 */
async function notifyKennedyOfAction(input: {
  clubName: string;
  action_key: string;
  notes?: string;
}) {
  const db = getAdapter();
  const [tokensRef, existingRows] = await Promise.all([
    db.getTokensReference(),
    readTab("workspace", "NOTIFICATIONS").catch(() => []),
  ]);
  if (existingRows.length === 0) {
    await appendRow("workspace", "NOTIFICATIONS", NOTIFICATIONS_HEADERS);
  }
  const ref = tokensRef.find((t) => t.action_key === input.action_key);
  await appendRow("workspace", "NOTIFICATIONS", [
    new Date().toISOString(),
    input.clubName,
    ref?.label ?? input.action_key,
    ref?.token_cost ?? 0,
    // Sanitized against formula/CSV injection (5 Sep security fix) —
    // this is free text a club typed themselves (an action's notes
    // field, or the message from Contact Us/Feature Request/Report an
    // issue, all of which funnel through here), and without this, a
    // value like `=HYPERLINK(...)` would sit in the real sheet as a
    // live, working formula the moment it's opened normally. See
    // lib/sheet-sanitize.ts's own doc comment for the full reasoning.
    sanitizeForSheet(input.notes),
  ]);
}

/**
 * Single submit path for every Outreach action (CLAUDE.md rule 7: ledger-based,
 * idempotent). Every Outreach subsection's Action Pop-up calls this — nothing
 * writes to the ledger any other way.
 *
 * Resolves the real club from clubToken FIRST (5 Sep security fix) —
 * previously, input.club_id was trusted directly from the client with no
 * verification that it actually belonged to whoever was making the
 * request. Since clubToken and club_id both arrived as plain client
 * input with nothing tying them together, any club could send a
 * DIFFERENT club's club_id and spend that club's tokens or log actions
 * against their account, entirely undetected — the request would look
 * completely normal from the server's point of view. From here on, the
 * club_id used for every downstream operation comes ONLY from the
 * club actually looked up by clubToken; the client-supplied club_id in
 * the input object is accepted for the type signature (existing call
 * sites still pass it) but is never read or trusted again.
 */
export async function submitOutreachAction(input: {
  clubToken: string;
  club_id: string;
  action_key: string;
  entry_id?: string;
  notes?: string;
  idempotency_key: string;
}) {
  const db = getAdapter();

  const club = await db.getClubByToken(input.clubToken);
  if (!club) {
    return {
      ok: false,
      duplicate: false,
      new_balance: 0,
      error: "Couldn't verify your club, please refresh the page and try again.",
    };
  }

  // Rate limit on free (zero-cost) actions only (5 Sep security fix,
  // Kennedy: "5 free submissions per hour per club") — Contact Us,
  // Feature Request, action notes, and "Report an issue" all cost 0
  // tokens and funnel through here, so without this there was no limit
  // at all on how fast someone could flood the real NOTIFICATIONS
  // sheet and Kennedy's inbox with submissions. Paid actions are
  // deliberately NOT rate-limited here — a club's finite token balance
  // already limits those naturally, and applying the same cap to them
  // would unfairly throttle a club doing lots of legitimate paid
  // outreach in a session. Checked against the real, resolved club_id
  // from above, never the client-supplied one, for the same reason as
  // every other fix in this function.
  const tokensRef = await db.getTokensReference();
  const actionRef = tokensRef.find((t) => t.action_key === input.action_key);
  const isFreeAction = (actionRef?.token_cost ?? 0) === 0;
  if (isFreeAction) {
    const RATE_LIMIT_WINDOW_MINUTES = 60;
    const RATE_LIMIT_MAX = 5;
    const recentCount = await db.countRecentFreeActions(club.club_id, RATE_LIMIT_WINDOW_MINUTES);
    if (recentCount >= RATE_LIMIT_MAX) {
      return {
        ok: false,
        duplicate: false,
        new_balance: 0,
        error: "You've submitted a few of these recently, please wait a bit before sending another.",
      };
    }
  }

  const result = await db.submitAction({
    club_id: club.club_id, // the REAL club's own id, resolved above — never input.club_id
    action_key: input.action_key,
    entry_id: input.entry_id,
    notes: input.notes,
    idempotency_key: input.idempotency_key,
  });
  if (result.ok && !result.duplicate) {
    // Fire-and-forget — never await-block the response on this, and
    // never let a notification failure surface as an action failure.
    // Reuses the `club` already resolved above rather than fetching it
    // again — same cheap, cached read either way, but no reason to ask
    // twice now that the lookup already happened for the security check.
    notifyKennedyOfAction({
      clubName: club.name,
      action_key: input.action_key,
      notes: input.notes,
    }).catch(() => {});
  }
  if (result.ok) {
    revalidatePath(`/dashboard/${input.clubToken}`);
    // Also revalidate the LAYOUT specifically (28 Aug fix) — TokenWidget,
    // the persistent balance shown in the header, is rendered by
    // DashboardLayout, not by the individual page. revalidatePath without
    // the "layout" type only refreshes the page segment, which is why
    // the header kept showing the pre-action balance even though the
    // ledger itself, and the popup's own "Done" message (which reads
    // result.new_balance directly, not a cached render), were already
    // correct — the mismatch was specifically between the popup's own
    // message and everything else on screen still showing the old number
    // until a full page navigation happened to refresh it.
    revalidatePath(`/dashboard/${input.clubToken}`, "layout");
    revalidatePath(`/admin/requests`);
  }
  return result;
}

/** Free-action variant (Contact Us style forms) — same ledger row, zero cost, no balance check needed. */
export async function submitFreeAction(input: {
  clubToken: string;
  club_id: string;
  action_key: string;
  entry_id?: string;
  notes?: string;
  idempotency_key: string;
}) {
  return submitOutreachAction(input);
}

/**
 * Marks one Inbox message read for one club (Kennedy's request, 27 Aug —
 * persistent read/unread state). Revalidates both the Inbox page itself
 * and the dashboard layout, since the header's unread badge is rendered
 * in the layout, not the Inbox page.
 *
 * Resolves the real club from clubToken first (5 Sep security fix) —
 * same reasoning as submitOutreachAction's own doc comment: club_id was
 * previously trusted directly from client input with nothing verifying
 * it belonged to whoever was making the request, which would let any
 * club mark ANOTHER club's inbox messages as read (or spam that write)
 * just by sending a different club_id. A club whose token doesn't
 * resolve to a real club is silently a no-op here rather than an error
 * — marking a message read isn't a security-sensitive action worth
 * surfacing a scary failure for, it just shouldn't ever write under the
 * wrong club_id.
 */
export async function markInboxRead(clubToken: string, club_id: string, message_id: string) {
  const db = getAdapter();
  const club = await db.getClubByToken(clubToken);
  if (!club) return;
  await db.markInboxMessageRead(club.club_id, message_id);
  revalidatePath(`/dashboard/${clubToken}/inbox`);
  revalidatePath(`/dashboard/${clubToken}`, "layout");
}

/**
 * Admin-only: restore a club's token balance to full allocation without
 * touching its history (lib/data's resetTokenBalance — appends one
 * "adjustment" row, never edits/deletes existing rows). Called from
 * app/admin/requests; not reachable from any club-facing page.
 */
/**
 * Admin-only: restores a club's balance to full allocation. Checks the
 * real admin session itself (5 Sep security fix, step 2) — protecting
 * only the /admin/requests PAGE was never sufficient, since this
 * function is independently callable regardless of whether its page was
 * ever visited. Every dangerous admin action in this file now starts
 * with this same check.
 */
export async function resetClubTokenBalance(
  club_id: string,
): Promise<{ ok: true; balance: number; allocation: number } | { ok: false; error: string }> {
  const session = await getValidAdminSession();
  if (!session) return { ok: false, error: "Not signed in." };
  const db = getAdapter();
  const result = await db.resetTokenBalance(club_id);
  revalidatePath(`/admin/requests`);
  return { ok: true, ...result };
}

/**
 * Admin-only: toggle a request's status between "pending" and "complete"
 * (lib/data's setActionStatus — updates that row's status/completed_at in
 * place, never touches token_cost, so a club's balance is unaffected).
 * Checks the real admin session itself (5 Sep security fix, step 2) —
 * see resetClubTokenBalance's own doc comment for why every dangerous
 * admin action needs this check independent of the page it's called from.
 */
export async function toggleActionLogged(
  log_id: string,
  currentStatus: "pending" | "complete" | "cancelled",
): Promise<{ ok: true; status: "pending" | "complete" } | { ok: false; error: string }> {
  const session = await getValidAdminSession();
  if (!session) return { ok: false, error: "Not signed in." };
  const db = getAdapter();
  const nextStatus = currentStatus === "complete" ? "pending" : "complete";
  await db.setActionStatus(log_id, nextStatus);
  revalidatePath(`/admin/requests`);
  return { ok: true, status: nextStatus };
}

/**
 * Client-side affordability check (28 Aug — Kennedy: "button visibly shows
 * it's unaffordable beforehand"). ActionPopup calls this once when it
 * opens to get the club's current balance plus every action's real token
 * cost, so it can grey out and disable any pink button the club can't
 * currently afford — without needing every one of the ~10 pages that
 * render EntryCard/ActionPopup to individually fetch and thread balance
 * down as a prop. This is read-only and safe to call from a client
 * component the same way submitOutreachAction already is.
 *
 * Verifies clubToken resolves to the given club_id (5 Sep security fix)
 * — previously took a bare club_id with no way to check it at all, which
 * meant any club could read ANOTHER club's real token balance and plan
 * tier simply by passing a different club_id; this was a genuine
 * information leak even though it never wrote anything. Returns zeroed,
 * harmless placeholder data on a mismatch rather than an error — this
 * powers a purely cosmetic "grey out what you can't afford" check, so
 * failing toward "show everything as unaffordable" is the safe default,
 * never toward leaking a real number that isn't the caller's own.
 */
export async function getClubTokenStatus(clubToken: string, club_id: string) {
  const db = getAdapter();
  const club = await db.getClubByToken(clubToken);
  if (!club || club.club_id !== club_id) {
    const [tokensRef, plans] = await Promise.all([db.getTokensReference(), db.getPlans()]);
    return { balance: 0, tokensRef, plans, currentTier: null };
  }
  const [{ balance }, tokensRef, plans, currentTier] = await Promise.all([
    db.getTokenBalance(club_id),
    db.getTokensReference(),
    db.getPlans(),
    db.getClubTierById(club_id),
  ]);
  return { balance, tokensRef, plans, currentTier };
}

/**
 * Admin-only: wipe every row in Actions_Log — irreversible, and resets every
 * club's balance to full allocation as a side effect (balance is computed
 * from the ledger, so an empty ledger means no spend on record). Checks the
 * real admin session itself (5 Sep security fix, step 2) — this is the
 * single most destructive action in the app, so this check matters most
 * here of anywhere; see resetClubTokenBalance's own doc comment for why
 * every dangerous admin action needs this independent of the page it's
 * called from.
 */
export async function clearAllRequestLogs(): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getValidAdminSession();
  if (!session) return { ok: false, error: "Not signed in." };
  const db = getAdapter();
  await db.clearAllActions();
  revalidatePath(`/admin/requests`);
  return { ok: true };
}

/**
 * Admin-only: generates a genuinely random new token for one club and
 * writes it to the real "Club Token" column, DASHBOARD (X) (5 Sep
 * security fix — see generateClubToken/updateClubToken's own doc
 * comments in lib/data/sheets/client.ts for the full reasoning). Used to
 * rotate the 2 live clubs off their current tokens, which are just their
 * plain, guessable Club ID values.
 *
 * Checks the real admin session itself, same as every other dangerous
 * admin action in this file (step 2 of the same remediation plan this
 * function was step 1 of — this closes the gap this doc comment used to
 * flag as temporary and unresolved).
 *
 * Returns a plain result object, NEVER throws — a thrown error crossing
 * a Server Action boundary gets redacted to a generic, useless message
 * in production ("An error occurred in the Server Components render...",
 * confirmed by testing this exact function against the local adapter,
 * which has no Sheets credentials configured). Catching internally and
 * returning `{ ok: false, error }` is the only way the real, specific
 * error (missing "Club Token" column, Club ID not found, etc.) actually
 * reaches RotateTokenButton to show the admin what genuinely went wrong.
 *
 * On success, never sends anything anywhere on its own (no email, no
 * notification) — only writes to the sheet. The club's new link has to
 * reach them through a channel Kennedy controls and trusts, not an
 * automated one that could itself become a leak vector for a brand-new
 * credential.
 */
export async function rotateClubToken(
  club_id: string,
  clubNamePrefix: string,
): Promise<{ ok: true; newToken: string } | { ok: false; error: string }> {
  const session = await getValidAdminSession();
  if (!session) return { ok: false, error: "Not signed in." };
  try {
    const newToken = generateClubToken(clubNamePrefix);
    await updateClubToken(club_id, newToken);
    revalidatePath(`/admin/requests`);
    return { ok: true, newToken };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Something went wrong, nothing was changed." };
  }
}

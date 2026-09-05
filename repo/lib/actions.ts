"use server";

import { revalidatePath } from "next/cache";
import { getAdapter } from "@/lib/data";
import { appendRow, readTab, generateClubToken, updateClubToken } from "@/lib/data/sheets/client";

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
    input.notes ?? "",
  ]);
}

/**
 * Single submit path for every Outreach action (CLAUDE.md rule 7: ledger-based,
 * idempotent). Every Outreach subsection's Action Pop-up calls this — nothing
 * writes to the ledger any other way.
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
  const result = await db.submitAction({
    club_id: input.club_id,
    action_key: input.action_key,
    entry_id: input.entry_id,
    notes: input.notes,
    idempotency_key: input.idempotency_key,
  });
  if (result.ok && !result.duplicate) {
    // Fire-and-forget — never await-block the response on this, and
    // never let a notification failure surface as an action failure.
    // getClubByToken re-fetches the club (cheap, cached read) purely to
    // get its real name for the email — nothing else here needs it.
    db.getClubByToken(input.clubToken)
      .then((club) => {
        if (!club) return;
        return notifyKennedyOfAction({
          clubName: club.name,
          action_key: input.action_key,
          notes: input.notes,
        });
      })
      .catch(() => {});
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
 */
export async function markInboxRead(clubToken: string, club_id: string, message_id: string) {
  const db = getAdapter();
  await db.markInboxMessageRead(club_id, message_id);
  revalidatePath(`/dashboard/${clubToken}/inbox`);
  revalidatePath(`/dashboard/${clubToken}`, "layout");
}

/**
 * Admin-only: restore a club's token balance to full allocation without
 * touching its history (lib/data's resetTokenBalance — appends one
 * "adjustment" row, never edits/deletes existing rows). Called from
 * app/admin/requests; not reachable from any club-facing page.
 */
export async function resetClubTokenBalance(club_id: string) {
  const db = getAdapter();
  const result = await db.resetTokenBalance(club_id);
  revalidatePath(`/admin/requests`);
  return result;
}

/**
 * Admin-only: toggle a request's status between "pending" and "complete"
 * (lib/data's setActionStatus — updates that row's status/completed_at in
 * place, never touches token_cost, so a club's balance is unaffected).
 * Called from app/admin/requests; not reachable from any club-facing page.
 */
export async function toggleActionLogged(log_id: string, currentStatus: "pending" | "complete" | "cancelled") {
  const db = getAdapter();
  const nextStatus = currentStatus === "complete" ? "pending" : "complete";
  await db.setActionStatus(log_id, nextStatus);
  revalidatePath(`/admin/requests`);
  return nextStatus;
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
 */
export async function getClubTokenStatus(club_id: string) {
  const db = getAdapter();
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
 * from the ledger, so an empty ledger means no spend on record). Called
 * from app/admin/requests; not reachable from any club-facing page.
 */
export async function clearAllRequestLogs() {
  const db = getAdapter();
  await db.clearAllActions();
  revalidatePath(`/admin/requests`);
}

/**
 * Admin-only: generates a genuinely random new token for one club and
 * writes it to the real "Club Token" column, DASHBOARD (X) (5 Sep
 * security fix — see generateClubToken/updateClubToken's own doc
 * comments in lib/data/sheets/client.ts for the full reasoning). Used to
 * rotate the 2 live clubs off their current tokens, which are just their
 * plain, guessable Club ID values.
 *
 * SECURITY NOTE (temporary): like every other admin-only action in this
 * file, this has no auth check of its own yet — it's protected today
 * only by not being linked from anywhere in the club-facing app. This is
 * genuinely insufficient and is step 2 of the same remediation plan this
 * function is step 1 of: a real login must gate /admin/requests (and
 * this action) before this can be considered fixed rather than just
 * relocated. Do not treat this function as secure on its own.
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
  try {
    const newToken = generateClubToken(clubNamePrefix);
    await updateClubToken(club_id, newToken);
    revalidatePath(`/admin/requests`);
    return { ok: true, newToken };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Something went wrong, nothing was changed." };
  }
}

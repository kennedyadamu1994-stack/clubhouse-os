"use server";

import { revalidatePath } from "next/cache";
import { getAdapter } from "@/lib/data";

/**
 * Single submit path for every Outreach action (CLAUDE.md rule 7: ledger-based,
 * idempotent). Every Outreach subsection's Action Pop-up calls this — nothing
 * writes to Actions_Log any other way.
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
  if (result.ok) {
    revalidatePath(`/dashboard/${input.clubToken}`);
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

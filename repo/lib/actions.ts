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

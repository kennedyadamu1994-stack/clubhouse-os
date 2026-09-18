"use client";

import { useState } from "react";
import { ContactUsForm } from "./contact-us-form";
import { PLAN_TIER_LABEL, type PlanDetails, type PlanTier } from "@/lib/types";
import { ModalPortal } from "./modal-portal";

const PLAN_ORDER: PlanTier[] = ["free", "core", "core_plus", "premium", "premium_plus"];

/**
 * Shown when a club tries a pink action costing more tokens than they have
 * left (Kennedy's request, 28 Aug: "launch a pop up asking them if they
 * want to upgrade or buy more tokens"). Triggered client-side in
 * ActionPopup before submission where possible (so the club sees this
 * instead of a bare error), and also on the rare server-side rejection
 * (error_code "insufficient_tokens") as a fallback for the same reason
 * PostgresAdapter's own comment gives — a narrow race window between the
 * affordability check and a genuinely simultaneous click elsewhere.
 *
 * No real payment/upgrade flow exists anywhere in this codebase — both
 * options route to the existing Contact Us modal with a pre-filled
 * message (ContactUsForm's initialMessage prop, added 28 Aug for this),
 * the same "Kennedy handles it personally" pattern every other paid
 * action in this app already uses, rather than inventing a checkout flow
 * that isn't backed by anything real.
 */
export function InsufficientTokensPopup({
  clubToken,
  club_id,
  currentTier,
  plans,
  shortfall,
  onClose,
}: {
  clubToken: string;
  club_id: string;
  currentTier: PlanTier;
  plans: PlanDetails[];
  /**
   * balance is intentionally NOT shown in this component's own text
   * (7 Sep — Kennedy reported a popup reading "costs 2, but you have 20
   * left", which looked like a contradiction but wasn't: the real,
   * live server-side check is always correct and rejected the action
   * genuinely, while the balance number the club had on screen was
   * already stale — spent in another tab, or by an action just before
   * this one, since this page last loaded. Quoting that same
   * already-wrong number back in the rejection message just repeats
   * the confusing figure rather than explaining what happened. Kept in
   * the type in case a future version wants it for something else.
   */
  shortfall: { needed: number; balance: number };
  onClose: () => void;
}) {
  const [contactOpen, setContactOpen] = useState<"upgrade" | "tokens" | null>(null);

  const currentIndex = PLAN_ORDER.indexOf(currentTier);
  const nextTier = PLAN_ORDER[currentIndex + 1];
  const nextPlan = nextTier ? plans.find((p) => p.tier === nextTier) : undefined;

  if (contactOpen) {
    const initialMessage =
      contactOpen === "upgrade"
        ? `I'd like to upgrade my plan${nextPlan ? ` to ${PLAN_TIER_LABEL[nextPlan.tier]}` : ""} for more tokens.`
        : "I'd like to buy more tokens for this month.";
    return (
      <ContactUsForm
        clubToken={clubToken}
        club_id={club_id}
        onClose={onClose}
        initialMessage={initialMessage}
      />
    );
  }

  return (
    <ModalPortal>
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2>Not enough tokens</h2>
        <p className="modal-sub">
          This action costs {shortfall.needed} token{shortfall.needed === 1 ? "" : "s"}, which is more than your
          club has left this month.
        </p>

        <div className="token-explainer" style={{ marginBottom: 18 }}>
          If this seems off, it may be because tokens were used elsewhere (another tab, or another action just
          before this one) since this page last loaded, refreshing the page will show your real balance.
          Otherwise, your tokens top up again at the start of next month, or you can upgrade your plan or ask
          for more right now.
        </div>

        <div className="action-row">
          {nextPlan && (
            <button className="btn btn-pink" onClick={() => setContactOpen("upgrade")}>
              Upgrade to {PLAN_TIER_LABEL[nextPlan.tier]} ({nextPlan.tokens} tokens/mo)
            </button>
          )}
          <button className="btn btn-black" onClick={() => setContactOpen("tokens")}>
            Buy more tokens
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}

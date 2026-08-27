"use client";

import { useEffect, useId, useRef } from "react";
import type { PlanDetails } from "@/lib/types";
import { PLAN_TIER_LABEL } from "@/lib/types";

/**
 * Shown when a Free-plan club clicks into a locked section (Kennedy's
 * request, 25 Aug). Lists what Core AND Premium include side by side, per
 * Kennedy's explicit instruction — not just the next tier up, the full
 * ladder, so a Free club sees the whole picture in one place. Links out to
 * a plans page via a placeholder URL (Kennedy: "for now, include a
 * placeholder URL") — PLANS_PAGE_URL below is the one place to update
 * once a real page exists.
 */
const PLANS_PAGE_URL = "https://thenbrh.co.uk/plans"; // PLACEHOLDER — replace once a real plans page exists

export function PaywallPopup({
  sectionName,
  plans,
  onClose,
}: {
  sectionName: string;
  plans: PlanDetails[];
  onClose: () => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const corePlan = plans.find((p) => p.tier === "core");
  const premiumPlan = plans.find((p) => p.tier === "premium");

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    dialogRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal paywall-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2 id={titleId}>
          <span className="paywall-lock" aria-hidden>
            🔒
          </span>{" "}
          {sectionName} is a paid feature
        </h2>
        <p className="modal-sub">Upgrade from Free to unlock {sectionName} and more.</p>

        <div className="paywall-plans">
          {[corePlan, premiumPlan].map(
            (plan) =>
              plan && (
                <div className="paywall-plan-col" key={plan.tier}>
                  <div className="paywall-plan-name">{PLAN_TIER_LABEL[plan.tier]}</div>
                  {plan.price && <div className="paywall-plan-price">{plan.price}/mo</div>}
                  <ul className="paywall-plan-perks">
                    {plan.perks.map((perk) => (
                      <li key={perk}>{perk}</li>
                    ))}
                  </ul>
                </div>
              ),
          )}
        </div>

        <a href={PLANS_PAGE_URL} target="_blank" rel="noopener noreferrer" className="btn btn-pink" style={{ marginTop: 18 }}>
          See all plans
        </a>
      </div>
    </div>
  );
}

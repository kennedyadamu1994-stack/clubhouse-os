"use client";

import { useState } from "react";
import type { PlanDetails } from "@/lib/types";
import { PaywallPopup } from "@/components/paywall-popup";

/**
 * Wraps a locked section's content for Free-plan clubs (Kennedy's request,
 * 25 Aug). Shows a lock icon and a short message in place of the real
 * content; clicking anywhere in that message opens PaywallPopup. Used by
 * Workspace and Tools layouts (whole section locked) and by the three
 * locked Outreach subsections (Brands & Businesses/Influencers/Sponsorship
 * & Funding — corrected 25 Aug, was originally Players/Clubs/People).
 */
export function PaywallGate({ sectionName, plans }: { sectionName: string; plans: PlanDetails[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="paywall-locked-panel" onClick={() => setOpen(true)}>
        <span className="paywall-locked-icon" aria-hidden>
          🔒
        </span>
        <span className="paywall-locked-title">{sectionName} is locked on the Free plan</span>
        <span className="paywall-locked-cta">Tap to see what upgrading unlocks</span>
      </button>
      {open && <PaywallPopup sectionName={sectionName} plans={plans} onClose={() => setOpen(false)} />}
    </>
  );
}

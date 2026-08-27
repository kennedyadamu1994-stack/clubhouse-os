import type { Club, PlanDetails } from "@/lib/types";
import { PLAN_TIER_LABEL } from "@/lib/types";
import { ContactButton } from "@/components/contact-button";

/**
 * Plan pricing/perks now come from the real PLAN sheet (Kennedy's request,
 * 25 Aug) via getPlans() — no more hardcoded pricing object. This component
 * just renders whatever plans list it's given; the data fetch happens in
 * the calling page (Overview and the standalone Membership page both need
 * to fetch getPlans() and pass it down).
 *
 * Shared between app/dashboard/[clubToken]/membership/page.tsx (Membership's
 * own standalone page) and the Membership dropdown embedded in Overview —
 * same body, two entry points.
 */

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="mem-detail">
      <span className="mem-detail-label">{label}</span>
      <span className="mem-detail-value">{value}</span>
    </div>
  );
}

export function MembershipBody({
  club,
  clubToken,
  balance,
  allocation,
  plans,
}: {
  club: Club;
  clubToken: string;
  balance: number;
  allocation: number;
  plans: PlanDetails[];
}) {
  const currentPlan = plans.find((p) => p.tier === club.plan_tier);
  // Plans "above" the club's current one, in tier order — used for the
  // "want more?" upsell list. Real order comes from PLAN_ORDER, not sheet
  // row order (which Kennedy might reorder without meaning to change tier
  // ranking).
  const PLAN_ORDER: Club["plan_tier"][] = ["free", "core", "core_plus", "premium", "premium_plus"];
  const currentIndex = PLAN_ORDER.indexOf(club.plan_tier);
  const higherPlans = plans
    .filter((p) => PLAN_ORDER.indexOf(p.tier) > currentIndex)
    .sort((a, b) => PLAN_ORDER.indexOf(a.tier) - PLAN_ORDER.indexOf(b.tier));
  const nextPlan = higherPlans[0];

  return (
    <div className="mem-grid">
      {/* Club details */}
      <div className="card outreach-card">
        <h2>Club details</h2>
        <div className="mem-details">
          <Detail label="Club name" value={club.name} />
          <Detail label="Sport" value={club.sport} />
          <Detail label="Main contact" value={club.contact_name} />
          <Detail label="Contact email" value={club.contact_email} />
          {club.members_count != null && <Detail label="Members" value={String(club.members_count)} />}
          {club.teams_count != null && <Detail label="Teams" value={String(club.teams_count)} />}
          <Detail label="Member since" value={club.created_at} />
        </div>
        <p className="mem-edit-note">
          Need to update any of these? Get in touch and we&apos;ll change them for you.
        </p>
        <ContactButton clubToken={clubToken} club_id={club.club_id} label="Update our details" />
      </div>

      {/* Current plan */}
      <div className="card outreach-card">
        <h2>Your plan</h2>
        <div className="mem-plan-head">
          <span className="mem-plan-name">{PLAN_TIER_LABEL[club.plan_tier]}</span>
          {currentPlan?.price && <span className="mem-plan-price">{currentPlan.price}/mo</span>}
        </div>
        <div className="mem-tokens">
          <span className="mem-tokens-value">
            {balance}
            <span> / {allocation}</span>
          </span>
          <span className="mem-tokens-label">tokens left this month</span>
        </div>
        {currentPlan && currentPlan.perks.length > 0 && (
          <ul className="mem-includes">
            {currentPlan.perks.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}

        {nextPlan && (
          <div className="mem-plan-other">
            <p className="mem-plan-other-label">
              {higherPlans.length === 1
                ? `Want more? The ${PLAN_TIER_LABEL[nextPlan.tier]} plan${nextPlan.price ? ` (${nextPlan.price}/mo)` : ""} adds:`
                : `Thinking about changing? ${PLAN_TIER_LABEL[nextPlan.tier]} and above unlock more.`}
            </p>
            {nextPlan.perks.length > 0 && (
              <ul className="mem-includes mem-includes-muted">
                {nextPlan.perks.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            )}
            <p className="mem-edit-note">
              Plan changes are handled by The NBRH for now — get in touch and we&apos;ll sort it.
            </p>
            <ContactButton clubToken={clubToken} club_id={club.club_id} label="Change our plan" />
          </div>
        )}
      </div>
    </div>
  );
}

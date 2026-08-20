import type { Club, PlanTier } from "@/lib/types";
import { ContactButton } from "@/components/contact-button";

/**
 * Plan definitions live here as app config, not per-club data — pricing and
 * what each tier includes is the same for every club. Kennedy's settled
 * pricing (£35 Core / £60 Premium). When plan management becomes a real
 * write flow (spec § Overview: upgrade/downgrade/cancel form), this is the
 * source it reads from.
 *
 * Shared between app/dashboard/[clubToken]/membership/page.tsx (Membership's
 * own standalone page, unchanged) and the Membership dropdown embedded in
 * Overview (Kennedy's request, 19 Aug) — same body, two entry points, so
 * there is exactly one place this markup and pricing data live.
 */
const PLANS: Record<PlanTier, { name: string; price: string; includes: string[] }> = {
  core: {
    name: "Core",
    price: "£35/mo",
    includes: [
      "Full outreach directory (players, people, brands, clubs)",
      "Sponsorship & funding matches",
      "Workspace: insights, resources, opportunities, trending topics",
      "Standard monthly token allocation",
    ],
  },
  premium: {
    name: "Premium",
    price: "£60/mo",
    includes: [
      "Everything in Core",
      "Higher monthly token allocation",
      "Premium-only partner perks",
      "Priority on done-for-you services",
    ],
  },
};

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
}: {
  club: Club;
  clubToken: string;
  balance: number;
  allocation: number;
}) {
  const currentPlan = PLANS[club.plan_tier];
  const otherTier: PlanTier = club.plan_tier === "premium" ? "core" : "premium";
  const otherPlan = PLANS[otherTier];

  return (
    <div className="mem-grid">
      {/* Club details */}
      <div className="card outreach-card">
        <h2>Club details</h2>
        <div className="mem-details">
          <Detail label="Club name" value={club.name} />
          <Detail label="Sport" value={club.sport} />
          <Detail label="Area" value={club.area} />
          <Detail label="Main contact" value={club.contact_name} />
          <Detail label="Contact email" value={club.contact_email} />
          {club.members_count != null && <Detail label="Members" value={String(club.members_count)} />}
          {club.teams_count != null && <Detail label="Teams" value={String(club.teams_count)} />}
          <Detail label="Member since" value={club.created_at} />
        </div>
        <p className="mem-edit-note">
          Need to update any of these? Get in touch and we&apos;ll change them for you.
        </p>
        <ContactButton clubToken={clubToken} club_id={club.club_id} />
      </div>

      {/* Current plan */}
      <div className="card outreach-card">
        <h2>Your plan</h2>
        <div className="mem-plan-head">
          <span className="mem-plan-name">{currentPlan.name}</span>
          <span className="mem-plan-price">{currentPlan.price}</span>
        </div>
        <div className="mem-tokens">
          <span className="mem-tokens-value">
            {balance}<span> / {allocation}</span>
          </span>
          <span className="mem-tokens-label">tokens left this month</span>
        </div>
        <ul className="mem-includes">
          {currentPlan.includes.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        <div className="mem-plan-other">
          <p className="mem-plan-other-label">
            {club.plan_tier === "premium"
              ? `Thinking about changing? The ${otherPlan.name} plan is ${otherPlan.price}.`
              : `Want more? The ${otherPlan.name} plan (${otherPlan.price}) adds:`}
          </p>
          {club.plan_tier !== "premium" && (
            <ul className="mem-includes mem-includes-muted">
              <li>Higher monthly token allocation</li>
              <li>Premium-only partner perks</li>
              <li>Priority on done-for-you services</li>
            </ul>
          )}
          <p className="mem-edit-note">
            Plan changes are handled by The NBRH for now — get in touch and we&apos;ll sort it.
          </p>
          <ContactButton clubToken={clubToken} club_id={club.club_id} />
        </div>
      </div>
    </div>
  );
}

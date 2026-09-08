import type { PlanTier } from "@/lib/types";

interface PerkCardProps {
  partner: string;
  title: string;
  categoryLabel: string;
  description: string;
  offer: string;
  redeemCode: string | null;
  redeemUrl: string;
  planTiers: PlanTier[];
  clubTier: PlanTier;
}

/**
 * Perks (Kennedy, 17 Aug) — partner benefit cards. A perk whose plan_tiers
 * don't include the club's current tier is shown but LOCKED (matches the
 * "no dead ends / show what an upgrade unlocks" principle rather than
 * hiding it), with an upgrade prompt instead of the redeem link. Redeeming
 * is a plain external link — deliberately NOT a token/ledger action, since
 * a perk is a standing benefit, not a request for Kennedy's time.
 */
export function PerkCard({
  partner,
  title,
  categoryLabel,
  description,
  offer,
  redeemCode,
  redeemUrl,
  planTiers,
  clubTier,
}: PerkCardProps) {
  const unlocked = planTiers.includes(clubTier);

  return (
    <div className={`perk-card ${unlocked ? "" : "perk-card-locked"}`}>
      <div className="perk-card-head">
        <span className="chip perk-card-category">{categoryLabel}</span>
        {!unlocked && <span className="perk-lock-badge">Premium</span>}
      </div>
      <h3 className="perk-card-title">{title}</h3>
      <p className="perk-card-partner">{partner}</p>
      <p className="perk-card-desc">{description}</p>
      <div className="perk-card-offer">{offer}</div>

      {unlocked ? (
        <div className="perk-card-redeem">
          {redeemCode && (
            <span className="perk-code" aria-label={`Redeem code ${redeemCode}`}>
              {redeemCode}
            </span>
          )}
          <a className="btn btn-pink" href={redeemUrl} target="_blank" rel="noopener noreferrer">
            Redeem
          </a>
        </div>
      ) : (
        <p className="perk-card-upsell">Available on the Premium plan.</p>
      )}
    </div>
  );
}

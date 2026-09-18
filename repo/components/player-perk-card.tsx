const CATEGORY_LABEL: Record<string, string> = {
  equipment: "Equipment",
  food_drink: "Food & Drink",
  software: "Software",
  training: "Training",
  travel: "Travel",
  wellbeing: "Wellbeing",
};

/**
 * Player-side equivalent of PerkCard (components/perk-card.tsx) —
 * genuinely simpler, not that component made optional: PerkCard's
 * whole reason for the locked/upsell branch is plan_tiers.includes(
 * clubTier), and players have no plan tier at all (Kennedy confirmed,
 * 15 Sep: every perk is available to every player, nothing locked).
 * Same visual card shape/classes otherwise, for consistency.
 */
export function PlayerPerkCard({
  partner,
  title,
  category,
  description,
  offer,
  redeemCode,
  redeemUrl,
}: {
  partner: string;
  title: string;
  category: string;
  description: string;
  offer: string;
  redeemCode: string | null;
  redeemUrl: string;
}) {
  return (
    <div className="perk-card">
      <div className="perk-card-head">
        <span className="chip perk-card-category">{CATEGORY_LABEL[category] ?? category}</span>
      </div>
      <h3 className="perk-card-title">{title}</h3>
      <p className="perk-card-partner">{partner}</p>
      <p className="perk-card-desc">{description}</p>
      <div className="perk-card-offer">{offer}</div>

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
    </div>
  );
}

import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { PerkCard } from "@/components/perk-card";
import { EmptyState } from "@/components/empty-state";

const CATEGORY_LABEL: Record<string, string> = {
  equipment: "Equipment",
  food_drink: "Food & Drink",
  software: "Software",
  training: "Training",
  travel: "Travel",
  wellbeing: "Wellbeing",
};

export default async function Perks({
  params,
}: {
  params: Promise<{ clubToken: string }>;
}) {
  const { clubToken } = await params;
  const db = getAdapter();
  const club = await db.getClubByToken(clubToken);
  if (!club) notFound();

  const allPerks = await db.getPerks();
  const perks = allPerks.filter((p) => p.active);
  const base = `/dashboard/${clubToken}`;

  // Unlocked perks first, then locked ones (still shown, so a Core club can
  // see what Premium would add) — stable within each group by created order.
  const sorted = [...perks].sort((a, b) => {
    const aUnlocked = a.plan_tiers.includes(club.plan_tier) ? 0 : 1;
    const bUnlocked = b.plan_tiers.includes(club.plan_tier) ? 0 : 1;
    return aUnlocked - bUnlocked;
  });

  return (
    <div className="card outreach-card">
      <h2>
        Perks <span className="count-badge">{perks.length} available</span>
      </h2>
      <p style={{ color: "var(--dim)", fontSize: "0.9rem", marginTop: -8, marginBottom: 20, maxWidth: "58ch" }}>
        Partner offers and discounts for your club, sorted out by The NBRH. Redeeming a perk is
        free and doesn&apos;t use any tokens.
      </p>

      {perks.length === 0 ? (
        <EmptyState
          message="No perks live right now — we're lining up partners and they'll appear here."
          cta="Back to Overview"
          href={base}
        />
      ) : (
        <div className="cardgrid perk-cardgrid">
          {sorted.map((p) => (
            <PerkCard
              key={p.perk_id}
              partner={p.partner}
              title={p.title}
              categoryLabel={CATEGORY_LABEL[p.category] ?? p.category}
              description={p.description}
              offer={p.offer}
              redeemCode={p.redeem_code}
              redeemUrl={p.redeem_url}
              planTiers={p.plan_tiers}
              clubTier={club.plan_tier}
            />
          ))}
        </div>
      )}
    </div>
  );
}

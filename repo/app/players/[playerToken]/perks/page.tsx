import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { PlayerPerkCard } from "@/components/player-perk-card";
import { EmptyState } from "@/components/empty-state";
import { PaginatedList } from "@/components/paginated-list";

/** Personal (token'd) POS Perks — content identical to the public version, re-guarded per-page the same way the Calendar/Jobs pairs are. */
export default async function PlayerPerks({
  params,
}: {
  params: Promise<{ playerToken: string }>;
}) {
  const { playerToken } = await params;
  const db = getAdapter();
  const player = await db.getPlayerByToken(playerToken);
  if (!player) notFound();

  const perks = await db.getPlayerPerks();

  return (
    <div className="card outreach-card">
      <p style={{ color: "var(--dim)", fontSize: "0.9rem", marginBottom: 20, maxWidth: "58ch" }}>
        Partner offers and discounts for players, sorted out by The NBRH. Redeeming a perk is
        free. <span className="count-badge">{perks.length} available</span>
      </p>

      {perks.length === 0 ? (
        <EmptyState
          message="No perks live right now, we're lining up partners and they'll appear here."
          cta="Back to Home"
          href={`/players/${playerToken}`}
        />
      ) : (
        <PaginatedList
          className="cardgrid perk-cardgrid"
          items={perks.map((p) => (
            <PlayerPerkCard
              key={p.perk_id}
              partner={p.partner}
              title={p.title}
              category={p.category}
              description={p.description}
              offer={p.offer}
              redeemCode={p.redeem_code}
              redeemUrl={p.redeem_url}
            />
          ))}
        />
      )}
    </div>
  );
}

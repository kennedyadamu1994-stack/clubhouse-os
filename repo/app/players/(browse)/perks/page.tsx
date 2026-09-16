import { getAdapter } from "@/lib/data";
import { PlayerPerkCard } from "@/components/player-perk-card";
import { EmptyState } from "@/components/empty-state";
import { PaginatedList } from "@/components/paginated-list";

/**
 * Perks — ported from CHOS's own (app/dashboard/[clubToken]/workspace/
 * perks/page.tsx), 15 Sep, reading a genuinely separate real sheet
 * (P PERKS, not PERKS — see getPlayerPerks' own doc comment, lib/
 * data/sheets.ts, for the column-name assumption this makes and what
 * to check if it's wrong). No plan-tier gating at all (Kennedy
 * confirmed, 15 Sep: every perk shown to every player) — PlayerPerkCard
 * is genuinely simpler than PerkCard for exactly that reason.
 */
export default async function PublicPerks() {
  const db = getAdapter();
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
          href="/players"
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

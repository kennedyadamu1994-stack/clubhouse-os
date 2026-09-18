import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { EmptyState } from "@/components/empty-state";
import { OutreachList, type OutreachEntry } from "@/components/outreach-list";
import { OpportunityCard } from "@/components/opportunity-card";

/** Personal (token'd) POS Jobs — content identical to the public version (app/players/jobs/page.tsx), re-guarded per-page the same way the Calendar pair is. */
export default async function PlayerJobs({
  params,
}: {
  params: Promise<{ playerToken: string }>;
}) {
  const { playerToken } = await params;
  const db = getAdapter();
  const player = await db.getPlayerByToken(playerToken);
  if (!player) notFound();

  const opportunities = await db.getOpportunities();

  const types = Array.from(new Set(opportunities.map((o) => o.type).filter(Boolean))).sort();
  const areas = Array.from(new Set(opportunities.map((o) => o.area).filter(Boolean))).sort();

  const entries: OutreachEntry[] = opportunities.map((o) => ({
    key: o.opportunity_id,
    searchText: [o.title, o.provider, o.area, o.type, o.sports.join(" "), o.description].join(" "),
    filterValues: { type: o.type, area: o.area },
    sortValues: { rating: o.credibility_score ?? -1 },
    nameForSort: o.title,
    sponsored: o.sponsored,
    card: <OpportunityCard key={o.opportunity_id} opportunity={o} />,
  }));

  return (
    <div className="card outreach-card">
      <p style={{ color: "var(--dim)", fontSize: "0.85rem", marginBottom: 20, maxWidth: "60ch" }}>
        Coaching roles, volunteering, and sports jobs from across The NBRH.{" "}
        <span className="count-badge">{opportunities.length} listed</span>
      </p>

      {opportunities.length === 0 ? (
        <EmptyState
          message="No opportunities listed right now — check back soon."
          cta="Browse Search instead"
          href={`/players/${playerToken}/search`}
        />
      ) : (
        <OutreachList
          entries={entries}
          placeholder="Search jobs and opportunities…"
          filters={[
            { key: "type", label: "Type", values: types },
            { key: "area", label: "Area", values: areas },
          ]}
          sortOptions={[
            { key: "rating", label: "Highest rated" },
            { key: "name", label: "Name (A–Z)" },
          ]}
        />
      )}
    </div>
  );
}

import { getAdapter } from "@/lib/data";
import { EmptyState } from "@/components/empty-state";
import { OutreachList, type OutreachEntry } from "@/components/outreach-list";
import { OpportunityCard } from "@/components/opportunity-card";

/**
 * POS Jobs — real listings from getOpportunities() (the OPPORTUNITIES
 * tab, wired 15 Sep). Reuses OutreachList (the shared filter/sort/
 * search shell every CHOS Outreach page already uses) — that component
 * takes plain serialisable entries and a React node per card, with no
 * club coupling in it at all; only EntryCard itself was club-coupled,
 * which is why this uses OpportunityCard instead (see its own doc
 * comment in components/opportunity-card.tsx for why).
 */
export default async function PublicJobs() {
  const db = getAdapter();
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
          href="/players/search"
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

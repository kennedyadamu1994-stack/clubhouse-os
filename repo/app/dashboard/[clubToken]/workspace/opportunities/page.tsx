import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { EntryCard } from "@/components/entry-card";
import { OutreachList, type OutreachEntry } from "@/components/outreach-list";
import { ListCalloutButton } from "@/components/list-callout-button";

const TYPE_LABEL: Record<string, string> = {
  workshop: "Workshop",
  event: "Event",
  pr: "PR opportunity",
  resource: "Resource",
  callout: "Call-out",
};

export default async function Opportunities({
  params,
}: {
  params: Promise<{ clubToken: string }>;
}) {
  const { clubToken } = await params;
  const db = getAdapter();
  const club = await db.getClubByToken(clubToken);
  if (!club) notFound();

  const [allOpportunities, actions] = await Promise.all([
    db.getOpportunities(),
    db.getActionsForClub(club.club_id),
  ]);
  const opportunities = allOpportunities.filter((o) => o.status === "open");
  const isFirstToken = actions.filter((a) => a.type === "action").length === 0;
  const base = `/dashboard/${clubToken}`;

  const types = Array.from(new Set(opportunities.map((o) => TYPE_LABEL[o.type] ?? o.type))).sort();

  const entries: OutreachEntry[] = opportunities.map((o) => {
    const isCallout = o.type === "callout";
    const dateLabel = new Date(o.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    return {
      key: o.opportunity_id,
      searchText: [o.title, TYPE_LABEL[o.type] ?? o.type, o.area, o.tags.join(" "), o.description].join(" "),
      filterValues: { type: TYPE_LABEL[o.type] ?? o.type },
      sortValues: { date: 100_000 - Math.ceil((new Date(o.date).getTime() - Date.now()) / 86_400_000) },
      nameForSort: o.title,
      card: (
        <EntryCard
          key={o.opportunity_id}
          clubToken={clubToken}
          club_id={club.club_id}
          entryId={o.opportunity_id}
          initials={(TYPE_LABEL[o.type] ?? o.type).slice(0, 2).toUpperCase()}
          title={o.title}
          subtitle={`${TYPE_LABEL[o.type] ?? o.type} · ${o.area} · ${dateLabel}`}
          tags={o.tags}
          detail={[
            { label: "Type", value: TYPE_LABEL[o.type] ?? o.type },
            { label: "Area", value: o.area },
            { label: "Date", value: new Date(o.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) },
            { label: "Description", value: o.description },
          ]}
          consentNote={
            isCallout
              ? "Posted by another club on the platform — get in touch and The NBRH makes the introduction."
              : undefined
          }
          actions={
            isCallout
              ? [{ action_key: "contact_us", label: `Offer to help with "${o.title}"`, colour: "pink", token_cost: 0 }]
              : [
                  ...(o.link
                    ? [{ action_key: "view_opportunity", label: "See the full listing", colour: "black" as const, token_cost: 0, href: o.link }]
                    : []),
                  { action_key: "contact_us", label: `Ask us about "${o.title}"`, colour: "pink", token_cost: 0 },
                ]
          }
          isFirstTokenEncounter={isFirstToken}
        />
      ),
    };
  });

  return (
    <div className="card outreach-card">
      <h2>
        Opportunities <span className="count-badge">{opportunities.length} open</span>
      </h2>

      <div style={{ marginBottom: 20 }}>
        <p style={{ color: "var(--dim)", fontSize: "0.85rem", marginBottom: 10, maxWidth: "56ch" }}>
          Looking for volunteers, coaches, or anything else from other clubs nearby? List your own
          call-out — write what you need in the notes field when you submit.
        </p>
        <ListCalloutButton clubToken={clubToken} club_id={club.club_id} isFirstTokenEncounter={isFirstToken} />
      </div>

      {opportunities.length === 0 ? (
        <p style={{ color: "var(--dim)" }}>
          No open opportunities right now — check back soon, or list your own call-out above.
        </p>
      ) : (
        <OutreachList
          entries={entries}
          placeholder="Search opportunities by title, type, or area…"
          filters={[{ key: "type", label: "Type", values: types }]}
          sortOptions={[{ key: "date", label: "Soonest first" }, { key: "name", label: "Name (A–Z)" }]}
          defaultSort="date"
        />
      )}
    </div>
  );
}

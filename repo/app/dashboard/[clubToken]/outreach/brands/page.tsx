import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { tagMatchScore } from "@/lib/scoring";
import { isRecent } from "@/lib/dates";
import { EntryCard } from "@/components/entry-card";
import { EmptyState } from "@/components/empty-state";
import { OutreachList, type OutreachEntry } from "@/components/outreach-list";

const TYPE_LABEL: Record<string, string> = {
  local_shop: "Local shop",
  big_brand: "Big brand",
  corporate: "Corporate",
};

export default async function BrandsOutreach({
  params,
}: {
  params: Promise<{ clubToken: string }>;
}) {
  const { clubToken } = await params;
  const db = getAdapter();
  const club = await db.getClubByToken(clubToken);
  if (!club) notFound();

  const [brands, actions] = await Promise.all([
    db.getBrands(),
    db.getActionsForClub(club.club_id),
  ]);
  const isFirstToken = actions.filter((a) => a.type === "action").length === 0;
  const base = `/dashboard/${clubToken}`;

  const types = Array.from(new Set(brands.map((b) => TYPE_LABEL[b.type]))).sort();
  const areas = Array.from(new Set(brands.map((b) => b.area))).sort();

  const entries: OutreachEntry[] = brands.map((b) => {
    // Tags-based match score (Kennedy, 29 Aug) — uses the real "tags"
    // column, not partnership_interests (a different real field, still
    // used for search/filter above, unaffected).
    const score = tagMatchScore(club, b.tags);
    return {
      key: b.brand_id,
      searchText: [b.name, TYPE_LABEL[b.type], b.area, b.sectors.join(" "), b.partnership_interests.join(" ")].join(" "),
      filterValues: { type: TYPE_LABEL[b.type], area: b.area },
      sortValues: { match: score },
      nameForSort: b.name,
      sponsored: b.sponsored,
      card: (
        <EntryCard
          key={b.brand_id}
          clubToken={clubToken}
          club_id={club.club_id}
          entryId={b.brand_id}
          initials={b.name.slice(0, 2).toUpperCase()}
          imageUrl={b.image_url}
          title={b.name}
          subtitle={`${TYPE_LABEL[b.type]} · ${b.area}`}
          tags={[]}
          matchScore={score}
          isNew={isRecent(b.created_at)}
          sponsored={b.sponsored}
          detail={[
            { label: "Type", value: TYPE_LABEL[b.type] },
            { label: "Sectors", value: b.sectors.join(", ") || "—" },
            { label: "Interested in", value: b.partnership_interests.join(", ") || "—" },
          ]}
          consentNote={
            b.contact
              ? undefined
              : "Direct contact isn't shared for this business — reach out via their website, or let The NBRH make the introduction."
          }
          actions={[
            ...(b.website
              ? [{ action_key: "visit_website", label: `Visit ${b.name}'s website`, colour: "black" as const, token_cost: 0, href: b.website }]
              : []),
            {
              action_key: b.type === "corporate" ? "brand_outreach_corporate" : "brand_outreach_local",
              label: `We'll pitch ${b.name} for you`,
              colour: "pink",
              token_cost: 3, // both local and corporate brand outreach now cost 3 (Kennedy, 27 Aug follow-up)
            },
          ]}
          isFirstTokenEncounter={isFirstToken}
        />
      ),
    };
  });

  return (
    <div className="card outreach-card">
      <h2>
        Brands & Businesses <span className="count-badge">{brands.length} nearby</span>
      </h2>

      {brands.length === 0 ? (
        <EmptyState
          message="No local businesses listed yet — we're adding more every week."
          cta="Contact us"
          href={`${base}/tools/contact`}
        />
      ) : (
        <OutreachList
          entries={entries}
          placeholder="Search businesses by name, type, or area…"
          filters={[
            { key: "type", label: "Type", values: types },
            { key: "area", label: "Area", values: areas },
          ]}
          sortOptions={[
            { key: "match", label: "Best match" },
            { key: "name", label: "Name (A–Z)" },
          ]}
        />
      )}
    </div>
  );
}

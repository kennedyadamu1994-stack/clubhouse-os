import { notFound } from "next/navigation";
import { getAdapter, getScoreWeights } from "@/lib/data";
import { matchScore } from "@/lib/scoring";
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

  const [brands, actions, weights] = await Promise.all([
    db.getBrands(),
    db.getActionsForClub(club.club_id),
    getScoreWeights(),
  ]);
  const isFirstToken = actions.filter((a) => a.type === "action").length === 0;
  const hasPriorities = club.priorities.length > 0;
  const base = `/dashboard/${clubToken}`;

  const types = Array.from(new Set(brands.map((b) => TYPE_LABEL[b.type]))).sort();
  const areas = Array.from(new Set(brands.map((b) => b.area))).sort();

  const entries: OutreachEntry[] = brands.map((b) => ({
    key: b.brand_id,
    searchText: [b.name, TYPE_LABEL[b.type], b.area, b.sectors.join(" "), b.partnership_interests.join(" ")].join(" "),
    filterValues: { type: TYPE_LABEL[b.type], area: b.area },
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
        tags={b.partnership_interests}
        matchScore={hasPriorities ? matchScore(club, { area: b.area, tags: b.partnership_interests }, weights) : undefined}
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
          { action_key: "visit_website", label: "Visit website", colour: "black", token_cost: 0, href: b.website },
          {
            action_key: b.type === "corporate" ? "brand_outreach_corporate" : "brand_outreach_local",
            label: "Reach out on our behalf",
            colour: "pink",
            token_cost: b.type === "corporate" ? 2 : 1,
          },
        ]}
        isFirstTokenEncounter={isFirstToken}
      />
    ),
  }));

  return (
    <div className="card">
      <h2>
        Brands & Businesses <span className="count-badge">{brands.length} nearby</span>
      </h2>
      <p style={{ color: "var(--faint)", fontSize: "0.78rem", marginBottom: 14, fontStyle: "italic" }}>
        Seed data — no live sheet yet (docs/schema.md § Brands_Businesses).
      </p>

      {brands.length === 0 ? (
        <EmptyState
          message="No local businesses listed yet — we're adding more every week."
          cta="Contact us"
          href={`${base}/priorities`}
        />
      ) : (
        <OutreachList
          entries={entries}
          placeholder="Search businesses by name, type, or area…"
          filters={[
            { key: "type", label: "Type", values: types },
            { key: "area", label: "Area", values: areas },
          ]}
        />
      )}
    </div>
  );
}

import { notFound } from "next/navigation";
import { getAdapter, getScoreWeights } from "@/lib/data";
import { matchScore } from "@/lib/scoring";
import { EntryCard } from "@/components/entry-card";
import { EmptyState } from "@/components/empty-state";
import { OutreachList, type OutreachEntry } from "@/components/outreach-list";

export default async function InfluencersOutreach({
  params,
}: {
  params: Promise<{ clubToken: string }>;
}) {
  const { clubToken } = await params;
  const db = getAdapter();
  const club = await db.getClubByToken(clubToken);
  if (!club) notFound();

  const [influencers, actions, weights] = await Promise.all([
    db.getInfluencers(),
    db.getActionsForClub(club.club_id),
    getScoreWeights(),
  ]);
  const isFirstToken = actions.filter((a) => a.type === "action").length === 0;
  const hasPriorities = club.priorities.length > 0;
  const base = `/dashboard/${clubToken}`;

  const areas = Array.from(new Set(influencers.map((i) => i.area))).sort();
  const niches = Array.from(new Set(influencers.flatMap((i) => i.niches))).sort();

  const entries: OutreachEntry[] = influencers.map((inf) => {
    const score = hasPriorities ? matchScore(club, { area: inf.area, tags: inf.niches }, weights) : undefined;
    return {
      key: inf.influencer_id,
      searchText: [inf.name, inf.area, inf.platforms.join(" "), inf.niches.join(" ")].join(" "),
      filterValues: { area: inf.area, niche: inf.niches[0] ?? "" },
      sortValues: score != null ? { match: score } : undefined,
      nameForSort: inf.name,
      card: (
        <EntryCard
          key={inf.influencer_id}
          clubToken={clubToken}
          club_id={club.club_id}
          entryId={inf.influencer_id}
          initials={inf.name.replace("@", "").slice(0, 2).toUpperCase()}
          imageUrl={inf.image_url}
          title={inf.name}
          subtitle={`${inf.platforms.join(", ")} · ${inf.follower_band} followers`}
          tags={[...inf.niches, inf.area]}
          matchScore={score}
          detail={[
            { label: "Platforms", value: inf.platforms.join(", ") },
            { label: "Followers", value: inf.follower_band },
            { label: "Focus", value: inf.niches.join(", ") },
          ]}
          actions={[
            { action_key: "contact_directly", label: "Contact directly", colour: "black", token_cost: 0, href: inf.direct_contact_url },
            { action_key: "influencer_outreach", label: "Let The NBRH reach out", colour: "pink", token_cost: 1 },
          ]}
          isFirstTokenEncounter={isFirstToken}
        />
      ),
    };
  });

  return (
    <div className="card">
      <h2>
        Influencers <span className="count-badge">{influencers.length} local voices</span>
      </h2>
      <p style={{ color: "var(--faint)", fontSize: "0.78rem", marginBottom: 14, fontStyle: "italic" }}>
        Seed data — no live sheet yet (docs/schema.md § Influencers).
      </p>

      {influencers.length === 0 ? (
        <EmptyState
          message="No local influencers listed yet — check back soon."
          cta="Contact us"
          href={`${base}/priorities`}
        />
      ) : (
        <OutreachList
          entries={entries}
          placeholder="Search influencers by name, area, or focus…"
          filters={[
            { key: "area", label: "Area", values: areas },
            { key: "niche", label: "Focus", values: niches },
          ]}
          sortOptions={[
            ...(hasPriorities ? [{ key: "match", label: "Best match" }] : []),
            { key: "name", label: "Name (A–Z)" },
          ]}
        />
      )}
    </div>
  );
}

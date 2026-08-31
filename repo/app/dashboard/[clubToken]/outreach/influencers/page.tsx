import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { tagMatchScore } from "@/lib/scoring";
import { isRecent } from "@/lib/dates";
import { EntryCard } from "@/components/entry-card";
import { EmptyState } from "@/components/empty-state";
import { OutreachList, type OutreachEntry } from "@/components/outreach-list";

/**
 * Parses a real follower_band value into a single comparable number, for
 * the "Most followers" sort (Kennedy's request, 29 Aug). The real column
 * is free text, not a raw number, so this handles every realistic shape
 * seen or anticipated rather than assuming one exact format:
 *   "5k-10k"  → 10000 (a range uses its upper bound — the more
 *               representative figure when comparing influencers, since
 *               two influencers in the same band should tie rather than
 *               one arbitrarily winning on whichever end got picked)
 *   "25k+"    → 25000
 *   "8500"    → 8500 (a bare number, no suffix)
 *   "12.5k"   → 12500 (decimal k values)
 *   ""  / unparseable → 0, sorts to the bottom rather than crashing
 */
function parseFollowerCount(band: string): number {
  const matches = [...band.matchAll(/([\d.]+)\s*(k|m)?/gi)];
  if (matches.length === 0) return 0;
  const last = matches[matches.length - 1]; // range → take the upper bound (the last number found)
  const num = parseFloat(last[1]);
  if (isNaN(num)) return 0;
  const suffix = last[2]?.toLowerCase();
  if (suffix === "k") return num * 1_000;
  if (suffix === "m") return num * 1_000_000;
  return num;
}

export default async function InfluencersOutreach({
  params,
}: {
  params: Promise<{ clubToken: string }>;
}) {
  const { clubToken } = await params;
  const db = getAdapter();
  const club = await db.getClubByToken(clubToken);
  if (!club) notFound();

  const [influencers, actions] = await Promise.all([
    db.getInfluencers(),
    db.getActionsForClub(club.club_id),
  ]);
  const isFirstToken = actions.filter((a) => a.type === "action").length === 0;
  const base = `/dashboard/${clubToken}`;

  const areas = Array.from(new Set(influencers.map((i) => i.area))).sort();
  const niches = Array.from(new Set(influencers.flatMap((i) => i.niches))).sort();

  const entries: OutreachEntry[] = influencers.map((inf) => {
    // Tags-based match score (Kennedy, 29 Aug) — Influencers had no match
    // score at all before; added now that a real tags column exists here too.
    const score = tagMatchScore(club, inf.tags);
    return {
      key: inf.influencer_id,
      searchText: [inf.name, inf.area, inf.platforms.join(" "), inf.niches.join(" ")].join(" "),
      filterValues: { area: inf.area, niche: inf.niches[0] ?? "" },
      sortValues: { followers: parseFollowerCount(inf.follower_band), match: score },
      nameForSort: inf.name,
      sponsored: inf.sponsored,
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
          tags={[]}
          matchScore={score}
          isNew={isRecent(inf.created_at)}
          sponsored={inf.sponsored}
          detail={[
            { label: "Platforms", value: inf.platforms.join(", ") },
            { label: "Followers", value: inf.follower_band },
            { label: "Focus", value: inf.niches.join(", ") },
            { label: "Area", value: inf.area },
          ]}
          actions={[
            ...(inf.direct_contact_url
              ? [{ action_key: "contact_directly", label: `Message ${inf.name.replace("@", "")} yourself`, colour: "black" as const, token_cost: 0, href: inf.direct_contact_url }]
              : []),
            { action_key: "influencer_outreach", label: `We'll reach out to ${inf.name.replace("@", "")}`, colour: "pink" as const, token_cost: 3 },
          ]}
          isFirstTokenEncounter={isFirstToken}
        />
      ),
    };
  });

  return (
    <div className="card outreach-card">
      <h2>
        Influencers <span className="count-badge">{influencers.length} local voices</span>
      </h2>
      {influencers.length === 0 ? (
        <EmptyState
          message="No local influencers listed yet — check back soon."
          cta="Contact us"
          href={`${base}/tools/contact`}
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
            { key: "match", label: "Best match" },
            { key: "name", label: "Name (A–Z)" },
            { key: "followers", label: "Most followers" },
          ]}
        />
      )}
    </div>
  );
}

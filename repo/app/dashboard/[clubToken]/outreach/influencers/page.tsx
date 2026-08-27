import { notFound } from "next/navigation";
import { getAdapter, getScoreWeights } from "@/lib/data";
import { matchScore } from "@/lib/scoring";
import { isRecent } from "@/lib/dates";
import { EntryCard } from "@/components/entry-card";
import { EmptyState } from "@/components/empty-state";
import { OutreachList, type OutreachEntry } from "@/components/outreach-list";
import { hasPaidAccess } from "@/lib/types";
import { PaywallGate } from "@/components/paywall-gate";

export default async function InfluencersOutreach({
  params,
}: {
  params: Promise<{ clubToken: string }>;
}) {
  const { clubToken } = await params;
  const db = getAdapter();
  const club = await db.getClubByToken(clubToken);
  if (!club) notFound();

  // Locked on the Free plan (Kennedy's correction, 25 Aug — was originally
  // NOT locked, now swapped with Players/People/Clubs).
  if (!hasPaidAccess(club.plan_tier)) {
    return <PaywallGate sectionName="Influencers" plans={await db.getPlans()} />;
  }

  const [influencers, actions, weights] = await Promise.all([
    db.getInfluencers(),
    db.getActionsForClub(club.club_id),
    getScoreWeights(),
  ]);
  const isFirstToken = actions.filter((a) => a.type === "action").length === 0;
  const base = `/dashboard/${clubToken}`;

  const areas = Array.from(new Set(influencers.map((i) => i.area))).sort();
  const niches = Array.from(new Set(influencers.flatMap((i) => i.niches))).sort();

  const entries: OutreachEntry[] = influencers.map((inf) => {
    const score = matchScore(club, { area: inf.area, tags: inf.niches }, weights);
    return {
      key: inf.influencer_id,
      searchText: [inf.name, inf.area, inf.platforms.join(" "), inf.niches.join(" ")].join(" "),
      filterValues: { area: inf.area, niche: inf.niches[0] ?? "" },
      sortValues: { match: score },
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
            { action_key: "contact_directly", label: `Message ${inf.name.replace("@", "")} yourself`, colour: "black", token_cost: 0, href: inf.direct_contact_url },
            { action_key: "influencer_outreach", label: `We'll reach out to ${inf.name.replace("@", "")}`, colour: "pink", token_cost: 3 },
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
          ]}
        />
      )}
    </div>
  );
}

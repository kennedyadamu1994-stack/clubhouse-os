import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { EntryCard } from "@/components/entry-card";
import { EmptyState } from "@/components/empty-state";

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

  return (
    <div className="card">
      <h2>
        Influencers <span className="count-badge">{influencers.length} local voices</span>
      </h2>

      {influencers.length === 0 ? (
        <EmptyState
          message="No local influencers listed yet — check back soon."
          cta="Contact us"
          href={`${base}/priorities`}
        />
      ) : (
        <div className="entry-list">
          {influencers.map((inf) => (
            <EntryCard
              key={inf.influencer_id}
              clubToken={clubToken}
              club_id={club.club_id}
              entryId={inf.influencer_id}
              initials={inf.name.replace("@", "").slice(0, 2).toUpperCase()}
              title={inf.name}
              subtitle={`${inf.platforms.join(", ")} · ${inf.follower_band} followers`}
              tags={[...inf.niches, inf.area]}
              detail={[
                { label: "Platforms", value: inf.platforms.join(", ") },
                { label: "Followers", value: inf.follower_band },
                { label: "Focus", value: inf.niches.join(", ") },
              ]}
              actions={[
                {
                  action_key: "contact_directly",
                  label: "Contact directly",
                  colour: "black",
                  token_cost: 0,
                  href: inf.direct_contact_url,
                },
                {
                  action_key: "influencer_outreach",
                  label: "Let The NBRH reach out",
                  colour: "pink",
                  token_cost: 1,
                },
              ]}
              isFirstTokenEncounter={isFirstToken}
            />
          ))}
        </div>
      )}
    </div>
  );
}

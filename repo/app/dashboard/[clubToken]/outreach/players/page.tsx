import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { EntryCard } from "@/components/entry-card";
import { EmptyState } from "@/components/empty-state";

export default async function PlayersOutreach({
  params,
}: {
  params: Promise<{ clubToken: string }>;
}) {
  const { clubToken } = await params;
  const db = getAdapter();
  const club = await db.getClubByToken(clubToken);
  if (!club) notFound();

  const [players, actions] = await Promise.all([db.getPlayers(), db.getActionsForClub(club.club_id)]);
  const isFirstToken = actions.filter((a) => a.type === "action").length === 0;
  const base = `/dashboard/${clubToken}`;

  return (
    <div className="card">
      <h2>
        Players <span className="count-badge">{players.length} in the neighbourhood</span>
      </h2>

      {players.length === 0 ? (
        <EmptyState
          message="No players listed in your area yet — we're adding more every week."
          cta="Contact us"
          href={`${base}/priorities`}
        />
      ) : (
        <div className="entry-list">
          {players.map((p) => (
            <EntryCard
              key={p.player_id}
              clubToken={clubToken}
              club_id={club.club_id}
              entryId={p.player_id}
              initials={p.name ? p.name.slice(0, 2).toUpperCase() : "PL"}
              title={p.name ?? `Player in ${p.area}`}
              subtitle={`${p.sports.join(", ")} · ${p.level}`}
              tags={[p.area, p.preferred_times]}
              detail={[
                { label: "Interests", value: p.interests.join(", ") || "—" },
                { label: "Preferred times", value: p.preferred_times },
                { label: "Level", value: p.level },
              ]}
              consentNote={
                p.name
                  ? undefined
                  : "This player hasn't consented to share their name — you can still invite them; The NBRH handles the introduction."
              }
              actions={[
                {
                  action_key: "player_invite",
                  label: "Send invite",
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

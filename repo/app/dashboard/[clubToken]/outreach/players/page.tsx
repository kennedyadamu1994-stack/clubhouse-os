import { notFound } from "next/navigation";
import { getAdapter, getScoreWeights } from "@/lib/data";
import { matchScore } from "@/lib/scoring";
import { EntryCard } from "@/components/entry-card";
import { EmptyState } from "@/components/empty-state";
import { OutreachList, type OutreachEntry } from "@/components/outreach-list";

export default async function PlayersOutreach({
  params,
}: {
  params: Promise<{ clubToken: string }>;
}) {
  const { clubToken } = await params;
  const db = getAdapter();
  const club = await db.getClubByToken(clubToken);
  if (!club) notFound();

  const [players, actions, weights] = await Promise.all([
    db.getPlayers(),
    db.getActionsForClub(club.club_id),
    getScoreWeights(),
  ]);
  const isFirstToken = actions.filter((a) => a.type === "action").length === 0;
  const hasPriorities = club.priorities.length > 0;
  const base = `/dashboard/${clubToken}`;

  const areas = Array.from(new Set(players.map((p) => p.area))).sort();
  const sports = Array.from(new Set(players.flatMap((p) => p.sports))).sort();

  // Built server-side: plain strings/numbers/objects only, so nothing here
  // is a function — that's what makes it safe to hand to the Client
  // Component (see README on the boundary bug this pattern fixes).
  const entries: OutreachEntry[] = players.map((p) => {
    const score = hasPriorities
      ? matchScore(club, { sports: p.sports, area: p.area, tags: p.interests }, weights)
      : undefined;
    return {
      key: p.player_id,
      searchText: [p.name ?? "", p.area, p.sports.join(" "), p.interests.join(" "), p.level].join(" "),
      filterValues: { area: p.area, sport: p.sports[0] ?? "" },
      sortValues: score != null ? { match: score } : undefined,
      nameForSort: p.name ?? `Player in ${p.area}`,
      card: (
        <EntryCard
          key={p.player_id}
          clubToken={clubToken}
          club_id={club.club_id}
          entryId={p.player_id}
          initials={p.name ? p.name.slice(0, 2).toUpperCase() : "PL"}
          title={p.name ?? `Player in ${p.area}`}
          subtitle={`${p.sports.join(", ")} · ${p.level}`}
          tags={[p.area, p.preferred_times]}
          matchScore={score}
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
          actions={[{ action_key: "player_invite", label: "Send invite", colour: "pink", token_cost: 1 }]}
          isFirstTokenEncounter={isFirstToken}
        />
      ),
    };
  });

  return (
    <div className="card outreach-card">
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
        <OutreachList
          entries={entries}
          placeholder="Search players by name, area, or sport…"
          filters={[
            { key: "area", label: "Area", values: areas },
            { key: "sport", label: "Sport", values: sports },
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

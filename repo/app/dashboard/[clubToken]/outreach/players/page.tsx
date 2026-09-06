import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { buildReasonChips, relevanceSortValue } from "@/lib/relevance";
import { isRecent } from "@/lib/dates";
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

  const [players, actions] = await Promise.all([
    db.getPlayers(),
    db.getActionsForClub(club.club_id),
  ]);
  const isFirstToken = actions.filter((a) => a.type === "action").length === 0;
  const base = `/dashboard/${clubToken}`;

  const areas = Array.from(new Set(players.map((p) => p.area))).sort();
  const sports = Array.from(new Set(players.flatMap((p) => p.sports))).sort();

  // Built server-side: plain strings/numbers/objects only, so nothing here
  // is a function — that's what makes it safe to hand to the Client
  // Component (see README on the boundary bug this pattern fixes).
  const entries: OutreachEntry[] = players.map((p) => {
    // v3 reason chips (Kennedy, 1 Sep, revised 1 Sep) — 4 fixed buckets
    // (Sport/Location/Audience/Gender), not free-form tag chips any more.
    // See lib/relevance.ts for the full reasoning. Players have real
    // age/gender fields, so those are preferred over guessing from tags.
    const chips = buildReasonChips(club, {
      sports: p.sports,
      area: p.area,
      age: p.age,
      gender: p.gender,
      tags: p.tags,
    });
    return {
      key: p.player_id,
      searchText: [p.name ?? "", p.area, p.sports.join(" "), p.interests.join(" "), p.level, p.gender ?? ""].join(" "),
      filterValues: { area: p.area, sport: p.sports[0] ?? "" },
      sortValues: { match: relevanceSortValue(chips) },
      nameForSort: p.name ?? `Player in ${p.area}`,
      sponsored: p.sponsored,
      card: (
        <EntryCard
          key={p.player_id}
          clubToken={clubToken}
          club_id={club.club_id}
          entryId={p.player_id}
          initials={p.name ? p.name.slice(0, 2).toUpperCase() : "PL"}
          title={p.name ?? `Player in ${p.area}`}
          subtitle={`${p.sports.join(", ")} · ${p.level}`}
          tags={[]}
          reasonChips={chips}
          entrySport={p.sports}
          isNew={isRecent(p.created_at)}
          sponsored={p.sponsored}
          detail={[
            { label: "Area", value: p.area },
            { label: "Interests", value: p.interests.join(", ") || "—" },
            { label: "Preferred times", value: p.preferred_times },
            { label: "Level", value: p.level },
            { label: "Gender", value: p.gender ?? "—" },
            { label: "Age", value: p.age != null ? String(p.age) : "—" },
          ]}
          consentNote={
            // p.name is always null now (gatePlayer — Kennedy, 20 Aug: a
            // blanket policy, not per-player consent), so this always shows.
            // Wording reflects that — never implies it was this player's
            // individual choice.
            "Player names aren't shown here, you can still invite them; The NBRH handles the introduction."
          }
          actions={[{ action_key: "player_invite", label: "Invite them to trial with us", colour: "pink", token_cost: 1 }]}
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
          message="No players listed in your area yet, we're adding more every week."
          cta="Contact us"
          href={club.plan_tier === "free" ? "https://thenbrh.co.uk" : `${base}/tools/contact`}
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
            { key: "match", label: "Best match" },
            { key: "name", label: "Name (A–Z)" },
          ]}
        />
      )}
    </div>
  );
}

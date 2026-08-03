import { notFound } from "next/navigation";
import { getAdapter, getScoreWeights } from "@/lib/data";
import { matchScore } from "@/lib/scoring";
import { EntryCard } from "@/components/entry-card";
import { EmptyState } from "@/components/empty-state";
import { OutreachList, type OutreachEntry } from "@/components/outreach-list";

export default async function ClubsOutreach({
  params,
}: {
  params: Promise<{ clubToken: string }>;
}) {
  const { clubToken } = await params;
  const db = getAdapter();
  const club = await db.getClubByToken(clubToken);
  if (!club) notFound();

  const [directory, actions, weights] = await Promise.all([
    db.getClubsDirectory(),
    db.getActionsForClub(club.club_id),
    getScoreWeights(),
  ]);
  const isFirstToken = actions.filter((a) => a.type === "action").length === 0;
  const hasPriorities = club.priorities.length > 0;
  const base = `/dashboard/${clubToken}`;

  const sports = Array.from(new Set(directory.map((c) => c.sport))).sort();
  const areas = Array.from(new Set(directory.map((c) => c.area))).sort();

  const entries: OutreachEntry[] = directory.map((c) => ({
    key: c.directory_id,
    searchText: [c.name, c.sport, c.area, c.open_to.join(" ")].join(" "),
    filterValues: { sport: c.sport, area: c.area },
    card: (
      <EntryCard
        key={c.directory_id}
        clubToken={clubToken}
        club_id={club.club_id}
        entryId={c.directory_id}
        initials={c.name.slice(0, 2).toUpperCase()}
        imageUrl={c.image_url}
        title={c.name}
        subtitle={`${c.sport} · ${c.area}`}
        tags={c.open_to}
        matchScore={hasPriorities ? matchScore(club, { sports: [c.sport], area: c.area, tags: c.open_to }, weights) : undefined}
        detail={[
          { label: "Sport", value: c.sport },
          { label: "Area", value: c.area },
          { label: "Open to", value: c.open_to.join(", ") || "—" },
        ]}
        actions={[
          { action_key: "reach_out_yourself", label: "Reach out yourself", colour: "black", token_cost: 0, href: c.public_contact_url },
          { action_key: "club_outreach", label: "Let The NBRH arrange it", colour: "pink", token_cost: 1 },
        ]}
        isFirstTokenEncounter={isFirstToken}
      />
    ),
  }));

  return (
    <div className="card">
      <h2>
        Clubs <span className="count-badge">{directory.length} nearby</span>
      </h2>

      {directory.length === 0 ? (
        <EmptyState
          message="No neighbouring clubs listed yet — check back soon."
          cta="Contact us"
          href={`${base}/priorities`}
        />
      ) : (
        <OutreachList
          entries={entries}
          placeholder="Search clubs by name, sport, or area…"
          filters={[
            { key: "sport", label: "Sport", values: sports },
            { key: "area", label: "Area", values: areas },
          ]}
        />
      )}
    </div>
  );
}

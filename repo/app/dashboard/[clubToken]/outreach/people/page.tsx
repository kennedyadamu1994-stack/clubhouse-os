import { notFound } from "next/navigation";
import { getAdapter, getScoreWeights } from "@/lib/data";
import { matchScore } from "@/lib/scoring";
import { isRecent } from "@/lib/dates";
import { EntryCard } from "@/components/entry-card";
import { EmptyState } from "@/components/empty-state";
import { OutreachList, type OutreachEntry } from "@/components/outreach-list";

const ROLE_LABEL: Record<string, string> = {
  coach: "Coach",
  referee: "Referee",
  photographer: "Photographer",
  videographer: "Videographer",
  statistician: "Statistician",
  graphic_designer: "Graphic designer",
  copywriter: "Copywriter",
  pt: "PT",
};

export default async function PeopleOutreach({
  params,
}: {
  params: Promise<{ clubToken: string }>;
}) {
  const { clubToken } = await params;
  const db = getAdapter();
  const club = await db.getClubByToken(clubToken);
  if (!club) notFound();

  const [people, actions, weights] = await Promise.all([
    db.getPeople(),
    db.getActionsForClub(club.club_id),
    getScoreWeights(),
  ]);
  const isFirstToken = actions.filter((a) => a.type === "action").length === 0;
  const base = `/dashboard/${clubToken}`;

  const roles = Array.from(new Set(people.map((p) => ROLE_LABEL[p.role]))).sort();
  const areas = Array.from(new Set(people.map((p) => p.area))).sort();

  const entries: OutreachEntry[] = people.map((p) => {
    const score = matchScore(club, { sports: p.sports, area: p.area }, weights);
    const displayName = p.name ?? `${ROLE_LABEL[p.role]} in ${p.area}`;
    return {
      key: p.person_id,
      searchText: [p.name ?? "", ROLE_LABEL[p.role], p.area, p.sports.join(" ")].join(" "),
      filterValues: { role: ROLE_LABEL[p.role], area: p.area },
      sortValues: { match: score },
      nameForSort: displayName,
      sponsored: p.sponsored,
      card: (
        <EntryCard
          key={p.person_id}
          clubToken={clubToken}
          club_id={club.club_id}
          entryId={p.person_id}
          initials={ROLE_LABEL[p.role].slice(0, 2).toUpperCase()}
          imageUrl={p.image_url}
          title={displayName}
          subtitle={`${ROLE_LABEL[p.role]} · ${p.area}`}
          tags={p.sports}
          matchScore={score}
          isNew={isRecent(p.created_at)}
          sponsored={p.sponsored}
          detail={[
            { label: "Role", value: ROLE_LABEL[p.role] },
            { label: "Availability", value: p.availability },
            { label: "Notes", value: p.rate_note },
          ]}
          consentNote={
            p.name
              ? undefined
              : "This person hasn't consented to share their name — request them and The NBRH makes the introduction."
          }
          actions={[{ action_key: "person_request", label: `Book this ${ROLE_LABEL[p.role].toLowerCase()}`, colour: "pink", token_cost: 1 }]}
          isFirstTokenEncounter={isFirstToken}
        />
      ),
    };
  });

  return (
    <div className="card outreach-card">
      <h2>
        People <span className="count-badge">{people.length} available to help you grow</span>
      </h2>

      {people.length === 0 ? (
        <EmptyState
          message="No coaches, refs, or creatives listed yet — check back soon."
          cta="Contact us"
          href={`${base}/tools/contact`}
        />
      ) : (
        <OutreachList
          entries={entries}
          placeholder="Search people by name, role, or area…"
          filters={[
            { key: "role", label: "Role", values: roles },
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

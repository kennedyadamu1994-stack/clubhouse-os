import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { EntryCard } from "@/components/entry-card";
import { EmptyState } from "@/components/empty-state";

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

  const [people, actions] = await Promise.all([db.getPeople(), db.getActionsForClub(club.club_id)]);
  const isFirstToken = actions.filter((a) => a.type === "action").length === 0;
  const base = `/dashboard/${clubToken}`;

  return (
    <div className="card">
      <h2>
        People <span className="count-badge">{people.length} available to help you grow</span>
      </h2>

      {people.length === 0 ? (
        <EmptyState
          message="No coaches, refs, or creatives listed yet — check back soon."
          cta="Contact us"
          href={`${base}/priorities`}
        />
      ) : (
        <div className="entry-list">
          {people.map((p) => (
            <EntryCard
              key={p.person_id}
              clubToken={clubToken}
              club_id={club.club_id}
              entryId={p.person_id}
              initials={ROLE_LABEL[p.role].slice(0, 2).toUpperCase()}
              title={p.name ?? `${ROLE_LABEL[p.role]} in ${p.area}`}
              subtitle={`${ROLE_LABEL[p.role]} · ${p.area}`}
              tags={p.sports}
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
              actions={[
                {
                  action_key: "person_request",
                  label: "Request this person",
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

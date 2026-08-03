import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { EntryCard } from "@/components/entry-card";
import { EmptyState } from "@/components/empty-state";

export default async function ClubsOutreach({
  params,
}: {
  params: Promise<{ clubToken: string }>;
}) {
  const { clubToken } = await params;
  const db = getAdapter();
  const club = await db.getClubByToken(clubToken);
  if (!club) notFound();

  const [directory, actions] = await Promise.all([
    db.getClubsDirectory(),
    db.getActionsForClub(club.club_id),
  ]);
  const isFirstToken = actions.filter((a) => a.type === "action").length === 0;
  const base = `/dashboard/${clubToken}`;

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
        <div className="entry-list">
          {directory.map((c) => (
            <EntryCard
              key={c.directory_id}
              clubToken={clubToken}
              club_id={club.club_id}
              entryId={c.directory_id}
              initials={c.name.slice(0, 2).toUpperCase()}
              title={c.name}
              subtitle={`${c.sport} · ${c.area}`}
              tags={c.open_to}
              detail={[
                { label: "Sport", value: c.sport },
                { label: "Area", value: c.area },
                { label: "Open to", value: c.open_to.join(", ") || "—" },
              ]}
              actions={[
                {
                  action_key: "reach_out_yourself",
                  label: "Reach out yourself",
                  colour: "black",
                  token_cost: 0,
                  href: c.public_contact_url,
                },
                {
                  action_key: "club_outreach",
                  label: "Let The NBRH arrange it",
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

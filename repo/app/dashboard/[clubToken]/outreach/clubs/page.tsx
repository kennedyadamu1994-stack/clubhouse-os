import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { clubToClubMatchScore } from "@/lib/scoring";
import { isRecent } from "@/lib/dates";
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

  const [directoryRaw, actions] = await Promise.all([
    db.getClubsDirectory(),
    db.getActionsForClub(club.club_id),
  ]);
  // Never show a club its own directory row as an outreach target (a
  // pre-existing gap, fixed 27 Aug while wiring clubToClubMatchScore,
  // which looks up "my own" row in this same dataset by club_id).
  const directory = directoryRaw.filter((c) => c.directory_id !== club.club_id);
  const isFirstToken = actions.filter((a) => a.type === "action").length === 0;
  const base = `/dashboard/${clubToken}`;

  const sports = Array.from(new Set(directory.map((c) => c.sport))).sort();
  const areas = Array.from(new Set(directory.map((c) => c.area))).sort();

  const entries: OutreachEntry[] = directory.map((c) => {
    // Club-to-club scoring card (Kennedy, 27 Aug) — activity_type/location/
    // audience only, out of 25, shown as a percentage. Replaces the
    // generic sport/area/urgency matchScore() for this page specifically.
    const score = clubToClubMatchScore(club, c, directoryRaw);
    return {
      key: c.directory_id,
      searchText: [c.name, c.sport, c.area, c.open_to.join(" ")].join(" "),
      filterValues: { sport: c.sport, area: c.area },
      sortValues: { match: score },
      nameForSort: c.name,
      sponsored: c.sponsored,
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
          tags={[]}
          matchScore={score}
          isNew={isRecent(c.created_at)}
          sponsored={c.sponsored}
          verified={c.verified}
          detail={[
            { label: "Sport", value: c.sport },
            { label: "Area", value: c.area },
            { label: "Open to", value: c.open_to.join(", ") || "—" },
            ...(c.bio ? [{ label: "About", value: c.bio }] : []),
            ...(c.fee_text ? [{ label: "Fees", value: c.fee_text }] : []),
            ...(c.total_teams != null ? [{ label: "Teams", value: String(c.total_teams) }] : []),
            ...(c.address ? [{ label: "Address", value: c.address }] : []),
            { label: "Verified", value: c.verified ? "Yes" : "Not yet verified" },
            ...(c.website_url ? [{ label: "Website", value: c.website_url }] : []),
            ...(c.instagram_url ? [{ label: "Instagram", value: c.instagram_url }] : []),
            ...(c.email ? [{ label: "Email", value: c.email }] : []),
          ]}
          actions={[
            { action_key: "reach_out_yourself", label: `Message ${c.name} yourself`, colour: "black", token_cost: 0, href: c.public_contact_url },
            { action_key: "club_outreach", label: `We'll set it up with ${c.name}`, colour: "pink", token_cost: 2 },
          ]}
          reasonOptions={["Arrange a friendly", "Collab on project", "Ask for advice", "Something else"]}
          isFirstTokenEncounter={isFirstToken}
        />
      ),
    };
  });

  return (
    <div className="card outreach-card">
      <h2>
        Clubs <span className="count-badge">{directory.length} nearby</span>
      </h2>

      {directory.length === 0 ? (
        <EmptyState
          message="No neighbouring clubs listed yet — check back soon."
          cta="Contact us"
          href={`${base}/tools/contact`}
        />
      ) : (
        <OutreachList
          entries={entries}
          placeholder="Search clubs by name, sport, or area…"
          filters={[
            { key: "sport", label: "Sport", values: sports },
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

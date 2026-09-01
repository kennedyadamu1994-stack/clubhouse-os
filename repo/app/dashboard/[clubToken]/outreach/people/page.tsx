import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
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
  // Hidden entirely for Free (Kennedy, 1 Sep): Free's Outreach is limited to
  // Players/Clubs/Sponsorship & Funding only. Blocks direct URL access too,
  // not just the nav link — see outreach/layout.tsx's own note.
  if (club.plan_tier === "free") notFound();

  const [people, actions] = await Promise.all([
    db.getPeople(),
    db.getActionsForClub(club.club_id),
  ]);
  const isFirstToken = actions.filter((a) => a.type === "action").length === 0;
  const base = `/dashboard/${clubToken}`;

  // Falls back to a readable version of the raw role string for any
  // value not in ROLE_LABEL, rather than assuming every real sheet row
  // will always match one of the 8 hand-picked roles above — a genuine
  // crash Kennedy hit (29 Aug) the moment a new PEOPLE row used a
  // professional_type value outside this list (ROLE_LABEL[p.role] came
  // back undefined, and calling .slice()/.toLowerCase() on that threw,
  // breaking the whole page for every person, not just the new row).
  const roleLabel = (role: string) => ROLE_LABEL[role] ?? role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const roles = Array.from(new Set(people.map((p) => roleLabel(p.role)))).sort();
  const areas = Array.from(new Set(people.map((p) => p.area))).sort();

  const entries: OutreachEntry[] = people.map((p) => {
    const label = roleLabel(p.role);
    const displayName = p.name ?? `${label} in ${p.area}`;
    return {
      key: p.person_id,
      searchText: [p.name ?? "", label, p.area, p.sports.join(" ")].join(" "),
      filterValues: { role: label, area: p.area },
      sortValues: {},
      nameForSort: displayName,
      sponsored: p.sponsored,
      card: (
        <EntryCard
          key={p.person_id}
          clubToken={clubToken}
          club_id={club.club_id}
          entryId={p.person_id}
          initials={label.slice(0, 2).toUpperCase()}
          imageUrl={p.image_url}
          title={displayName}
          subtitle={`${label} · ${p.area}`}
          tags={[]}
          isNew={isRecent(p.created_at)}
          sponsored={p.sponsored}
          verified={p.verified}
          detail={[
            { label: "Role", value: label },
            { label: "Sports", value: p.sports.join(", ") || "—" },
            { label: "Availability", value: p.availability },
            { label: "Notes", value: p.rate_note },
          ]}
          consentNote={
            p.name
              ? undefined
              : "This person hasn't consented to share their name — request them and The NBRH makes the introduction."
          }
          actions={[
            ...(p.direct_contact_url
              ? [{ action_key: "contact_directly", label: `Book ${p.name ?? `this ${label.toLowerCase()}`} yourself`, colour: "black" as const, token_cost: 0, href: p.direct_contact_url }]
              : []),
            { action_key: "person_request", label: `Book this ${label.toLowerCase()}`, colour: "pink" as const, token_cost: 2 },
          ]}
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
            { key: "name", label: "Name (A–Z)" },
          ]}
        />
      )}
    </div>
  );
}

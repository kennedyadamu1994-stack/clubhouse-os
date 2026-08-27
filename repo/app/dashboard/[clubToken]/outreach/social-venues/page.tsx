import { notFound } from "next/navigation";
import { getAdapter, getScoreWeights } from "@/lib/data";
import { matchScore } from "@/lib/scoring";
import { isRecent } from "@/lib/dates";
import { EntryCard } from "@/components/entry-card";
import { EmptyState } from "@/components/empty-state";
import { OutreachList, type OutreachEntry } from "@/components/outreach-list";
import { hasPaidAccess } from "@/lib/types";
import { PaywallGate } from "@/components/paywall-gate";

/**
 * New Outreach subsection (Kennedy's request, 27 Aug) — mirrors the Clubs
 * Directory page's structure exactly, per Kennedy's own instruction, since
 * no real "SOCIAL VENUES" worksheet exists yet (see SocialVenue's doc
 * comment in lib/types.ts). venue_type takes Clubs' `sport` slot; there's
 * no teams-count equivalent since venues aren't sports clubs.
 *
 * Locked on the Free plan (unlike Clubs itself, which stays open) —
 * social venues are an external commercial-partner category, same
 * reasoning as Brands/Influencers/Sponsorship/Suppliers, not a peer-club
 * relationship the way Outreach → Clubs is.
 */
export default async function SocialVenuesOutreach({
  params,
}: {
  params: Promise<{ clubToken: string }>;
}) {
  const { clubToken } = await params;
  const db = getAdapter();
  const club = await db.getClubByToken(clubToken);
  if (!club) notFound();

  if (!hasPaidAccess(club.plan_tier)) {
    return <PaywallGate sectionName="Social Venues" plans={await db.getPlans()} />;
  }

  const [venues, actions, weights] = await Promise.all([
    db.getSocialVenues(),
    db.getActionsForClub(club.club_id),
    getScoreWeights(),
  ]);
  const isFirstToken = actions.filter((a) => a.type === "action").length === 0;
  const base = `/dashboard/${clubToken}`;

  const venueTypes = Array.from(new Set(venues.map((v) => v.venue_type))).sort();
  const areas = Array.from(new Set(venues.map((v) => v.area))).sort();

  const entries: OutreachEntry[] = venues.map((v) => {
    const score = matchScore(club, { area: v.area, tags: v.open_to }, weights);
    return {
      key: v.venue_id,
      searchText: [v.name, v.venue_type, v.area, v.open_to.join(" ")].join(" "),
      filterValues: { venueType: v.venue_type, area: v.area },
      sortValues: { match: score },
      nameForSort: v.name,
      sponsored: v.sponsored,
      card: (
        <EntryCard
          key={v.venue_id}
          clubToken={clubToken}
          club_id={club.club_id}
          entryId={v.venue_id}
          initials={v.name.slice(0, 2).toUpperCase()}
          imageUrl={v.image_url}
          title={v.name}
          subtitle={`${v.venue_type} · ${v.area}`}
          tags={[]}
          matchScore={score}
          isNew={isRecent(v.created_at)}
          sponsored={v.sponsored}
          detail={[
            { label: "Venue type", value: v.venue_type },
            { label: "Area", value: v.area },
            { label: "Open to", value: v.open_to.join(", ") || "—" },
            ...(v.bio ? [{ label: "About", value: v.bio }] : []),
            ...(v.fee_text ? [{ label: "Fees", value: v.fee_text }] : []),
            ...(v.address ? [{ label: "Address", value: v.address }] : []),
            { label: "Verified", value: v.verified ? "Yes" : "Not yet verified" },
            ...(v.website_url ? [{ label: "Website", value: v.website_url }] : []),
            ...(v.instagram_url ? [{ label: "Instagram", value: v.instagram_url }] : []),
            ...(v.email ? [{ label: "Email", value: v.email }] : []),
          ]}
          actions={[
            { action_key: "reach_out_yourself", label: `Message ${v.name} yourself`, colour: "black", token_cost: 0, href: v.public_contact_url },
            { action_key: "club_outreach", label: `We'll set it up with ${v.name}`, colour: "pink", token_cost: 1 },
          ]}
          reasonOptions={["Post-match social", "Presentation night", "Fundraiser", "Something else"]}
          isFirstTokenEncounter={isFirstToken}
        />
      ),
    };
  });

  return (
    <div className="card outreach-card">
      <h2>
        Social Venues <span className="count-badge">{venues.length} nearby</span>
      </h2>

      {venues.length === 0 ? (
        <EmptyState
          message="No social venues listed yet — check back soon."
          cta="Contact us"
          href={`${base}/tools/contact`}
        />
      ) : (
        <OutreachList
          entries={entries}
          placeholder="Search venues by name, type, or area…"
          filters={[
            { key: "venueType", label: "Venue type", values: venueTypes },
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

import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { isRecent } from "@/lib/dates";
import { EntryCard } from "@/components/entry-card";
import { EmptyState } from "@/components/empty-state";
import { OutreachList, type OutreachEntry } from "@/components/outreach-list";

/**
 * Outreach subsection, sourced from the real "SOCIAL VENUE" worksheet —
 * see SocialVenue's full doc comment and column mapping in lib/types.ts.
 *
 * No match score here — like Suppliers, a venue's fit isn't meaningfully
 * scored against a club's sport/area/goals; this is a browse-and-contact
 * catalogue, filtered by venue type and borough instead.
 *
 * No longer locked on any plan tier (Kennedy's request, 27 Aug fourth
 * follow-up: "completely remove the padlocked and locked elements for
 * the free version"). Hidden entirely for Free again as of 1 Sep — that
 * decision has been reversed; see outreach/layout.tsx's own note.
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
  // Blocks direct URL access too, not just the nav link.
  if (club.plan_tier === "free") notFound();

  const [venues, actions] = await Promise.all([
    db.getSocialVenues(),
    db.getActionsForClub(club.club_id),
  ]);
  const isFirstToken = actions.filter((a) => a.type === "action").length === 0;
  const base = `/dashboard/${clubToken}`;

  const venueTypes = Array.from(new Set(venues.map((v) => v.venue_type).filter(Boolean))).sort();
  const boroughs = Array.from(new Set(venues.map((v) => v.borough).filter((b): b is string => !!b))).sort();

  const entries: OutreachEntry[] = venues.map((v) => {
    const address = [v.address_line_1, v.address_line_2, v.postcode].filter(Boolean).join(", ");
    return {
      key: v.venue_id,
      searchText: [
        v.name,
        v.venue_type,
        v.borough ?? "",
        v.postcode ?? "",
        v.best_for.join(" "),
        v.tags.join(" "),
      ].join(" "),
      filterValues: { venueType: v.venue_type, borough: v.borough ?? "" },
      sortValues: { rating: v.rating ?? -1 },
      nameForSort: v.name,
      sponsored: v.sponsored,
      card: (
        <EntryCard
          key={v.venue_id}
          clubToken={clubToken}
          club_id={club.club_id}
          entryId={v.venue_id}
          initials={v.name.slice(0, 2).toUpperCase()}
          imageUrl={v.hero_image_url}
          title={v.name}
          subtitle={`${v.venue_type}${v.borough ? ` · ${v.borough}` : ""}`}
          tags={[]}
          isNew={isRecent(v.created_at)}
          sponsored={v.sponsored}
          detail={[
            { label: "Venue type", value: v.venue_type || "—" },
            ...(address ? [{ label: "Address", value: address }] : []),
            ...(v.nearest_station ? [{ label: "Nearest station", value: v.nearest_station }] : []),
            { label: "Booking required", value: v.booking_required ? "Yes" : "No" },
            { label: "Walk-ins allowed", value: v.walk_ins_allowed ? "Yes" : "No" },
            ...(v.price_band ? [{ label: "Price band", value: v.price_band }] : []),
            ...(v.rating != null ? [{ label: "Rating", value: `${v.rating}/5` }] : []),
            { label: "Verified by The NBRH", value: v.verified_by_nbrh ? "Yes" : "Not yet verified" },
            { label: "Best for", value: v.best_for.join(", ") || "—" },
            ...(v.venue_description_long ? [{ label: "About", value: v.venue_description_long }] : []),
            ...(v.website_url ? [{ label: "Website", value: v.website_url }] : []),
            ...(v.instagram_handle ? [{ label: "Instagram", value: v.instagram_handle }] : []),
            ...(v.contact_email ? [{ label: "Email", value: v.contact_email }] : []),
            ...(v.contact_phone ? [{ label: "Phone", value: v.contact_phone }] : []),
          ]}
          consentNote={
            v.contact_email || v.contact_phone
              ? undefined
              : "Direct contact isn't listed for this venue — let The NBRH make the introduction."
          }
          actions={[
            ...(v.booking_url
              ? [{ action_key: "reach_out_yourself", label: `Book ${v.name} yourself`, colour: "black" as const, token_cost: 0, href: v.booking_url }]
              : v.website_url
                ? [{ action_key: "reach_out_yourself", label: `Visit ${v.name}'s website`, colour: "black" as const, token_cost: 0, href: v.website_url }]
                : []),
            { action_key: "club_outreach", label: `We'll set it up with ${v.name}`, colour: "pink" as const, token_cost: 2 },
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
          placeholder="Search venues by name, type, or borough…"
          filters={[
            { key: "venueType", label: "Venue type", values: venueTypes },
            { key: "borough", label: "Borough", values: boroughs },
          ]}
          sortOptions={[
            { key: "rating", label: "Highest rated" },
            { key: "name", label: "Name (A–Z)" },
          ]}
        />
      )}
    </div>
  );
}

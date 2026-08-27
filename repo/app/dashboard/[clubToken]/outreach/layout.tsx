import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { hasPaidAccess } from "@/lib/types";
import { SectionTabDropdown } from "@/components/section-tab-dropdown";

const TABS = [
  { slug: "players", label: "Players" },
  { slug: "people", label: "People" },
  { slug: "brands", label: "Brands & Businesses" },
  { slug: "influencers", label: "Influencers" },
  { slug: "sponsorship", label: "Sponsorship & Funding" },
  { slug: "clubs", label: "Clubs" },
  { slug: "suppliers", label: "Suppliers" },
  { slug: "social-venues", label: "Social Venues" },
];

// Locked on the Free plan (Kennedy's correction, 25 Aug — was originally
// Players/People/Clubs, now swapped): Brands & Businesses, Influencers,
// and Sponsorship & Funding are locked; Players, People, and Clubs stay
// open on Free. Suppliers and Social Venues (added 27 Aug) are locked on
// the same reasoning — both are commercial-partner categories, not a
// Players/People/Clubs one.
const LOCKED_SLUGS = new Set(["brands", "influencers", "sponsorship", "suppliers", "social-venues"]);

export default async function OutreachLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clubToken: string }>;
}) {
  const { clubToken } = await params;
  const db = getAdapter();
  const club = await db.getClubByToken(clubToken);
  if (!club) notFound();
  const locked = !hasPaidAccess(club.plan_tier);

  const [players, people, brands, influencers, sponsorships, directory, suppliers, socialVenues] = await Promise.all([
    db.getPlayers(),
    db.getPeople(),
    db.getBrands(),
    db.getInfluencers(),
    db.getSponsorships(),
    db.getClubsDirectory(),
    db.getSuppliers(),
    db.getSocialVenues(),
  ]);
  const counts: Record<string, number> = {
    players: players.length,
    people: people.length,
    brands: brands.length,
    influencers: influencers.length,
    sponsorship: sponsorships.length,
    clubs: directory.length,
    suppliers: suppliers.length,
    "social-venues": socialVenues.length,
  };

  return (
    <div>
      <SectionTabDropdown
        basePath={`/dashboard/${clubToken}/outreach`}
        tabs={TABS.map((t) => ({
          slug: t.slug,
          label: t.label,
          count: counts[t.slug],
          locked: locked && LOCKED_SLUGS.has(t.slug),
        }))}
      />

      {children}
    </div>
  );
}

import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
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

/**
 * Outreach no longer gates any subsection on plan tier (Kennedy's
 * request, 27 Aug fourth follow-up: "completely remove the padlocked
 * and locked elements for the free version... everything should be
 * accessible and nothing is paywalled anymore"). Every subsection —
 * including the ones that used to be locked (Brands & Businesses,
 * Influencers, Sponsorship & Funding, Suppliers, Social Venues) — is now
 * open to every club regardless of tier. The token system is the only
 * thing that limits what a club can do with what it sees here.
 */
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
        }))}
      />

      {children}
    </div>
  );
}

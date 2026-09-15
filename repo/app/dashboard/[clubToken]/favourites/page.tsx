import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { EmptyState } from "@/components/empty-state";
import { FavouriteRowItem } from "@/components/favourite-row-item";
import type { ActionOption } from "@/components/action-popup";
import type { DataAdapter } from "@/lib/data";
import type { FavouriteRow } from "@/lib/types";

/**
 * Real, human-readable label per stored category — matches the
 * favouriteCategory strings passed into EntryCard across every Outreach
 * page, plus "trending" from TrendingCard. Order here is also the
 * section display order on this page.
 */
const CATEGORY_LABEL: Record<string, string> = {
  player: "Players",
  person: "People",
  brand: "Brands & Businesses",
  influencer: "Influencers",
  club: "Clubs",
  supplier: "Suppliers",
  social_venue: "Social Venues",
  sponsorship: "Sponsorship & Funding",
  trending: "Trending Topics",
};

const CATEGORY_ORDER = Object.keys(CATEGORY_LABEL);

/**
 * Builds the real action options for one favourite (Kennedy's request,
 * 10 Sep: "when the saved item is clicked, instead of going to the sub
 * section, can you reveal the relevant pop up that shows the action
 * button options"). Mirrors each category's own real action construction
 * on its Outreach page exactly — same action_key/label/token_cost logic,
 * copied deliberately rather than abstracted into a shared helper both
 * places call, since keeping this page's own copy explicit makes it
 * obvious if the two ever need to diverge for a page-specific reason.
 *
 * If the real underlying item can no longer be found (deleted from the
 * sheet since it was favourited), falls back to a single generic
 * "contact_us" option built from the saved snapshot — Kennedy's explicit
 * decision, 10 Sep, since there's no live data left to build the exact
 * real options from at that point.
 */
async function resolveActionsFor(
  db: DataAdapter,
  fav: FavouriteRow,
  cache: Map<string, unknown[]>,
): Promise<ActionOption[]> {
  const genericFallback: ActionOption[] = [
    { action_key: "contact_us", label: `Ask us about "${fav.title}"`, colour: "pink", token_cost: 0 },
  ];

  async function getCached<T>(key: string, fetcher: () => Promise<T[]>): Promise<T[]> {
    if (!cache.has(key)) cache.set(key, await fetcher());
    return cache.get(key) as T[];
  }

  switch (fav.category) {
    case "player": {
      const players = await getCached("player", () => db.getPlayers());
      const p = players.find((x: any) => x.player_id === fav.item_id);
      if (!p) return genericFallback;
      return [{ action_key: "player_invite", label: "Invite them to trial with us", colour: "pink", token_cost: 1 }];
    }
    case "person": {
      const people = await getCached("person", () => db.getPeople());
      const p: any = people.find((x: any) => x.person_id === fav.item_id);
      if (!p) return genericFallback;
      const roleLabel = p.role.charAt(0).toUpperCase() + p.role.slice(1).replace(/_/g, " ");
      return [
        ...(p.direct_contact_url
          ? [{ action_key: "contact_directly", label: `Book ${p.name ?? `this ${roleLabel.toLowerCase()}`} yourself`, colour: "black" as const, token_cost: 0, href: p.direct_contact_url }]
          : []),
        { action_key: "person_request", label: `Book this ${roleLabel.toLowerCase()}`, colour: "pink", token_cost: 2 },
      ];
    }
    case "brand": {
      const brands = await getCached("brand", () => db.getBrands());
      const b: any = brands.find((x: any) => x.brand_id === fav.item_id);
      if (!b) return genericFallback;
      return [
        ...(b.website ? [{ action_key: "visit_website", label: `Visit ${b.name}'s website`, colour: "black" as const, token_cost: 0, href: b.website }] : []),
        {
          action_key: b.type === "corporate" ? "brand_outreach_corporate" : "brand_outreach_local",
          label: `We'll pitch ${b.name} for you`,
          colour: "pink",
          token_cost: 3,
        },
      ];
    }
    case "influencer": {
      const influencers = await getCached("influencer", () => db.getInfluencers());
      const inf: any = influencers.find((x: any) => x.influencer_id === fav.item_id);
      if (!inf) return genericFallback;
      return [
        ...(inf.direct_contact_url
          ? [{ action_key: "contact_directly", label: `Message ${inf.name.replace("@", "")} yourself`, colour: "black" as const, token_cost: 0, href: inf.direct_contact_url }]
          : []),
        { action_key: "influencer_outreach", label: `We'll reach out to ${inf.name.replace("@", "")}`, colour: "pink", token_cost: 3 },
      ];
    }
    case "club": {
      const directory = await getCached("club", () => db.getClubsDirectory());
      const c: any = directory.find((x: any) => x.directory_id === fav.item_id);
      if (!c) return genericFallback;
      return [
        ...(c.public_contact_url
          ? [{ action_key: "reach_out_yourself", label: `Message ${c.name} yourself`, colour: "black" as const, token_cost: 0, href: c.public_contact_url }]
          : []),
        { action_key: "club_outreach", label: `We'll set it up with ${c.name}`, colour: "pink", token_cost: 2 },
      ];
    }
    case "supplier": {
      const suppliers = await getCached("supplier", () => db.getSuppliers());
      const s: any = suppliers.find((x: any) => x.supplier_id === fav.item_id);
      if (!s) return genericFallback;
      return [
        ...(s.source_url ? [{ action_key: "visit_website", label: `Visit ${s.name}'s website`, colour: "black" as const, token_cost: 0, href: s.source_url }] : []),
        { action_key: "supplier_outreach", label: `We'll reach out to ${s.name} for you`, colour: "pink", token_cost: 1 },
      ];
    }
    case "social_venue": {
      const venues = await getCached("social_venue", () => db.getSocialVenues());
      const v: any = venues.find((x: any) => x.venue_id === fav.item_id);
      if (!v) return genericFallback;
      return [
        ...(v.booking_url
          ? [{ action_key: "reach_out_yourself", label: `Book ${v.name} yourself`, colour: "black" as const, token_cost: 0, href: v.booking_url }]
          : v.website_url
            ? [{ action_key: "reach_out_yourself", label: `Visit ${v.name}'s website`, colour: "black" as const, token_cost: 0, href: v.website_url }]
            : []),
        { action_key: "venue_outreach", label: `We'll set it up with ${v.name}`, colour: "pink", token_cost: 2 },
      ];
    }
    case "sponsorship": {
      const sponsorships = await getCached("sponsorship", () => db.getSponsorships());
      const sp: any = sponsorships.find((x: any) => x.opportunity_id === fav.item_id);
      if (!sp) return genericFallback;
      const complex = /grant|active communities/i.test(sp.title) || sp.eligibility_tags.length > 2;
      return [
        ...(sp.apply_url ? [{ action_key: "apply_yourself", label: "Apply for this yourself", colour: "black" as const, token_cost: 0, href: sp.apply_url }] : []),
        {
          action_key: complex ? "sponsorship_apply_complex" : "sponsorship_apply",
          label: sp.amount ? `Get us this ${sp.amount}` : "Apply on our behalf",
          colour: "pink",
          token_cost: 3,
        },
      ];
    }
    case "trending":
      // Trending Topics has no "we'll do it for you" action at all on its
      // own card, just the free "Read the full story" link — same real
      // behaviour here.
      return fav.href
        ? [{ action_key: "view_opportunity", label: "Read the full story", colour: "black", token_cost: 0, href: fav.href }]
        : genericFallback;
    default:
      return genericFallback;
  }
}

/**
 * Favourites (Kennedy's request, 9 Sep: "a heart... saved to the club's
 * individual CHOS page... see all their favourite items saved as a
 * list... sorted into sections"). Linked from the header's hamburger
 * menu (components/header-menu.tsx), not the main sidebar nav — same
 * treatment as Inbox/Membership, a personal per-club page rather than
 * one of the three main sections.
 *
 * Every row's title/subtitle shows the snapshot captured at save time,
 * not a live re-fetch — see FavouriteRowItem's own doc comment for why.
 * Clicking a row (10 Sep follow-up) opens the real action popup though,
 * built from a fresh, live lookup of the item via resolveActionsFor
 * above — the display snapshot and the action options are deliberately
 * different data: the snapshot must survive the original row being
 * deleted, but the actions genuinely need to be correct right now, not
 * whatever was true when this was favourited.
 */
export default async function Favourites({
  params,
}: {
  params: Promise<{ clubToken: string }>;
}) {
  const { clubToken } = await params;
  const db = getAdapter();
  const club = await db.getClubByToken(clubToken);
  if (!club) notFound();

  const favourites = await db.getFavourites(club.club_id);
  const base = `/dashboard/${clubToken}`;

  const byCategory = new Map<string, typeof favourites>();
  for (const f of favourites) {
    const list = byCategory.get(f.category) ?? [];
    list.push(f);
    byCategory.set(f.category, list);
  }

  // Only fetches a category's full data when at least one favourite
  // actually needs it — a club with 2 saved players and nothing else
  // never triggers getBrands()/getSuppliers()/etc.
  const cache = new Map<string, unknown[]>();
  const actionsById = new Map<string, ActionOption[]>();
  for (const f of favourites) {
    actionsById.set(`${f.category}:${f.item_id}`, await resolveActionsFor(db, f, cache));
  }

  return (
    <div className="card outreach-card">
      <h2>
        Favourites <span className="count-badge">{favourites.length} saved</span>
      </h2>
      <p style={{ color: "var(--dim)", fontSize: "0.9rem", marginTop: -8, marginBottom: 20, maxWidth: "58ch" }}>
        Everything your club has saved, in one place. Tap the heart on any player, business,
        venue, or story to add it here.
      </p>

      {favourites.length === 0 ? (
        <EmptyState
          message="No favourites yet — tap the heart on anything you'd like to come back to."
          cta="Start with Outreach"
          href={`${base}/outreach/players`}
        />
      ) : (
        CATEGORY_ORDER.filter((cat) => byCategory.has(cat)).map((cat) => (
          <div key={cat} className="favourite-section">
            <h3 className="favourite-section-title">
              {CATEGORY_LABEL[cat]} <span className="count-badge">{byCategory.get(cat)!.length}</span>
            </h3>
            <div className="favourite-list">
              {byCategory.get(cat)!.map((f) => (
                <FavouriteRowItem
                  key={`${cat}-${f.item_id}`}
                  clubToken={clubToken}
                  club_id={club.club_id}
                  category={cat}
                  item_id={f.item_id}
                  title={f.title}
                  subtitle={f.subtitle}
                  href={f.href}
                  isFirstTokenEncounter={false}
                  actions={actionsById.get(`${cat}:${f.item_id}`) ?? []}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Calendar, Briefcase, Sparkles, Heart, type LucideIcon } from "lucide-react";
/**
 * POS's own nav — deliberately separate from NavLinks/TabBar
 * (components/nav.tsx), not a mode bolted onto them. Those two are
 * genuinely CHOS-shaped: Outreach/Workspace/Tools/Services, plan-tier
 * gating, club-token hrefs. POS has a completely different 5-section
 * shape (Kennedy, 15 Sep) with no plan tiers at all, so branching all
 * of that into the same component would mean threading player-vs-club
 * conditionals through code that's already dense for its own real
 * purpose. Reuses the same structural CSS classes (.sidebar, .navlink,
 * .tabbar, etc.) since those are generic, not CHOS-specific.
 *
 * playerToken is OPTIONAL — every link here builds either
 * /players/[token]/... (the personal tree) or plain /players/... (the
 * public tree) depending on whether one is passed.
 *
 * All 5 sections show regardless of token — the "For You" section
 * (slug/route/internal naming stays "recommendations" throughout the
 * codebase — Kennedy's 15 Sep rename was for the displayed label only,
 * not the URL or file structure, to avoid breaking any existing links
 * for a pure display-copy change) has no
 * meaningful MATCHES without a real player profile, but the section
 * itself is still real — it just prompts a visitor with no token to
 * get started rather than not existing in the nav at all.
 *
 * Search's slug is now plain "search" (15 Sep rewrite), not
 * "search/activities" — Search moved from a dynamic [category] route
 * segment to a static page reading ?category= as a query string (see
 * app/players/(browse)/search/page.tsx's own doc comment for why:
 * the dynamic-segment version produced a confirmed, genuine runtime
 * 404 in production despite a clean build). With no category in the
 * path at all, "Activities" is simply Search's own default when no
 * query param is present, and this nav link needs nothing extra
 * appended.
 */
const POS_SECTIONS: { slug: string; label: string; icon: LucideIcon }[] = [
  { slug: "", label: "Home", icon: Home },
  { slug: "search", label: "Search", icon: Search },
  { slug: "calendar", label: "Calendar", icon: Calendar },
  { slug: "jobs", label: "Jobs", icon: Briefcase },
  { slug: "recommendations", label: "For You", icon: Sparkles },
];

function href(playerToken: string | undefined, slug: string) {
  const base = playerToken ? `/players/${playerToken}` : "/players";
  return slug ? `${base}/${slug}` : base;
}

export function PlayerNavLinks({ playerToken }: { playerToken?: string }) {
  const pathname = usePathname();
  const isActive = (slug: string) => pathname === href(playerToken, slug);

  return (
    <>
      {POS_SECTIONS.map((s) => (
        <Link
          key={s.slug || "home"}
          className="navlink"
          href={href(playerToken, s.slug)}
          aria-current={isActive(s.slug) ? "page" : undefined}
        >
          <s.icon size={15} aria-hidden />
          {s.label}
        </Link>
      ))}
    </>
  );
}

export function PlayerTabBar({ playerToken }: { playerToken?: string }) {
  const pathname = usePathname();
  const isActive = (slug: string) => pathname === href(playerToken, slug);

  return (
    <nav className="tabbar" aria-label="Sections">
      {POS_SECTIONS.map((s) => (
        <Link key={s.slug || "home"} href={href(playerToken, s.slug)} aria-current={isActive(s.slug) ? "page" : undefined}>
          <s.icon size={17} aria-hidden />
          {s.label}
        </Link>
      ))}
    </nav>
  );
}

/**
 * Player-side equivalent of PageTitle (components/greeting.tsx) — a
 * separate component rather than widening PageTitle's own
 * SECTION_TITLES map, since that map's labels (Outreach/Workspace/
 * Tools) and section depth assumptions are genuinely CHOS-shaped; POS's
 * five sections (Home/Search/Calendar/Jobs/Recommendations) are a
 * different set entirely, not a superset or variant of them.
 *
 * Reads the section from whichever URL depth is actually present —
 * /players/[token]/section has it at segments[2], the public
 * /players/section has it at segments[1], since there's no token
 * segment in between. Checking both rather than assuming one fixed
 * depth is what makes this work correctly on either tree.
 */
const PLAYER_SECTION_TITLES: Record<string, { label: string; Icon: LucideIcon }> = {
  search: { label: "Search", Icon: Search },
  calendar: { label: "Calendar", Icon: Calendar },
  jobs: { label: "Jobs", Icon: Briefcase },
  recommendations: { label: "For You", Icon: Sparkles },
  favourites: { label: "Favourites", Icon: Heart },
};

/**
 * Home route special case (18 Sep, Kennedy: "on the POS, on the home
 * page where it says home, can you replace that with the 'Welcome to
 * The NBRH' Title that is below, essentially moving that heading on
 * the page and replacing it with where the 'Home' is"). Both Home
 * pages (app/players/(browse)/page.tsx for signed-out, app/players/
 * [playerToken]/page.tsx for signed-in) used to render their own
 * separate "Welcome [back] to The NBRH" <h1> inside the page body,
 * below this shared deck-title slot, which just said "Home" — moved
 * up into this slot instead, and the pages' own duplicate heading
 * removed (see each page's own comment). "Welcome back" (signed-in,
 * token in the URL) vs "Welcome" (signed-out, public /players root)
 * mirrors the copy difference the two pages already had.
 */
function isHomeRoute(segments: string[]): "signed-in" | "signed-out" | false {
  // /players → segments ["players"]. /players/[token] → segments
  // ["players", token] with nothing further (a 3rd segment means a
  // sub-page like /players/[token]/search, not Home itself).
  if (segments.length === 1 && segments[0] === "players") return "signed-out";
  if (segments.length === 2 && segments[0] === "players") return "signed-in";
  return false;
}

export function PlayerPageTitle() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const home = isHomeRoute(segments);
  if (home) {
    return (
      <>
        Welcome {home === "signed-in" ? "back " : ""}to{" "}
        <em style={{ color: "var(--pink)", fontStyle: "normal" }}>The NBRH</em>
      </>
    );
  }
  const section = PLAYER_SECTION_TITLES[segments[1]] ? segments[1] : segments[2];
  const sectionTitle = section ? PLAYER_SECTION_TITLES[section] : undefined;
  if (sectionTitle) {
    const { label, Icon } = sectionTitle;
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
        <Icon size={26} aria-hidden />
        {label}
      </span>
    );
  }
  return <>Home</>;
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Calendar, Briefcase, Sparkles, Heart, type LucideIcon } from "lucide-react";
import { Greeting } from "@/components/greeting";
import { ThemeToggle } from "@/components/theme-toggle";
import { usePlayerSession } from "@/components/player-session";
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
  // ["players", token] with nothing further.
  //
  // BUG FOUND 18 Sep (Kennedy's real screenshots — a POS subsection
  // page was rendering the Home title and Home's own header treatment
  // instead of its own) — the original version of this check was just
  // segments.length === 2 && segments[0] === "players", which also
  // matches /players/jobs, /players/calendar, /players/search, etc.
  // (["players", "jobs"] is ALSO length 2) on the public, un-tokenised
  // tree. There was no way to tell "a real player token" apart from "a
  // known section slug" by segment count alone. Fixed by checking
  // segments[1] against PLAYER_SECTION_TITLES' own real slug list — if
  // it's a known section, this is that section's own subpage, not
  // Home, regardless of length; only an unrecognised segments[1] (a
  // genuine opaque token, not a section name) still counts as the
  // signed-in Home route.
  if (segments.length === 1 && segments[0] === "players") return "signed-out";
  if (segments.length === 2 && segments[0] === "players" && !PLAYER_SECTION_TITLES[segments[1]]) {
    return "signed-in";
  }
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

/**
 * Whole deck-head ROW for POS (18 Sep follow-up, Kennedy: "the only
 * header in the POS i wanted changed was the home page header...
 * everything else in search, calendar, job etc, should have stayed the
 * same"). The 18 Sep same-day change had removed the "Hello"/date
 * eyebrow and moved the theme toggle under the carousel — correct for
 * Home, but it lived in the two POS layout files (app/players/(browse)/
 * layout.tsx, app/players/[playerToken]/layout.tsx), which wrap EVERY
 * POS page, not just Home — so Search/Calendar/Jobs/Recommendations
 * all lost their eyebrow and date too, which was never asked for.
 *
 * This component owns the whole header row and branches on the exact
 * route (reusing isHomeRoute, the same check PlayerPageTitle already
 * uses) so the layout files themselves don't need their own
 * conditional — Home gets the no-eyebrow / toggle-under-carousel
 * treatment, every other page gets back its original eyebrow "Hello,
 * {name}", unchanged from before 18 Sep. The date line that used to sit
 * next to the toggle here is removed entirely (19 Sep, Kennedy: "remove
 * the date from the POS & CHOS").
 *
 * NAME RESOLUTION (19 Sep, accessibility/personalisation pass) — Kennedy:
 * "personalise it, so it should say hello, Kennedy" + "fix it everywhere
 * that eyebrow shows, always resolve and show the real first name when
 * signed in." Before this, playerName only ever arrived as a prop from
 * app/players/[playerToken]/layout.tsx (the personal-token tree) — the
 * PUBLIC tree (app/players/(browse)/layout.tsx: /players/search,
 * /players/calendar, etc., no token in the URL) never passed one at all,
 * so a player who signed in there by EMAIL (usePlayerSession, the same
 * identity PlayerHeader/PlayerHome already use to show "Hey, {name}")
 * still saw a bare "Hello" on every page except Home. This component is
 * already a client component (usePathname), so it now reads
 * usePlayerSession() itself and prefers the prop (the token tree's own
 * server-known name, when present) over the session's player name —
 * either source resolves to the real signed-in name; only a genuinely
 * signed-out visitor with no token still sees plain "Hello", which is
 * correct (there's no name to show).
 */
export function PlayerDeckHeader({ playerName }: { playerName?: string | null }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const home = isHomeRoute(segments);
  const { player } = usePlayerSession();
  const resolvedName = playerName ?? player?.name ?? null;
  const firstName = resolvedName?.split(" ")[0] ?? null;

  if (home) {
    return (
      <>
        <div className="deck-toggle-row">
          <ThemeToggle />
        </div>
        <header className="deck-head">
          <h1 className="deck-title">
            <PlayerPageTitle />
          </h1>
        </header>
      </>
    );
  }

  return (
    <header className="deck-head">
      <div>
        <p className="eyebrow">
          <Greeting />
          {firstName ? `, ${firstName}` : ""}
        </p>
        <h1 className="deck-title">
          <PlayerPageTitle />
        </h1>
      </div>
      <div className="deck-head-controls">
        <ThemeToggle />
      </div>
    </header>
  );
}

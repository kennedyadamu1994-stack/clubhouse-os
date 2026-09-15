"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Calendar, Briefcase, Sparkles, type LucideIcon } from "lucide-react";
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
 * All 5 sections show regardless of token (15 Sep fix — Kennedy: "the
 * Recommendations should be visible here too," reversing the earlier
 * personalOnly-hides-it-entirely choice). Recommendations has no
 * meaningful MATCHES without a real player profile, but the section
 * itself is still real — it just prompts a visitor with no token to
 * get started rather than not existing in the nav at all; see
 * app/players/(browse)/recommendations/page.tsx for that prompt.
 */
const POS_SECTIONS: { slug: string; label: string; icon: LucideIcon }[] = [
  { slug: "", label: "Home", icon: Home },
  { slug: "search/activities", label: "Search", icon: Search },
  { slug: "calendar", label: "Calendar", icon: Calendar },
  { slug: "jobs", label: "Jobs", icon: Briefcase },
  { slug: "recommendations", label: "Recommendations", icon: Sparkles },
];

function href(playerToken: string | undefined, slug: string) {
  const base = playerToken ? `/players/${playerToken}` : "/players";
  return slug ? `${base}/${slug}` : base;
}

export function PlayerNavLinks({ playerToken }: { playerToken?: string }) {
  const pathname = usePathname();
  const base = playerToken ? `/players/${playerToken}` : "/players";

  // Search's own sub-pages (search/activities, search/clubs, etc. — see
  // the Search split, Kennedy 15 Sep) should all still highlight the one
  // "Search" nav entry, not just an exact match on search/activities.
  const isActive = (slug: string) =>
    slug === "search/activities" ? pathname.startsWith(`${base}/search`) : pathname === href(playerToken, slug);

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
  const base = playerToken ? `/players/${playerToken}` : "/players";
  const isActive = (slug: string) =>
    slug === "search/activities" ? pathname.startsWith(`${base}/search`) : pathname === href(playerToken, slug);

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
  recommendations: { label: "Recommendations", Icon: Sparkles },
};

export function PlayerPageTitle() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
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

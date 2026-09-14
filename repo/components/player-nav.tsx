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
 */
const POS_SECTIONS: { slug: string; label: string; icon: LucideIcon }[] = [
  { slug: "", label: "Home", icon: Home },
  { slug: "search/activities", label: "Search", icon: Search },
  { slug: "calendar", label: "Calendar", icon: Calendar },
  { slug: "jobs", label: "Jobs", icon: Briefcase },
  { slug: "recommendations", label: "Recommendations", icon: Sparkles },
];

function href(playerToken: string, slug: string) {
  return slug ? `/players/${playerToken}/${slug}` : `/players/${playerToken}`;
}

export function PlayerNavLinks({ playerToken }: { playerToken: string }) {
  const pathname = usePathname();
  const base = `/players/${playerToken}`;

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

export function PlayerTabBar({ playerToken }: { playerToken: string }) {
  const pathname = usePathname();
  const base = `/players/${playerToken}`;
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
  // segments[0..1] are always "players"/"[playerToken]" — segments[2] is the top-level section, when present.
  const section = segments[2];
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

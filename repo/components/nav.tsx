"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

/**
 * OUTREACH subsections are listed individually under a collapsible "Outreach"
 * header, matching the grouped-nav pattern in the original concept — but
 * expandable/collapsible per Kennedy's edit, so the sidebar doesn't force
 * all six sub-links onto screen at once.
 */
const OUTREACH_SUBS = [
  { slug: "outreach/players", label: "Players" },
  { slug: "outreach/people", label: "People" },
  { slug: "outreach/brands", label: "Brands & Businesses" },
  { slug: "outreach/influencers", label: "Influencers" },
  { slug: "outreach/sponsorship", label: "Sponsorship & Funding" },
  { slug: "outreach/clubs", label: "Clubs" },
];

const LATER_SECTIONS = [
  { slug: "workspace", label: "Workspace" },
  { slug: "tools", label: "Tools" },
  { slug: "services", label: "Services" },
];

function href(clubToken: string, slug: string) {
  return slug ? `/dashboard/${clubToken}/${slug}` : `/dashboard/${clubToken}`;
}

export function NavLinks({ clubToken }: { clubToken: string }) {
  const pathname = usePathname();
  const base = `/dashboard/${clubToken}`;
  const isOverview = pathname === base || pathname.startsWith(`${base}/priorities`);
  const isOutreach = (slug: string) => pathname === href(clubToken, slug);
  const onOutreachPage = pathname.startsWith(`${base}/outreach`);

  // Defaults open when already inside Outreach, so navigating there never
  // hides the very links you're using; collapsible otherwise to keep the
  // sidebar short when browsing other sections.
  const [outreachOpen, setOutreachOpen] = useState(onOutreachPage);

  return (
    <>
      <Link className="navlink" href={base} aria-current={isOverview ? "page" : undefined}>
        <span className="navdot" aria-hidden />
        Overview
      </Link>

      <button
        className="navlab navlab-toggle"
        onClick={() => setOutreachOpen((v) => !v)}
        aria-expanded={outreachOpen}
        aria-controls="outreach-sublinks"
      >
        Outreach
        <span className="navlab-chevron" aria-hidden>
          {outreachOpen ? "−" : "+"}
        </span>
      </button>
      {outreachOpen && (
        <div id="outreach-sublinks">
          {OUTREACH_SUBS.map((s) => (
            <Link
              key={s.slug}
              className="navlink sub"
              href={href(clubToken, s.slug)}
              aria-current={isOutreach(s.slug) ? "page" : undefined}
            >
              <span className="navdot" aria-hidden />
              {s.label}
            </Link>
          ))}
        </div>
      )}

      <p className="navlab">Workspace</p>
      {LATER_SECTIONS.map((s) => (
        <Link key={s.slug} className="navlink" href={base} aria-disabled>
          <span className="navdot" aria-hidden />
          {s.label}
          <span className="soon">next</span>
        </Link>
      ))}
    </>
  );
}

export function TabBar({ clubToken }: { clubToken: string }) {
  const pathname = usePathname();
  const base = `/dashboard/${clubToken}`;
  const isOverview = pathname === base || pathname.startsWith(`${base}/priorities`);
  const isOutreach = pathname.startsWith(`${base}/outreach`);

  return (
    <nav className="tabbar" aria-label="Sections">
      <Link href={base} aria-current={isOverview ? "page" : undefined}>
        <span className="navdot" aria-hidden />
        Overview
      </Link>
      <Link href={href(clubToken, "outreach/players")} aria-current={isOutreach ? "page" : undefined}>
        <span className="navdot" aria-hidden />
        Outreach
      </Link>
      <Link href={base}>
        <span className="navdot" aria-hidden />
        Workspace
      </Link>
      <Link href={base}>
        <span className="navdot" aria-hidden />
        Tools
      </Link>
      <Link href={base}>
        <span className="navdot" aria-hidden />
        Services
      </Link>
    </nav>
  );
}

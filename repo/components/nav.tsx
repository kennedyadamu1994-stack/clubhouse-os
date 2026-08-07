"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

/**
 * OUTREACH, WORKSPACE, and TOOLS subsections are each listed under their
 * own collapsible header, matching the grouped-nav pattern in the original
 * concept — expandable/collapsible per Kennedy's edit, so the sidebar
 * doesn't force every sub-link onto screen at once.
 */
const OUTREACH_SUBS = [
  { slug: "outreach/players", label: "Players" },
  { slug: "outreach/people", label: "People" },
  { slug: "outreach/brands", label: "Brands & Businesses" },
  { slug: "outreach/influencers", label: "Influencers" },
  { slug: "outreach/sponsorship", label: "Sponsorship & Funding" },
  { slug: "outreach/clubs", label: "Clubs" },
];

const WORKSPACE_SUBS = [
  { slug: "workspace/insights", label: "Insights" },
  { slug: "workspace/opportunities", label: "Opportunities" },
  { slug: "workspace/resources", label: "Resources" },
  { slug: "workspace/faq", label: "FAQ" },
  { slug: "workspace/copy-generator", label: "Copy Generator" },
];

const TOOLS_SUBS = [
  { slug: "tools/contact", label: "Contact Us" },
  { slug: "tools/find", label: "Find" },
  { slug: "tools/calendar", label: "Calendar" },
];

const LATER_SECTIONS = [{ slug: "services", label: "Services" }];

function href(clubToken: string, slug: string) {
  return slug ? `/dashboard/${clubToken}/${slug}` : `/dashboard/${clubToken}`;
}

export function NavLinks({ clubToken }: { clubToken: string }) {
  const pathname = usePathname();
  const base = `/dashboard/${clubToken}`;
  const isOverview = pathname === base || pathname.startsWith(`${base}/priorities`);
  const isSub = (slug: string) => pathname === href(clubToken, slug);
  const onOutreachPage = pathname.startsWith(`${base}/outreach`);
  const onWorkspacePage = pathname.startsWith(`${base}/workspace`);
  const onToolsPage = pathname.startsWith(`${base}/tools`);

  // Defaults open when already inside that section, so navigating there
  // never hides the very links you're using; collapsible otherwise to keep
  // the sidebar short when browsing other sections.
  const [outreachOpen, setOutreachOpen] = useState(onOutreachPage);
  const [workspaceOpen, setWorkspaceOpen] = useState(onWorkspacePage);
  const [toolsOpen, setToolsOpen] = useState(onToolsPage);

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
              aria-current={isSub(s.slug) ? "page" : undefined}
            >
              <span className="navdot" aria-hidden />
              {s.label}
            </Link>
          ))}
        </div>
      )}

      <button
        className="navlab navlab-toggle"
        onClick={() => setWorkspaceOpen((v) => !v)}
        aria-expanded={workspaceOpen}
        aria-controls="workspace-sublinks"
      >
        Workspace
        <span className="navlab-chevron" aria-hidden>
          {workspaceOpen ? "−" : "+"}
        </span>
      </button>
      {workspaceOpen && (
        <div id="workspace-sublinks">
          {WORKSPACE_SUBS.map((s) => (
            <Link
              key={s.slug}
              className="navlink sub"
              href={href(clubToken, s.slug)}
              aria-current={isSub(s.slug) ? "page" : undefined}
            >
              <span className="navdot" aria-hidden />
              {s.label}
            </Link>
          ))}
        </div>
      )}

      <button
        className="navlab navlab-toggle"
        onClick={() => setToolsOpen((v) => !v)}
        aria-expanded={toolsOpen}
        aria-controls="tools-sublinks"
      >
        Tools
        <span className="navlab-chevron" aria-hidden>
          {toolsOpen ? "−" : "+"}
        </span>
      </button>
      {toolsOpen && (
        <div id="tools-sublinks">
          {TOOLS_SUBS.map((s) => (
            <Link
              key={s.slug}
              className="navlink sub"
              href={href(clubToken, s.slug)}
              aria-current={isSub(s.slug) ? "page" : undefined}
            >
              <span className="navdot" aria-hidden />
              {s.label}
            </Link>
          ))}
        </div>
      )}

      <p className="navlab">Coming soon</p>
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
  const isWorkspace = pathname.startsWith(`${base}/workspace`);
  const isTools = pathname.startsWith(`${base}/tools`);

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
      <Link href={href(clubToken, "workspace/insights")} aria-current={isWorkspace ? "page" : undefined}>
        <span className="navdot" aria-hidden />
        Workspace
      </Link>
      <Link href={href(clubToken, "tools/contact")} aria-current={isTools ? "page" : undefined}>
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

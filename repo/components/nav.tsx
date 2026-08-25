"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Home, Users, LayoutGrid, Wrench, Sparkles } from "lucide-react";

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
  { slug: "workspace/trending", label: "Trending Topics" },
  { slug: "workspace/opportunities", label: "Opportunities" },
  { slug: "workspace/perks", label: "Perks" },
  { slug: "workspace/resources", label: "Resources" },
  { slug: "workspace/faq", label: "FAQ" },
];

const TOOLS_SUBS = [
  { slug: "tools/contact", label: "Contact Us" },
  { slug: "tools/search", label: "Search" },
  { slug: "tools/map", label: "Map" },
  { slug: "tools/calendar", label: "Calendar" },
  { slug: "tools/insights", label: "What's happening" },
  { slug: "tools/copy-generator", label: "Copy Generator" },
];

function href(clubToken: string, slug: string) {
  return slug ? `/dashboard/${clubToken}/${slug}` : `/dashboard/${clubToken}`;
}

export function NavLinks({ clubToken }: { clubToken: string }) {
  const pathname = usePathname();
  const base = `/dashboard/${clubToken}`;
  const isOverview = pathname === base;
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
        <Home size={15} aria-hidden />
        Overview
      </Link>

      <button
        className="navlab navlab-toggle"
        onClick={() => setOutreachOpen((v) => !v)}
        aria-expanded={outreachOpen}
        aria-controls="outreach-sublinks"
      >
        <span className="navlab-label"><Users size={15} aria-hidden />Outreach</span>
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
              <span className="navlink-label">{s.label}</span>
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
        <span className="navlab-label"><LayoutGrid size={15} aria-hidden />Workspace</span>
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
              <span className="navlink-label">{s.label}</span>
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
        <span className="navlab-label"><Wrench size={15} aria-hidden />Tools</span>
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
              <span className="navlink-label">{s.label}</span>
            </Link>
          ))}
        </div>
      )}

      <Link
        className="navlink"
        href={href(clubToken, "services")}
        aria-current={pathname.startsWith(`${base}/services`) ? "page" : undefined}
      >
        <Sparkles size={15} aria-hidden />
        Services
      </Link>
    </>
  );
}

export function TabBar({ clubToken }: { clubToken: string }) {
  const pathname = usePathname();
  const base = `/dashboard/${clubToken}`;
  const isOverview = pathname === base;
  const isOutreach = pathname.startsWith(`${base}/outreach`);
  const isWorkspace = pathname.startsWith(`${base}/workspace`);
  const isTools = pathname.startsWith(`${base}/tools`);
  const isServices = pathname.startsWith(`${base}/services`);

  return (
    <nav className="tabbar" aria-label="Sections">
      <Link href={base} aria-current={isOverview ? "page" : undefined}>
        <Home size={17} aria-hidden />
        Overview
      </Link>
      <Link href={href(clubToken, "outreach/players")} aria-current={isOutreach ? "page" : undefined}>
        <Users size={17} aria-hidden />
        Outreach
      </Link>
      <Link href={href(clubToken, "workspace/trending")} aria-current={isWorkspace ? "page" : undefined}>
        <LayoutGrid size={17} aria-hidden />
        Workspace
      </Link>
      <Link href={href(clubToken, "tools/contact")} aria-current={isTools ? "page" : undefined}>
        <Wrench size={17} aria-hidden />
        Tools
      </Link>
      <Link href={href(clubToken, "services")} aria-current={isServices ? "page" : undefined}>
        <Sparkles size={17} aria-hidden />
        Services
      </Link>
    </nav>
  );
}

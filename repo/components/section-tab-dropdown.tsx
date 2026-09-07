"use client";

import { useRouter, usePathname } from "next/navigation";

export interface SectionTab {
  slug: string;
  label: string;
  count?: number;
}

/**
 * Replaces the old chip-row subsection nav (a <nav> of individual <Link>
 * chips) with a single dropdown, shared by the Outreach, Workspace, and
 * Tools layouts (Kennedy's request, 27 Aug: "instead of the boxes just
 * being there, can the options in each section be placed in one drop down
 * box with all the options in there instead per section").
 *
 * A native <select> rather than a custom-built listbox — it's a real form
 * control, so it's keyboard/screen-reader accessible for free, and it gets
 * the OS's native picker UI on mobile (the exact context Kennedy called
 * out: "especially in mobile mode"), which is more usable on a small
 * screen than any custom dropdown this app could build.
 *
 * Width intentionally comes from nothing but being a plain full-width block
 * at the same nesting level as the page's own .card/.outreach-card below it
 * — both sit directly inside .main with no extra side margin, so they
 * always share exactly the same outer width without hardcoding a value
 * that could drift out of sync (Kennedy's requirement: same width as the
 * results box below, especially on mobile).
 *
 * Reads the active slug from the URL itself (usePathname) rather than
 * requiring each server-component layout to compute and pass it down —
 * the three call sites (Outreach/Workspace/Tools layouts) are async server
 * components that already have enough to fetch without also doing
 * pathname parsing.
 */
export function SectionTabDropdown({
  basePath,
  tabs,
}: {
  basePath: string; // e.g. `/dashboard/${clubToken}/outreach`
  tabs: SectionTab[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const activeSlug = tabs.find((t) => pathname === `${basePath}/${t.slug}`)?.slug ?? tabs[0]?.slug;

  return (
    <div className="section-tab-dropdown-wrap">
      <select
        className="section-tab-dropdown"
        aria-label="Choose a subsection"
        value={activeSlug}
        onChange={(e) => router.push(`${basePath}/${e.target.value}`)}
      >
        {tabs.map((t) => (
          <option key={t.slug} value={t.slug}>
            {t.label}
            {t.count != null ? ` (${t.count})` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

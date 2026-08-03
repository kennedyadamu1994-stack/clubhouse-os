"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS = [
  { slug: "", label: "Overview", built: true },
  { slug: "outreach", label: "Outreach", built: false },
  { slug: "workspace", label: "Workspace", built: false },
  { slug: "tools", label: "Tools", built: false },
  { slug: "services", label: "Services", built: false },
];

function useCurrent(clubToken: string) {
  const pathname = usePathname();
  const base = `/dashboard/${clubToken}`;
  return (slug: string) => {
    const href = slug ? `${base}/${slug}` : base;
    return slug === "" ? pathname === base || pathname.startsWith(`${base}/priorities`) : pathname.startsWith(href);
  };
}

export function NavLinks({ clubToken }: { clubToken: string }) {
  const isCurrent = useCurrent(clubToken);
  return (
    <>
      {SECTIONS.map((s) => (
        <Link
          key={s.label}
          className="navlink"
          href={s.built ? (s.slug ? `/dashboard/${clubToken}/${s.slug}` : `/dashboard/${clubToken}`) : `/dashboard/${clubToken}`}
          aria-current={isCurrent(s.slug) ? "page" : undefined}
          aria-disabled={!s.built}
        >
          <span className="navdot" aria-hidden />
          {s.label}
          {!s.built && <span className="soon">next</span>}
        </Link>
      ))}
    </>
  );
}

export function TabBar({ clubToken }: { clubToken: string }) {
  const isCurrent = useCurrent(clubToken);
  return (
    <nav className="tabbar" aria-label="Sections">
      {SECTIONS.map((s) => (
        <Link
          key={s.label}
          href={s.built ? (s.slug ? `/dashboard/${clubToken}/${s.slug}` : `/dashboard/${clubToken}`) : `/dashboard/${clubToken}`}
          aria-current={isCurrent(s.slug) ? "page" : undefined}
        >
          <span className="navdot" aria-hidden />
          {s.label}
        </Link>
      ))}
    </nav>
  );
}

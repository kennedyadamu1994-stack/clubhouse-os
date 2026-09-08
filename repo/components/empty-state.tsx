import Link from "next/link";

/** The one reusable empty state (docs/components.md #6): names what's missing + one CTA. */
export function EmptyState({ message, cta, href }: { message: string; cta: string; href: string }) {
  return (
    <div className="empty">
      <p>{message}</p>
      <Link className="btn btn-pink" href={href}>
        {cta}
      </Link>
    </div>
  );
}

import Link from "next/link";
import { Inbox } from "lucide-react";
import { NBRH_LOGO_URL } from "@/lib/brand";

/**
 * Sticky app header, sitting above everything else including the sidebar
 * (Kennedy's request, 27 Aug: "It should sit above [the existing
 * deck-head], the logo should move into the header"). Spans the full
 * viewport width rather than living inside .main, since it needs to sit
 * above BOTH .sidebar and .main, not just the content column.
 *
 * The NBRH logo previously lived in the sidebar's own footer
 * (.sidefoot) — moved here per Kennedy's explicit instruction, so the
 * sidebar no longer renders it (see app/dashboard/[clubToken]/layout.tsx).
 *
 * Inbox icon links to the per-club Inbox page (Kennedy's request, 27
 * Aug — "there will be an inbox button" in the header), now with a real
 * unread-count badge sourced from getUnreadInboxCount() once Inbox's
 * read/unread ledger existed to read it from.
 *
 * "More elements might be added later" (Kennedy's own note) — this is
 * intentionally a simple flex row so a new icon/action slots in without
 * restructuring.
 */
export function AppHeader({ clubToken, unreadCount }: { clubToken: string; unreadCount: number }) {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        {/* eslint-disable-next-line @next/next/no-img-element -- external brand asset, not a static import */}
        <img src={NBRH_LOGO_URL} alt="The NBRH" className="app-header-logo" />
        <div className="app-header-actions">
          <Link
            href={`/dashboard/${clubToken}/inbox`}
            className="app-header-icon-btn"
            aria-label={unreadCount > 0 ? `Inbox, ${unreadCount} unread` : "Inbox"}
            title="Inbox"
          >
            <Inbox size={19} aria-hidden />
            {unreadCount > 0 && (
              <span className="app-header-badge" aria-hidden>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

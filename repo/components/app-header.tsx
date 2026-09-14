import Link from "next/link";
import { Inbox } from "lucide-react";
import { NBRH_LOGO_URL } from "@/lib/brand";
import { HeaderMenu } from "./header-menu";

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
 * Hamburger menu sits immediately before Inbox (Kennedy's request, 9
 * Sep: "a three line drop down bar... on the left of the inbox
 * button") — see components/header-menu.tsx for what's actually in it.
 *
 * "For Clubs" was static placeholder text (Kennedy, 9 Sep: wanted the
 * toggle concept flagged but explicitly said keep it non-interactive
 * until POS existed to link to). POS now exists (15 Sep) — this is a
 * real link to /players, POS's own landing page. Deliberately NOT a
 * direct link to the external onboarding widget's real URL on
 * thenbrh.co.uk — that URL was never confirmed (the widget's own old
 * redirect target, https://www.thenbrh.co.uk/my-nbrh, is a guess, not
 * a confirmed "this is the onboarding page's address"), so /players
 * is the one stable link both directions of the toggle point at,
 * and it can link out to the real widget once that's confirmed.
 *
 * "More elements might be added later" (Kennedy's own note) — this is
 * intentionally a simple flex row so a new icon/action slots in without
 * restructuring.
 */
export function AppHeader({ clubToken, unreadCount }: { clubToken: string; unreadCount: number }) {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="app-header-brand">
          {/* eslint-disable-next-line @next/next/no-img-element -- external brand asset, not a static import */}
          <img src={NBRH_LOGO_URL} alt="The NBRH" className="app-header-logo" />
          <span className="app-header-mode" aria-hidden>
            |
          </span>
          <Link href="/players" className="app-header-mode-label">
            For Players
          </Link>
        </div>
        <div className="app-header-actions">
          <HeaderMenu clubToken={clubToken} />
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

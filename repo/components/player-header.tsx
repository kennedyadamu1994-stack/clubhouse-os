"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, Heart, Inbox } from "lucide-react";
import { NBRH_LOGO_URL } from "@/lib/brand";

/**
 * Player-side equivalent of AppHeader + HeaderMenu (components/
 * app-header.tsx, components/header-menu.tsx) — a separate component
 * rather than both of those taking a "player mode," for the same
 * reason PlayerNavLinks is separate from NavLinks (components/nav.tsx):
 * different URL shape (/players/[playerToken] vs /dashboard/[clubToken]),
 * no plan tier, no token balance concept at all.
 *
 * Inbox unread count is hardcoded to 0 for now (Kennedy, 15 Sep: "I'll
 * link the proper inbox sheet later") — the icon and its /inbox route
 * exist so the nav shape is complete, but the real read/unread ledger
 * (a genuine Postgres-backed subsystem on the CHOS side, not a plain
 * Sheets read — see getUnreadInboxCount across lib/data/*.ts) is
 * deliberately deferred to its own pass once the real inbox sheet for
 * POS is confirmed, rather than wiring fake data through that ledger now.
 */
export function PlayerHeader({ playerToken }: { playerToken: string }) {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="app-header-brand">
          {/* eslint-disable-next-line @next/next/no-img-element -- external brand asset, not a static import */}
          <img src={NBRH_LOGO_URL} alt="The NBRH" className="app-header-logo" />
          <span className="app-header-mode" aria-hidden>
            |
          </span>
          {/* Deliberately NOT /directory (admin-gated) — see app/players/page.tsx's own note on why this points at a placeholder external URL until a real public "for clubs" page exists. */}
          <a href="https://thenbrh.co.uk" className="app-header-mode-label">
            For Clubs
          </a>
        </div>
        <div className="app-header-actions">
          <PlayerHeaderMenu playerToken={playerToken} />
          <Link
            href={`/players/${playerToken}/inbox`}
            className="app-header-icon-btn"
            aria-label="Inbox"
            title="Inbox"
          >
            <Inbox size={19} aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
}

function PlayerHeaderMenu({ playerToken }: { playerToken: string }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="header-menu-wrap" ref={wrapRef}>
      <button
        type="button"
        className="app-header-icon-btn header-menu-trigger"
        aria-label="Menu"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      >
        <Menu size={19} aria-hidden />
      </button>
      {open && (
        <div className="header-menu-dropdown" role="menu">
          <Link
            href={`/players/${playerToken}/favourites`}
            className="header-menu-item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <Heart size={16} aria-hidden />
            Favourites
          </Link>
        </div>
      )}
    </div>
  );
}

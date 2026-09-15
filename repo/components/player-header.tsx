"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, Heart, Inbox, ArrowLeftRight, LogOut, LogIn } from "lucide-react";
import { NBRH_LOGO_URL } from "@/lib/brand";
import { usePlayerSession } from "./player-session";

/**
 * Player-side equivalent of AppHeader + HeaderMenu (components/
 * app-header.tsx, components/header-menu.tsx) — a separate component
 * rather than both of those taking a "player mode," for the same
 * reason PlayerNavLinks is separate from NavLinks (components/nav.tsx):
 * different URL shape (/players/[playerToken] vs /dashboard/[clubToken]),
 * no plan tier, no token balance concept at all.
 *
 * playerToken is OPTIONAL — the public route tree (/players/
 * search|calendar|jobs, no token) renders this same header.
 *
 * Favourites now depends on the EMAIL session (usePlayerSession,
 * components/player-session.tsx), not playerToken (15 Sep, Kennedy's
 * decision: favourites use email-lookup login, separate from the
 * player's own private token link, which stays for onboarding/welcome
 * only). The dropdown shows Favourites + Sign out when logged in by
 * email, or a Sign in prompt when not — regardless of whether a
 * playerToken is present in the URL, since the two identities are
 * genuinely independent.
 *
 * Inbox unread count is hardcoded to 0 for now (Kennedy, 15 Sep: "I'll
 * link the proper inbox sheet later") — deliberately deferred, same as
 * before; still tied to playerToken since Inbox itself hasn't moved to
 * the email identity.
 *
 * "For Clubs" points at "/" (the real CHOS/POS choice screen — see
 * app/page.tsx's own doc comment).
 */
export function PlayerHeader({ playerToken }: { playerToken?: string }) {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="app-header-brand">
          {/* eslint-disable-next-line @next/next/no-img-element -- external brand asset, not a static import */}
          <img src={NBRH_LOGO_URL} alt="The NBRH" className="app-header-logo" />
          <span className="app-header-mode" aria-hidden>
            |
          </span>
          <Link href="/" className="app-header-mode-label">
            <ArrowLeftRight size={13} aria-hidden />
            For Clubs
          </Link>
        </div>
        <div className="app-header-actions">
          <PlayerHeaderMenu />
          {playerToken && (
            <Link
              href={`/players/${playerToken}/inbox`}
              className="app-header-icon-btn"
              aria-label="Inbox"
              title="Inbox"
            >
              <Inbox size={19} aria-hidden />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function PlayerHeaderMenu() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { player, signOut } = usePlayerSession();

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
          {player ? (
            <>
              <Link href="/players/favourites" className="header-menu-item" role="menuitem" onClick={() => setOpen(false)}>
                <Heart size={16} aria-hidden />
                Favourites
              </Link>
              <button
                type="button"
                className="header-menu-item"
                role="menuitem"
                onClick={() => {
                  signOut();
                  setOpen(false);
                }}
                style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
              >
                <LogOut size={16} aria-hidden />
                Sign out
              </button>
            </>
          ) : (
            <Link href="/players/favourites" className="header-menu-item" role="menuitem" onClick={() => setOpen(false)}>
              <LogIn size={16} aria-hidden />
              Sign in for Favourites
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

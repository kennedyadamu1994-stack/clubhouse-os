"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, Heart, Inbox, LogOut, LogIn, Map, Gift, BookOpen, ShoppingBag, Mail } from "lucide-react";
import { NBRH_LOGO_URL } from "@/lib/brand";
import { OsSwitch } from "./os-switch";
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
 * Favourites AND Inbox both depend on the EMAIL session
 * (usePlayerSession, components/player-session.tsx), not playerToken
 * (Kennedy's decision: favourites/inbox use email-lookup login,
 * separate from the player's own private token link, which stays for
 * onboarding/welcome only) — P INBOX has a real Email column, the same
 * genuinely stable identity Favourites already uses, so Inbox follows
 * that exact same pattern rather than the token-based approach an
 * earlier version of this file used before that was confirmed. The
 * Inbox icon's badge shows the real unread count from the session
 * context (unreadInboxCount, refreshed whenever the logged-in email
 * changes) — always visible in the header, not conditioned on
 * playerToken, since it works identically signed-in-by-email whether
 * or not a token happens to be in the current URL.
 *
 * Map/Perks/Guide/Club Store/Contact Us (15 Sep, Kennedy: "add a Map
 * page from the CHOS & add it into the drop down menu in the POS" /
 * "add a Perks page to the drop down" / "add a Guide page to the drop
 * down" / "add a Club store page to the drop down" / "the Contact page
 * in the CHOS, can you add this as an option in the dropdown") live in
 * THIS dropdown, not the 5-item sidebar/tab bar — genuinely secondary
 * pages. Unlike Favourites/Inbox, these are token-aware, not
 * email-session-gated — they work identically whether or not a player
 * is signed in or holds a token, so they build their href from
 * playerToken when present, the public path when not, the same
 * pattern PlayerNavLinks already uses.
 *
 * Sign out/Sign in moved to the BOTTOM of the dropdown (15 Sep,
 * Kennedy's explicit request) — every other real destination
 * (Favourites, Inbox, Map, Perks, Guide, Club Store, Contact Us) now
 * lists first, with the account action last, matching how most real
 * apps separate "things you can go to" from "manage your session."
 * Favourites and Inbox are also now hidden entirely from the list
 * (rather than shown as disabled/broken) when nobody's signed in —
 * only the bottom "Sign in" prompt shows in that case, and once signed
 * in, "Sign out" replaces it in that exact same bottom position.
 *
 * "For Clubs"/"For Players" toggle rebuilt as a real animated switch
 * (16 Sep) — see components/os-switch.tsx (the same shared component
 * AppHeader now uses too) and that file's own doc comment for the full
 * reasoning. This header renders <OsSwitch active="pos" />.
 */
export function PlayerHeader({ playerToken }: { playerToken?: string }) {
  const { email, unreadInboxCount } = usePlayerSession();

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="app-header-brand">
          {/* Logo links back to the splash page (18 Sep, Kennedy: "the NBRH
              logo that is in the header links back to the splash page") —
              previously a bare img with no link at all. */}
          <Link href="/" aria-label="The NBRH home" className="app-header-logo-link">
            {/* eslint-disable-next-line @next/next/no-img-element -- external brand asset, not a static import */}
            <img src={NBRH_LOGO_URL} alt="The NBRH" className="app-header-logo" />
          </Link>
          <span className="app-header-mode" aria-hidden>
            |
          </span>
          <OsSwitch active="pos" />
        </div>
        <div className="app-header-actions">
          <PlayerHeaderMenu playerToken={playerToken} />
          {email && (
            <Link
              href="/players/inbox"
              className="app-header-icon-btn"
              aria-label={unreadInboxCount > 0 ? `Inbox, ${unreadInboxCount} unread` : "Inbox"}
              title="Inbox"
            >
              <Inbox size={19} aria-hidden />
              {unreadInboxCount > 0 && (
                <span className="app-header-badge" aria-hidden>
                  {unreadInboxCount}
                </span>
              )}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function PlayerHeaderMenu({ playerToken }: { playerToken?: string }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { player, signOut } = usePlayerSession();
  const base = playerToken ? `/players/${playerToken}` : "/players";

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
        className="header-menu-btn"
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
            <Link href="/players/favourites" className="header-menu-item" role="menuitem" onClick={() => setOpen(false)}>
              <Heart size={16} aria-hidden />
              Favourites
            </Link>
          ) : null}
          {player ? (
            <Link href="/players/inbox" className="header-menu-item" role="menuitem" onClick={() => setOpen(false)}>
              <Inbox size={16} aria-hidden />
              Inbox
            </Link>
          ) : null}
          <Link href={`${base}/map`} className="header-menu-item" role="menuitem" onClick={() => setOpen(false)}>
            <Map size={16} aria-hidden />
            Map
          </Link>
          <Link href={`${base}/perks`} className="header-menu-item" role="menuitem" onClick={() => setOpen(false)}>
            <Gift size={16} aria-hidden />
            Perks
          </Link>
          <Link href={`${base}/guide`} className="header-menu-item" role="menuitem" onClick={() => setOpen(false)}>
            <BookOpen size={16} aria-hidden />
            Guide
          </Link>
          <Link href={`${base}/store`} className="header-menu-item" role="menuitem" onClick={() => setOpen(false)}>
            <ShoppingBag size={16} aria-hidden />
            Club Store
          </Link>
          <Link href={`${base}/contact`} className="header-menu-item" role="menuitem" onClick={() => setOpen(false)}>
            <Mail size={16} aria-hidden />
            Contact Us
          </Link>
          {player ? (
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
          ) : (
            <Link href="/players/favourites" className="header-menu-item" role="menuitem" onClick={() => setOpen(false)}>
              <LogIn size={16} aria-hidden />
              Sign in for Favourites & Inbox
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

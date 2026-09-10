"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, Heart } from "lucide-react";

/**
 * Header hamburger menu (Kennedy's request, 9 Sep: "a three line drop
 * down bar in the header... on the left of the inbox button"). Sits
 * immediately before the Inbox link inside .app-header-actions.
 *
 * Only holds the Favourites link for now, per Kennedy's explicit scope
 * decision — built as a real dropdown (not a single-purpose button)
 * since he described it as a menu, so more items can be added later
 * without restructuring this component.
 */
export function HeaderMenu({ clubToken }: { clubToken: string }) {
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
        className="app-header-icon-btn"
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
            href={`/dashboard/${clubToken}/favourites`}
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

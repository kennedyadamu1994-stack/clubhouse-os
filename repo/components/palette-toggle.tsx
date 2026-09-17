"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Briefcase, Palette } from "lucide-react";

/**
 * Footer toggle between the pink brand theme and a professional
 * navy/charcoal + muted teal alternative (Kennedy's request, 5 Sep:
 * "I want to see if you can keep this current pink theme for the light
 * mode... but I want to see if it could be a bit more professional...
 * the toggle should allow me to switch between the pink theme and
 * professional theme"). Only affects light mode's palette — confirmed
 * explicitly, dark mode is untouched by this toggle either way.
 *
 * Mirrors ThemeToggle's own pattern exactly: a data-palette attribute on
 * <html>, set by an inline script before first paint (see app/layout.tsx)
 * so there's no flash-of-wrong-palette, read here only after mount since
 * the server can't know the saved preference, and persisted the same way
 * via localStorage.
 *
 * CHOS and POS keep separate preferences (15 Sep, Kennedy: "POS should
 * have its own separate... preference from CHOS") — this component now
 * reads/writes a different localStorage key depending on which app it's
 * rendered inside (usePathname, same "/players" prefix check the inline
 * pre-paint script in app/layout.tsx uses), and re-applies data-palette
 * on every path change, since navigating between /players and /dashboard
 * is a client-side transition that never re-runs that inline script.
 */
export function PaletteToggle() {
  const pathname = usePathname();
  const isPos = pathname.startsWith("/players");
  const storageKey = isPos ? "palette_pos" : "palette";
  const [palette, setPalette] = useState<"pink" | "professional" | null>(null);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(storageKey);
    } catch {
      /* storage unavailable — falls back to pink below, same as the inline script's own default */
    }
    const resolved = saved === "professional" ? "professional" : "pink";
    document.documentElement.setAttribute("data-palette", resolved);
    setPalette(resolved);
    // Re-runs whenever the app side changes (CHOS <-> POS via a client
    // navigation) so <html> always reflects the CURRENT surface's own
    // saved preference, not whichever surface last set the attribute.
  }, [storageKey]);

  function toggle() {
    const next = palette === "professional" ? "pink" : "professional";
    document.documentElement.setAttribute("data-palette", next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      /* storage unavailable — palette still applies for this session */
    }
    setPalette(next);
  }

  if (palette === null) return <span className="palette-toggle-placeholder" aria-hidden />;

  return (
    <button
      className="palette-toggle"
      onClick={toggle}
      aria-label={palette === "professional" ? "Switch to pink theme" : "Switch to professional theme"}
      title={palette === "professional" ? "Switch to pink theme" : "Switch to professional theme"}
    >
      {palette === "professional" ? <Palette size={14} aria-hidden /> : <Briefcase size={14} aria-hidden />}
      <span>{palette === "professional" ? "Pink theme" : "Professional theme"}</span>
    </button>
  );
}

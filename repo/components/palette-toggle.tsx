"use client";

import { useEffect, useState } from "react";
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
 */
export function PaletteToggle() {
  const [palette, setPalette] = useState<"pink" | "professional" | null>(null);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-palette");
    setPalette(current === "professional" ? "professional" : "pink");
  }, []);

  function toggle() {
    const next = palette === "professional" ? "pink" : "professional";
    document.documentElement.setAttribute("data-palette", next);
    try {
      localStorage.setItem("palette", next);
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

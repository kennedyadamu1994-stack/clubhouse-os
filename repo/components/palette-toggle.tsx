"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Palette, Check } from "lucide-react";

/**
 * Footer picker for light mode's colour palette (19 Sep rebuild).
 * Replaces the old two-way pink/professional toggle entirely — Kennedy:
 * "completely remove the professional theme option... there [are] five
 * palettes that I've attached and I want to test them all... instead of
 * just the professional [theme as] the toggle for one, have 5 versions."
 * Dark mode is completely untouched by this picker either way, same as
 * the old toggle — confirmed explicitly, still holds.
 *
 * PALETTES mirrors the 5 [data-palette="name"] blocks in globals.css
 * exactly (sunset/lavender/seafoam/peach/citrus) — swatch colours here
 * are each palette's own --pink value, just so the picker itself gives
 * a visual preview without needing to read CSS custom properties at
 * render time.
 *
 * Same persistence pattern as the old toggle: a data-palette attribute
 * on <html>, set pre-paint by the inline script in app/layout.tsx (so
 * there's no flash of the wrong palette), read here only after mount,
 * persisted via localStorage. CHOS and POS keep separate preferences
 * (15 Sep decision, unchanged) — different localStorage key depending
 * on which app this renders inside, re-applied on every path change
 * since navigating between /players and /dashboard is a client-side
 * transition that never re-runs the inline pre-paint script.
 */
const PALETTES = [
  { id: "sunset", label: "Sunset", swatch: "#A33757" },
  { id: "lavender", label: "Lavender", swatch: "#7C3F9F" },
  { id: "seafoam", label: "Seafoam", swatch: "#3F6B58" },
  { id: "peach", label: "Peach", swatch: "#AD431F" },
  { id: "citrus", label: "Citrus", swatch: "#B22E48" },
] as const;

type PaletteId = (typeof PALETTES)[number]["id"];
const DEFAULT_PALETTE: PaletteId = "sunset";
const PALETTE_IDS = PALETTES.map((p) => p.id);

function isPaletteId(value: string | null): value is PaletteId {
  return !!value && (PALETTE_IDS as string[]).includes(value);
}

export function PaletteToggle() {
  const pathname = usePathname();
  const isPos = pathname.startsWith("/players");
  const storageKey = isPos ? "palette_pos" : "palette";
  const [palette, setPalette] = useState<PaletteId | null>(null);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(storageKey);
    } catch {
      /* storage unavailable — falls back to the default below, same as the inline script's own default */
    }
    const resolved = isPaletteId(saved) ? saved : DEFAULT_PALETTE;
    document.documentElement.setAttribute("data-palette", resolved);
    setPalette(resolved);
    // Re-runs whenever the app side changes (CHOS <-> POS via a client
    // navigation) so <html> always reflects the CURRENT surface's own
    // saved preference, not whichever surface last set the attribute.
  }, [storageKey]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
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

  function choose(next: PaletteId) {
    document.documentElement.setAttribute("data-palette", next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      /* storage unavailable — palette still applies for this session */
    }
    setPalette(next);
    setOpen(false);
  }

  if (palette === null) return <span className="palette-toggle-placeholder" aria-hidden />;

  const current = PALETTES.find((p) => p.id === palette) ?? PALETTES[0];

  return (
    <div className="palette-picker-wrap" ref={wrapRef}>
      <button
        className="palette-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Palette: ${current.label}. Choose a light mode palette`}
        aria-expanded={open}
        aria-haspopup="true"
        title="Choose light mode palette"
      >
        <Palette size={14} aria-hidden />
        <span>{current.label}</span>
      </button>
      {open && (
        <div className="palette-picker-dropdown" role="menu">
          {PALETTES.map((p) => (
            <button
              key={p.id}
              className="palette-picker-item"
              role="menuitemradio"
              aria-checked={p.id === palette}
              onClick={() => choose(p.id)}
            >
              <span className="palette-picker-swatch" style={{ background: p.swatch }} aria-hidden />
              <span className="palette-picker-label">{p.label}</span>
              {p.id === palette && <Check size={14} aria-hidden className="palette-picker-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

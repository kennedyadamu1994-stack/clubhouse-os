"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

/**
 * Reads the theme app/layout.tsx's inline script already set on <html>
 * before first paint (localStorage, falling back to OS preference) —
 * this component doesn't decide the initial theme, it only reflects and
 * changes it, which avoids a hydration mismatch: the server has no way to
 * know the person's saved preference or OS setting, so the source of
 * truth for "what's currently active" is always the DOM attribute, read
 * client-side after mount.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light" | null>(null);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "light" ? "light" : "dark");
  }, []);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* storage unavailable — theme still applies for this session */
    }
    setTheme(next);
  }

  // Render nothing until mounted and the real theme is known, rather than
  // guessing — a wrong guess would itself cause a flash/flicker on toggle.
  if (theme === null) return <span className="theme-toggle-placeholder" aria-hidden />;

  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      {theme === "light" ? <Moon size={15} aria-hidden /> : <Sun size={15} aria-hidden />}
    </button>
  );
}

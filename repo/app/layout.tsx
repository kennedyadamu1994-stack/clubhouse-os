import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Club House OS: The NBRH",
  description: "Your club's personalised dashboard from The NBRH.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Young+Serif&display=swap"
          rel="stylesheet"
        />
        {/* Sets data-theme AND data-palette on <html> before first paint — a
            React effect would run after the initial render, causing a
            visible flash of the wrong theme/palette. Reads a saved choice
            first; if the person has never toggled, falls back to their
            OS-level light/dark preference for theme, and always defaults
            to "pink" for palette (professional is opt-in, never assumed).
            suppressHydrationWarning on <html> below is required because
            this script sets attributes the server-rendered markup doesn't
            have — that's expected here, not a real mismatch.

            Palette is deliberately NOT shared between CHOS and POS (15
            Sep, Kennedy: "POS should have its own separate... preference
            from CHOS") — theme (light/dark) stays one shared setting
            either way, Kennedy only flagged palette as an issue. Decided
            by URL, checked here before paint since this script runs
            before React Router/usePathname exist: any path starting
            with /players uses the "palette_pos" key, everything else
            (CHOS, admin, everything under /dashboard) keeps using the
            original "palette" key untouched — an existing CHOS user's
            saved preference is unaffected by this change. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.setAttribute('data-theme',t);var isPos=window.location.pathname.indexOf('/players')===0;var pKey=isPos?'palette_pos':'palette';var p=localStorage.getItem(pKey)||'pink';document.documentElement.setAttribute('data-palette',p);}catch(e){}})();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

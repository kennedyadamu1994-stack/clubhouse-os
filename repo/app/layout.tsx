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
        {/* Locked viewport (17 Sep, Kennedy: "no ability to zoom in or out
            at all... one fixed frame") — no meta viewport tag existed
            before this, which is the real cause of both the free pinch-
            zoom and the slight zoom drift Kennedy saw on login/logout
            (a hard navigation with no fixed initial-scale lets the
            browser re-settle scale on reload). maximum-scale=1 and
            user-scalable=no remove pinch-zoom entirely; Kennedy confirmed
            this explicitly against the accessibility report's own 200%-
            zoom guidance and asked to override it — noted here rather
            than silently applied, so a future pass knows this was a
            deliberate call, not an oversight. */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Young+Serif&display=swap"
          rel="stylesheet"
        />
        {/* Sets data-theme AND data-palette on <html> before first paint — a
            React effect would run after the initial render, causing a
            visible flash of the wrong theme/palette. Reads a saved choice
            first; if the person has never chosen a palette, defaults to
            "sunset" (the closest of the 5 named palettes — see globals.css
            — to this app's original brand pink). suppressHydrationWarning
            on <html> below is required because this script sets
            attributes the server-rendered markup doesn't have — that's
            expected here, not a real mismatch.

            19 Sep, palette picker rebuild — the old two-way "pink"/
            "professional" toggle is gone; VALID now checks any stored
            value against the 5 real palette ids (mirrors
            components/palette-toggle.tsx's own PALETTE_IDS) and falls
            back to "sunset" for anything else, so a browser with an old
            "pink" or "professional" value saved from before this change
            still resolves to a real, colour-carrying palette instead of
            an unstyled/invalid data-palette attribute.

            Palette is deliberately NOT shared between CHOS and POS (15
            Sep, Kennedy: "POS should have its own separate... preference
            from CHOS") — theme (light/dark) stays one shared setting
            either way, Kennedy only flagged palette as an issue. Decided
            by URL, checked here before paint since this script runs
            before React Router/usePathname exist: any path starting
            with /players uses the "palette_pos" key, everything else
            (CHOS, admin, everything under /dashboard) keeps using the
            original "palette" key untouched. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.setAttribute('data-theme',t);var isPos=window.location.pathname.indexOf('/players')===0;var pKey=isPos?'palette_pos':'palette';var p=localStorage.getItem(pKey);var VALID=['sunset','lavender','seafoam','peach','citrus'];if(VALID.indexOf(p)===-1){p='sunset';}document.documentElement.setAttribute('data-palette',p);}catch(e){}})();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

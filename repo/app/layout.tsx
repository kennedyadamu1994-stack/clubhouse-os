import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Club House OS — The NBRH",
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
        {/* Sets data-theme on <html> before first paint — a React effect would
            run after the initial render, causing a visible flash of the wrong
            theme. Reads a saved choice first; if the person has never toggled,
            falls back to their OS-level light/dark preference rather than
            assuming dark. suppressHydrationWarning on <html> below is required
            because this script sets an attribute the server-rendered markup
            doesn't have — that's expected here, not a real mismatch. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

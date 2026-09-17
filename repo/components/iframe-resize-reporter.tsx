"use client";

import { useEffect } from "react";

/**
 * Squarespace iframe auto-resize — reports this page's real content height
 * to whatever window is framing it, via postMessage. Renders nothing;
 * side-effect only.
 *
 * Why postMessage: a page inside an iframe cannot resize its own <iframe>
 * element directly — browsers block that across origins for security, and
 * a Squarespace page and this Vercel deployment are different origins.
 * postMessage is the standard sanctioned channel for a framed page to talk
 * to its parent. The matching listener lives in the Squarespace embed code
 * (squarespace-embed.html), not in this repo — that half can't live here
 * since Squarespace doesn't run this codebase.
 *
 * Safe when NOT embedded (visiting the dashboard directly, the normal
 * case): `window.parent === window` at top level, so postMessage just
 * talks to itself and the Squarespace listener that would react to it
 * doesn't exist there — inert either way, never a console error, never a
 * layout change.
 *
 * Re-reports on: mount, window resize, and content changes (dropdown
 * expand/collapse, tab navigation, async data landing) via a
 * ResizeObserver on <body> — a plain "measure once on load" would miss all
 * of those and the embed would drift stale the moment someone expands the
 * Membership dropdown or navigates a workspace tab.
 */
export function IframeResizeReporter() {
  useEffect(() => {
    function reportHeight() {
      const height = document.body.scrollHeight;
      window.parent.postMessage({ type: "clubhouse-os:resize", height }, "*");
    }

    reportHeight();
    window.addEventListener("resize", reportHeight);

    const observer = new ResizeObserver(() => reportHeight());
    observer.observe(document.body);

    return () => {
      window.removeEventListener("resize", reportHeight);
      observer.disconnect();
    };
  }, []);

  return null;
}

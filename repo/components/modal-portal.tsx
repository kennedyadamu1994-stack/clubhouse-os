"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Wraps every modal's .modal-overlay in a React portal to document.body,
 * fixing a real, confirmed bug (31 Aug): the Tools → Contact Us popup's
 * dark overlay didn't cover the full screen on iOS Safari specifically,
 * while every Outreach popup worked correctly.
 *
 * Root cause, found by comparing the two contexts directly (not just
 * theorising from the CSS spec): Contact Us's popup renders inside
 * `.card` (overflow: hidden + a `transition` on border-color), while
 * Outreach's popups render inside `.entry-row` (neither property). An
 * element with BOTH overflow:hidden/auto AND an active transition/
 * transform is a documented WebKit quirk that makes Safari create a new
 * containing block for that element's descendants — which breaks
 * `position: fixed` children exactly the way Kennedy described ("the
 * sides are exposed"). This is real Safari behaviour, not spec-correct
 * CSS, which is why it wasn't findable by reading the stylesheet alone —
 * confirmed by Kennedy naming which popups worked ("all the outreach
 * popup functions work") and comparing their actual DOM ancestors.
 *
 * The fix is structural, not a CSS patch on `.card` (which would risk
 * breaking that class's existing collapse/border-radius behaviour
 * elsewhere) — a portal moves the overlay's real DOM position to
 * document.body, outside EVERY ancestor's box entirely, so no ancestor's
 * overflow/transition combination can ever affect it again, on this page
 * or any future one that nests a popup inside a `.card`.
 *
 * Used by every modal in the app (ActionPopup, ContactUsForm,
 * FeatureRequestForm, ListCalloutButton's popup, AllActionsPopup,
 * InsufficientTokensPopup, CalendarView's and NbrhMap's/NbrhEngine's
 * session popups) — not just Contact Us — so this class of bug can't
 * recur silently the next time a popup is nested inside a `.card`.
 *
 * mounted/useEffect guards against SSR: document.body doesn't exist
 * during server rendering, and portals must target a real DOM node.
 */
export function ModalPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

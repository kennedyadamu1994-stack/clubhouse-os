"use client";

import { useState } from "react";
import { LegalModal, type LegalDocument } from "./legal-modal";

/**
 * Footer links for Privacy Policy / Terms of Service / Cookie Policy
 * (Kennedy's request, 7 Sep). Small client component extracted from
 * AppFooter (a server component) purely because opening the modal
 * needs client-side state — the rest of the footer stays server-
 * rendered.
 */
export function LegalLinks() {
  const [open, setOpen] = useState<LegalDocument | null>(null);

  return (
    <>
      <button type="button" className="app-footer-link-button" onClick={() => setOpen("privacy")}>
        Privacy Policy
      </button>
      <button type="button" className="app-footer-link-button" onClick={() => setOpen("terms")}>
        Terms of Service
      </button>
      <button type="button" className="app-footer-link-button" onClick={() => setOpen("cookies")}>
        Cookie Policy
      </button>
      {open && <LegalModal document={open} onClose={() => setOpen(null)} />}
    </>
  );
}

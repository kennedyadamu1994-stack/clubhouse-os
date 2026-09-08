"use client";

import { useEffect, useRef } from "react";
import { ModalPortal } from "./modal-portal";
import { PRIVACY_POLICY_TEXT, PRIVACY_POLICY_LAST_UPDATED } from "@/lib/legal/privacy-policy";
import { TERMS_OF_SERVICE_TEXT, TERMS_OF_SERVICE_LAST_UPDATED } from "@/lib/legal/terms-of-service";
import { COOKIE_POLICY_TEXT, COOKIE_POLICY_LAST_UPDATED } from "@/lib/legal/cookie-policy";

export type LegalDocument = "privacy" | "terms" | "cookies";

const DOCUMENTS: Record<LegalDocument, { title: string; lastUpdated: string; body: string }> = {
  privacy: { title: "Privacy Policy", lastUpdated: PRIVACY_POLICY_LAST_UPDATED, body: PRIVACY_POLICY_TEXT },
  terms: { title: "Terms of Service", lastUpdated: TERMS_OF_SERVICE_LAST_UPDATED, body: TERMS_OF_SERVICE_TEXT },
  cookies: { title: "Cookie Policy", lastUpdated: COOKIE_POLICY_LAST_UPDATED, body: COOKIE_POLICY_TEXT },
};

/**
 * Renders one legal document's plain-text content (lib/legal/*.ts) as
 * real HTML — "## Heading" lines become <h3>, blank-line-separated
 * paragraphs become <p> — rather than showing raw markdown syntax on
 * screen. Deliberately simple (no markdown library) since the content
 * only ever uses this one heading pattern.
 */
function LegalBody({ text }: { text: string }) {
  const blocks = text.split("\n\n").map((block) => block.trim()).filter(Boolean);
  return (
    <>
      {blocks.map((block, i) => {
        if (block.startsWith("## ")) {
          return (
            <h3 key={i} className="legal-modal-heading">
              {block.slice(3)}
            </h3>
          );
        }
        return (
          <p key={i} className="legal-modal-paragraph">
            {block}
          </p>
        );
      })}
    </>
  );
}

/**
 * Footer legal-document popup (Kennedy's request, 7 Sep: "written,
 * stored within the repo, and when the link is clicked in the footer,
 * it reveals a pop up"). Content lives in lib/legal/*.ts as plain
 * exported strings, editable directly without touching this component.
 */
export function LegalModal({ document: doc, onClose }: { document: LegalDocument; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const { title, lastUpdated, body } = DOCUMENTS[doc];

  useEffect(() => {
    dialogRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <ModalPortal>
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div
          className="modal legal-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="legal-modal-title"
          ref={dialogRef}
          tabIndex={-1}
        >
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
          <h2 id="legal-modal-title">{title}</h2>
          <p className="modal-sub">Last updated {lastUpdated}</p>
          <div className="legal-modal-body">
            <LegalBody text={body} />
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

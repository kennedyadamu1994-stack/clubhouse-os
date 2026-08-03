"use client";

import { useState } from "react";

/**
 * Wraps a section's heading + body so the whole thing collapses on mobile
 * (Kennedy's edit) while staying always-open on desktop — the toggle button
 * only renders/behaves as a toggle below the 780px breakpoint via CSS, so
 * desktop users never see a collapse control they don't need.
 */
export function CollapsibleCard({
  id,
  heading,
  className = "",
  defaultOpen = true,
  children,
}: {
  id: string;
  heading: React.ReactNode;
  className?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={`card ${open ? "mobile-open" : ""} ${className}`} aria-labelledby={`h-${id}`}>
      <button
        className="card-mobile-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`body-${id}`}
      >
        <h2 id={`h-${id}`}>{heading}</h2>
        <span className="card-mobile-chevron" aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>
      <div className="card-body-collapsible" id={`body-${id}`}>
        {children}
      </div>
    </section>
  );
}

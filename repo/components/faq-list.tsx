"use client";

import { useMemo, useState } from "react";
import type { Faq } from "@/lib/types";

/**
 * FAQ / help library (docs/sections 03-05 § FAQ). Grouped by category,
 * searchable — a plain accordion, not the Outreach entry-row pattern, since
 * there's no token action here and each entry is a question/answer pair,
 * not an outreach target.
 */
export function FaqList({ faq }: { faq: Faq[] }) {
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return faq;
    return faq.filter(
      (f) => f.question.toLowerCase().includes(term) || f.answer.toLowerCase().includes(term),
    );
  }, [faq, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, Faq[]>();
    for (const f of filtered) {
      const list = map.get(f.category) ?? [];
      list.push(f);
      map.set(f.category, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <>
      <div className="askbar" style={{ marginBottom: 22 }}>
        <span className="ic" aria-hidden>
          ⌕
        </span>
        <input
          type="text"
          placeholder="Search the FAQ…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search FAQ"
        />
      </div>

      {grouped.length === 0 ? (
        <p style={{ color: "var(--dim)", fontSize: "0.9rem" }}>No FAQ entries match your search.</p>
      ) : (
        grouped.map(([category, items]) => (
          <section key={category} style={{ marginBottom: 26 }}>
            <p className="eyebrow" style={{ marginBottom: 10 }}>
              {category}
            </p>
            <div className="entry-list">
              {items.map((f) => {
                const open = openId === f.faq_id;
                return (
                  <div key={f.faq_id} style={{ borderTop: "1px solid var(--line)" }}>
                    <button
                      onClick={() => setOpenId(open ? null : f.faq_id)}
                      aria-expanded={open}
                      aria-controls={`faq-${f.faq_id}`}
                      style={{
                        width: "100%",
                        background: "none",
                        border: 0,
                        cursor: "pointer",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: "16px 4px",
                        color: "var(--text)",
                        font: "inherit",
                        fontWeight: 500,
                      }}
                    >
                      {f.question}
                      <span aria-hidden style={{ color: "var(--faint-text)", flex: "none" }}>
                        {open ? "−" : "+"}
                      </span>
                    </button>
                    {open && (
                      <p
                        id={`faq-${f.faq_id}`}
                        style={{ color: "var(--dim)", fontSize: "0.9rem", padding: "0 4px 18px", maxWidth: "65ch" }}
                      >
                        {f.answer}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </>
  );
}

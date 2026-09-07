"use client";

import dynamic from "next/dynamic";

const NbrhMap = dynamic(() => import("./nbrh-map").then((m) => m.NbrhMap), {
  ssr: false,
  loading: () => (
    <div className="nbmap-loading-shell">
      <div className="sr-spin" />
      <p style={{ color: "var(--faint-text)", fontSize: "0.85rem" }}>Loading the map…</p>
    </div>
  ),
});

export function MapClientBoundary() {
  return <NbrhMap />;
}

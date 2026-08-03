export default function Home() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ maxWidth: 420, textAlign: "center" }}>
        <h1 style={{ marginBottom: 12 }}>
          Club House <em style={{ color: "var(--pink)", fontStyle: "normal" }}>OS</em>
        </h1>
        <p style={{ color: "var(--text-dim)" }}>
          Your club&apos;s dashboard lives at the private link The NBRH sent you. Lost it? Email
          us and we&apos;ll send a fresh one.
        </p>
      </div>
    </main>
  );
}

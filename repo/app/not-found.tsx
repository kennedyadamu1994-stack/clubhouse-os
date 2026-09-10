export default function NotFound() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ maxWidth: 420, textAlign: "center" }}>
        <h1 style={{ marginBottom: 12 }}>That link doesn&apos;t work</h1>
        <p style={{ color: "var(--text-dim)" }}>
          This dashboard link is invalid or has been rotated. Contact The NBRH for a fresh link
          to your club&apos;s dashboard.
        </p>
      </div>
    </main>
  );
}

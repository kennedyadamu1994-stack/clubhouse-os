import { getAdapter } from "@/lib/data";

/**
 * TEMPORARY debug route — not part of the real app. Delete this file once
 * the "success message but nothing in /admin/requests" issue is diagnosed.
 *
 * Shows, in plain text:
 *   1. Whether POSTGRES_URL is actually set in this environment
 *   2. Which adapter getAdapter() is actually returning
 *   3. What getAllActions() returns right now, straight from source
 *
 * This bypasses every layer of caching/UI — if the count here doesn't match
 * what you just submitted, the problem is in the write path, not in
 * /admin/requests' rendering or caching.
 */
export const dynamic = "force-dynamic"; // never cache this page, ever

export default async function DebugPage() {
  const hasPostgresUrl = Boolean(process.env.POSTGRES_URL);
  const db = getAdapter();
  const adapterName = db.constructor.name;

  let actions: unknown[] = [];
  let error: string | null = null;
  try {
    actions = await db.getAllActions();
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <main style={{ minHeight: "100vh", padding: "48px 24px", fontFamily: "monospace" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <h1>Debug</h1>
        <p>POSTGRES_URL set: <strong>{String(hasPostgresUrl)}</strong></p>
        <p>Adapter in use: <strong>{adapterName}</strong></p>
        <p>getAllActions() row count: <strong>{actions.length}</strong></p>
        {error && (
          <div style={{ color: "red", marginTop: 16 }}>
            <p>Error thrown:</p>
            <pre style={{ whiteSpace: "pre-wrap" }}>{error}</pre>
          </div>
        )}
        <pre style={{ whiteSpace: "pre-wrap", marginTop: 24, fontSize: "0.8rem" }}>
          {JSON.stringify(actions, null, 2)}
        </pre>
      </div>
    </main>
  );
}

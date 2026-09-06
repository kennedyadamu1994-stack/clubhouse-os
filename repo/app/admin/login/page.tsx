import { redirect } from "next/navigation";
import { getValidAdminSession } from "@/lib/auth/guard";
import { LoginForm } from "@/components/login-form";

export default async function AdminLogin() {
  // Already logged in? Skip the form entirely rather than showing it
  // pointlessly — a valid session means there's nothing this page needs
  // to do except send them straight to the page it protects.
  const session = await getValidAdminSession();
  if (session) redirect("/admin/requests");

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "var(--bg)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 360 }}>
        <h1 style={{ marginBottom: 8, fontFamily: "var(--font-head)", fontSize: "1.6rem" }}>
          Club House <em style={{ color: "var(--pink)", fontStyle: "normal" }}>OS</em>
        </h1>
        <p style={{ color: "var(--dim)", marginBottom: 24, fontSize: "0.9rem" }}>Admin sign in</p>
        <LoginForm />
      </div>
    </main>
  );
}

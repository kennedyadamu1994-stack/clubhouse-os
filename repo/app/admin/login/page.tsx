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
    <main className="splash splash-generic">
      <div className="splash-content splash-content-login">
        <h1 className="splash-title splash-title-login">
          Club House <em>OS</em>
        </h1>
        <p className="splash-sub splash-sub-login">Admin sign in</p>
        <LoginForm />
      </div>
    </main>
  );
}

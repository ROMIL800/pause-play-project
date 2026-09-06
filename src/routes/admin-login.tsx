import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { resolveAdminLogin, getAdminSession } from "@/lib/admin-panel.functions";

export const Route = createFileRoute("/admin-login")({
  head: () => ({
    meta: [
      { title: "Admin Sign In — GD BOSS777" },
      { name: "description", content: "Secure sign-in for GD BOSS777 administrators." },
      { property: "og:title", content: "Admin Sign In — GD BOSS777" },
      { property: "og:description", content: "Secure administrator access." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const resolve = useServerFn(resolveAdminLogin);
  const session = useServerFn(getAdminSession);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (identifier.trim().length < 3 || password.length < 6) {
      setError("Enter your admin username (or mobile number) and password.");
      return;
    }
    setLoading(true);
    try {
      const { email } = await resolve({ data: { identifier: identifier.trim() } });
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw new Error("Incorrect username/mobile number or password.");

      const me = await session();
      if (!me.isAdmin) {
        await supabase.auth.signOut();
        throw new Error("This account does not have administrator permissions.");
      }
      navigate({ to: "/admin" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="h-12 w-12 rounded-2xl brand-gradient flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-lg font-extrabold">Administrator Sign In</h1>
          <p className="text-xs text-muted-foreground">Restricted area. Authorised staff only.</p>
        </div>

        <div className="space-y-1">
          <label htmlFor="admin-id" className="text-xs font-semibold text-muted-foreground">
            Username or mobile number
          </label>
          <input
            id="admin-id"
            value={identifier}
            autoComplete="username"
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full rounded-xl border border-border bg-background py-2.5 px-3 text-sm outline-none"
            placeholder="admin777"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="admin-pw" className="text-xs font-semibold text-muted-foreground">
            Password
          </label>
          <input
            id="admin-pw"
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-border bg-background py-2.5 px-3 text-sm outline-none"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-xs font-semibold text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl brand-gradient text-white py-3 text-sm font-bold disabled:opacity-60 inline-flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Verifying…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

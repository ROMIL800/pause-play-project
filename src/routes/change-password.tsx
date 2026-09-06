import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { KeyRound } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { clearPasswordResetFlag } from "@/lib/auth.functions";
import { RequireAuth } from "@/components/RequireAuth";

export const Route = createFileRoute("/change-password")({
  head: () => ({
    meta: [
      { title: "Change Password — GD BOSS777" },
      { name: "description", content: "Set a new permanent password for your GD BOSS777 account." },
      { property: "og:title", content: "Change Password — GD BOSS777" },
      { property: "og:description", content: "Set a new permanent password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <ChangePasswordPage />
    </RequireAuth>
  ),
});

function ChangePasswordPage() {
  const navigate = useNavigate();
  const clearFlag = useServerFn(clearPasswordResetFlag);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const field =
    "w-full rounded-xl border border-border bg-background py-3.5 px-4 outline-none text-base placeholder:text-muted-foreground/60";

  async function save() {
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(error.message);
      await clearFlag({ data: undefined });
      toast.success("Password updated");
      navigate({ to: "/" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
      <AppHeader title="Change Password" />
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain mx-auto w-full max-w-md px-4 py-5 pb-24">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="text-center mb-6">
            <div className="mx-auto h-14 w-14 rounded-2xl brand-gradient text-white grid place-items-center shadow-md mb-4">
              <KeyRound className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold">Set a new password</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Your account and User ID stay the same.
            </p>
          </div>
          <label className="text-xs font-semibold text-muted-foreground">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
            className={`mt-1.5 ${field}`}
          />
          <label className="mt-4 block text-xs font-semibold text-muted-foreground">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter new password"
            className={`mt-1.5 ${field}`}
          />
          <button
            onClick={save}
            disabled={loading}
            className="mt-5 w-full brand-gradient text-white font-semibold py-3.5 rounded-xl disabled:opacity-60 active:scale-[0.98] transition"
          >
            {loading ? "Saving..." : "Save Password"}
          </button>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

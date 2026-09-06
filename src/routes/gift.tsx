import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Gift, Check } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/hooks/use-auth";
import { claimSignupBonus, getGiftStatus } from "@/lib/gift.functions";
import { useRefreshAccount } from "@/lib/wallet-store";
import { RequireAuth } from "@/components/RequireAuth";

export const Route = createFileRoute("/gift")({
  head: () => ({
    meta: [
      { title: "Get Gift — GD BOSS777" },
      { name: "description", content: "Claim your ₹5 welcome gift and earn ₹5 per referral." },
      { property: "og:title", content: "Get Gift — GD BOSS777" },
      { property: "og:description", content: "₹5 welcome gift and ₹5 referral reward." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <GiftPage />
    </RequireAuth>
  ),
});

function GiftPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const refreshAccount = useRefreshAccount();
  const fetchStatus = useServerFn(getGiftStatus);
  const claim = useServerFn(claimSignupBonus);

  const { data } = useQuery({
    queryKey: ["gift", user?.id ?? null],
    queryFn: () => fetchStatus(),
    enabled: Boolean(user),
  });

  const claimMutation = useMutation({
    mutationFn: () => claim(),
    onSuccess: () => {
      toast.success("₹5 welcome gift added to your wallet");
      void qc.invalidateQueries({ queryKey: ["gift"] });
      refreshAccount();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Could not claim gift"),
  });

  const code = data?.referralCode ?? "";
  const link = code ? `https://gdboss777.app/r/${code}` : "https://gdboss777.app";

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Referral link copied");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = link;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      toast.success("Referral link copied");
    }
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
      <AppHeader title="Get Gift" />
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain mx-auto w-full max-w-md px-4 py-5 pb-24 space-y-4">
        <div className="rounded-2xl gold-gradient p-6 text-center text-[var(--brand-deep)] shadow">
          <Gift className="h-12 w-12 mx-auto" />
          <h2 className="mt-2 text-xl font-extrabold">Welcome Gift</h2>
          <p className="text-xs mt-1">New customers get ₹5 free on their first download.</p>

          {!user ? (
            <Link
              to="/auth"
              className="mt-4 inline-block bg-[var(--brand-deep)] text-white font-bold px-6 py-2.5 rounded-xl"
            >
              Login to Claim
            </Link>
          ) : data?.claimed ? (
            <div className="mt-4 inline-flex items-center gap-1.5 bg-[var(--brand-deep)] text-white font-bold px-6 py-2.5 rounded-xl opacity-80">
              <Check className="h-4 w-4" /> Claimed
            </div>
          ) : (
            <button
              onClick={() => claimMutation.mutate()}
              disabled={claimMutation.isPending}
              className="mt-4 bg-[var(--brand-deep)] text-white font-bold px-6 py-2.5 rounded-xl disabled:opacity-60"
            >
              {claimMutation.isPending ? "Claiming…" : "Claim ₹5 Now"}
            </button>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="text-sm font-bold">Refer &amp; Earn</div>
          <p className="text-xs text-muted-foreground mt-1">
            Invite friends and earn ₹5 per successful signup.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 truncate rounded-lg bg-accent/60 px-3 py-2 text-xs font-mono">
              {user ? link : "Login to get your referral link"}
            </div>
            <button
              onClick={copyLink}
              disabled={!user}
              className="brand-gradient text-white text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-60"
            >
              Copy
            </button>
          </div>
          {user && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Total referrals: <span className="font-bold">{data?.referrals ?? 0}</span> · Earned ₹
              {(data?.referrals ?? 0) * 5}
            </p>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { listTransactions } from "@/lib/account.functions";
import { useAuth } from "@/hooks/use-auth";
import { formatBalance } from "@/lib/wallet-store";
import { RequireAuth } from "@/components/RequireAuth";

export const Route = createFileRoute("/payment-history")({
  head: () => ({
    meta: [
      { title: "Payment History — GD BOSS777" },
      { name: "description", content: "View your deposit and withdrawal history." },
      { property: "og:title", content: "Payment History — GD BOSS777" },
      { property: "og:description", content: "Deposit and withdrawal history." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <PaymentHistoryPage />
    </RequireAuth>
  ),
});

type TxRow = {
  id: string;
  kind: string;
  amount: number | string;
  status: string;
  method: string | null;
  created_at: string;
};

function PaymentHistoryPage() {
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["transactions", user?.id ?? null],
    queryFn: () => listTransactions(),
    enabled: Boolean(user),
  });

  const rows = ((data ?? []) as TxRow[]).filter((r) => r.kind === tab);

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
      <AppHeader title="Payment History" />
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain mx-auto w-full max-w-md px-4 py-5 pb-24 space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-accent/60 p-1">
          <TabBtn active={tab === "deposit"} onClick={() => setTab("deposit")}>
            <ArrowDownToLine className="h-4 w-4" /> Deposits
          </TabBtn>
          <TabBtn active={tab === "withdraw"} onClick={() => setTab("withdraw")}>
            <ArrowUpFromLine className="h-4 w-4" /> Withdrawals
          </TabBtn>
        </div>

        {!user ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm">
            <p className="text-muted-foreground">Login to see your payment history.</p>
            <Link
              to="/auth"
              className="mt-3 inline-block rounded-xl brand-gradient px-5 py-2.5 font-semibold text-white"
            >
              Login
            </Link>
          </div>
        ) : isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No {tab === "deposit" ? "deposits" : "withdrawals"} yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li
                key={r.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-sm flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-bold uppercase">
                    {r.kind} {r.method ? `· ${r.method}` : ""}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-extrabold text-[var(--brand)]">
                    ₹{formatBalance(Number(r.amount))}
                  </div>
                  <span
                    className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                      r.status === "approved"
                        ? "bg-[var(--success)]/15 text-[var(--success)]"
                        : r.status === "pending"
                          ? "bg-[var(--gold)]/20 text-[var(--brand-deep)]"
                          : "bg-destructive/15 text-destructive"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition ${
        active ? "brand-gradient text-white shadow" : "text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Wallet, PhoneCall } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { CONTACT } from "@/lib/contact";
import { useServerFn } from "@tanstack/react-start";
import { formatBalance, useBalance, useRefreshAccount } from "@/lib/wallet-store";
import { createFundRequest } from "@/lib/account.functions";
import { useAuth } from "@/hooks/use-auth";
import { RequireAuth } from "@/components/RequireAuth";

export const Route = createFileRoute("/withdraw")({
  head: () => ({
    meta: [
      { title: "Withdraw Fund — GD BOSS777" },
      {
        name: "description",
        content: "Withdraw your winnings to bank or UPI, minimum ₹1000 per request.",
      },
      { property: "og:title", content: "Withdraw Fund — GD BOSS777" },
      { property: "og:description", content: "Minimum withdrawal ₹1000 to bank or UPI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <WithdrawPage />
    </RequireAuth>
  ),
});

const MIN_WITHDRAW = 1000;
const QUICK = [1000, 2000, 5000, 10000];

function WithdrawPage() {
  const navigate = useNavigate();
  const balance = useBalance();
  const [amount, setAmount] = useState("1000");
  const [method, setMethod] = useState<"BANK" | "UPI">("UPI");
  const [upiId, setUpiId] = useState("");
  const value = Number(amount) || 0;
  const { user } = useAuth();
  const submitRequest = useServerFn(createFundRequest);
  const refreshAccount = useRefreshAccount();

  const submit = async () => {
    if (value < MIN_WITHDRAW) {
      toast.error(`Minimum withdrawal is ₹${MIN_WITHDRAW}`);
      return;
    }
    if (method === "UPI" && !/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(upiId)) {
      toast.error("Enter a valid UPI ID (e.g. name@upi)");
      return;
    }
    if (!user) {
      toast.error("Please login first");
      navigate({ to: "/auth" });
      return;
    }
    try {
      await submitRequest({
        data: {
          kind: "withdraw",
          amount: value,
          method,
          ...(method === "UPI" ? { reference: upiId } : {}),
        },
      });
      refreshAccount();
      toast.success(`Withdrawal request of ₹${value} submitted — pending admin approval`);
      navigate({ to: "/payment-history" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not submit request");
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
      <AppHeader title="Withdraw Fund" />
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain mx-auto w-full max-w-md px-4 py-5 pb-24 space-y-5">
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm text-center space-y-2">
          <h2 className="text-lg font-extrabold text-[var(--brand)]">Welcome To GD BOSS777</h2>
          <h3 className="text-base font-bold text-[var(--brand)]">Withdraw Fund Request</h3>
          <p className="text-sm font-semibold text-[var(--brand)]/90 leading-snug">
            Withdrawal request takes 24 hours to approve. Fund will be credited to your account in
            24 hours. Plz do not hurry, your money is always safe with GD BOSS777.
          </p>
          <p className="text-sm font-bold text-destructive">Note : Sunday Withdrawal Is Off</p>
          <div className="pt-3 border-t border-border space-y-1">
            <p className="text-sm font-bold text-[var(--brand)]">
              For Withdraw Related Query&apos;s Call Or Whatsapp
            </p>
            <a
              href={`tel:${CONTACT.phone}`}
              className="inline-flex items-center justify-center gap-2 text-base font-bold text-muted-foreground"
            >
              <PhoneCall className="h-5 w-5 text-[#25D366]" />
              {CONTACT.phone}
            </a>
          </div>
        </section>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="h-4 w-4 text-[var(--brand)]" /> Available balance
          </span>
          <span className="text-lg font-extrabold">₹{formatBalance(balance)}</span>
        </div>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
          <label htmlFor="wamount" className="text-sm font-semibold">
            Withdraw Amount (min ₹{MIN_WITHDRAW})
          </label>
          <input
            id="wamount"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            placeholder="1000"
          />
          <div className="grid grid-cols-4 gap-2">
            {QUICK.map((q) => (
              <button
                key={q}
                onClick={() => setAmount(String(q))}
                className={`rounded-xl border py-2.5 text-xs font-bold ${
                  value === q
                    ? "brand-gradient text-white border-transparent"
                    : "border-border bg-background"
                }`}
              >
                ₹{q}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {(["UPI", "BANK"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`rounded-xl border py-2.5 text-sm font-bold ${
                  method === m
                    ? "border-[var(--brand)] text-[var(--brand)] bg-accent/40"
                    : "border-border"
                }`}
              >
                {m === "UPI" ? "To UPI" : "To Bank"}
              </button>
            ))}
          </div>
          {method === "UPI" && (
            <div>
              <label htmlFor="wupi" className="text-sm font-semibold">
                Your UPI ID
              </label>
              <input
                id="wupi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value.trim())}
                placeholder="name@upi"
                className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">
            Withdrawals are processed daily between 10:00 AM and 6:00 PM.
          </p>
        </section>

        <button
          onClick={submit}
          className="w-full brand-gradient text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-[0.98]"
        >
          Request Withdrawal
        </button>
      </main>
      <BottomNav />
    </div>
  );
}

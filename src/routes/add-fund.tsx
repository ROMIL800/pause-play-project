import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pencil, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { useServerFn } from "@tanstack/react-start";
import { formatBalance, useBalance, useRefreshAccount } from "@/lib/wallet-store";
import { createFundRequest } from "@/lib/account.functions";
import { getDepositUpi, getIsAdmin, updateDepositUpi } from "@/lib/admin.functions";
import { useAuth } from "@/hooks/use-auth";
import { RequireAuth } from "@/components/RequireAuth";

export const Route = createFileRoute("/add-fund")({
  head: () => ({
    meta: [
      { title: "Add Fund — GD BOSS777" },
      {
        name: "description",
        content: "Pay via any UPI app and submit your UTR number to add funds instantly.",
      },
      { property: "og:title", content: "Add Fund — GD BOSS777" },
      { property: "og:description", content: "Pay by UPI and submit your UTR number." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <AddFundPage />
    </RequireAuth>
  ),
});

const MIN_DEPOSIT = 300;
const QUICK = [300, 500, 1000, 2000, 5000, 10000];

const UPI_APPS = [
  { key: "phonepe", label: "PhonePe", scheme: "phonepe://pay", bg: "#5F259F", fg: "#ffffff" },
  { key: "gpay", label: "Google Pay", scheme: "tez://upi/pay", bg: "#ffffff", fg: "#1a73e8" },
  { key: "paytm", label: "Paytm", scheme: "paytmmp://pay", bg: "#00BAF2", fg: "#002970" },
  { key: "bhim", label: "BHIM", scheme: "upi://pay", bg: "#0B3C71", fg: "#F58220" },
] as const;

function AddFundPage() {
  const navigate = useNavigate();
  const balance = useBalance();
  const { user } = useAuth();
  const submitRequest = useServerFn(createFundRequest);
  const saveUpi = useServerFn(updateDepositUpi);
  const refreshAccount = useRefreshAccount();

  const upiQuery = useQuery({
    queryKey: ["deposit-upi"],
    queryFn: () => getDepositUpi(),
    enabled: Boolean(user),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const adminQuery = useQuery({
    queryKey: ["is-admin", user?.id ?? null],
    queryFn: () => getIsAdmin(),
    enabled: Boolean(user),
  });

  const upi = upiQuery.data?.upiId ?? "";
  const isAdmin = Boolean(adminQuery.data?.isAdmin);

  const [amount, setAmount] = useState("300");
  const [utr, setUtr] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [draftUpi, setDraftUpi] = useState(upi);
  const [saving, setSaving] = useState(false);

  useEffect(() => setDraftUpi(upi), [upi]);

  const value = Number(amount) || 0;

  const openUpiApp = async (scheme: string) => {
    if (value < MIN_DEPOSIT) {
      toast.error(`Minimum deposit is ₹${MIN_DEPOSIT}`);
      return;
    }
    // Always pay to the UPI ID currently stored in the backend.
    const fresh = (await upiQuery.refetch()).data?.upiId ?? "";
    if (!fresh) {
      toast.error("Payments are temporarily unavailable. Please contact support.");
      return;
    }
    const query = `pa=${encodeURIComponent(fresh)}&pn=${encodeURIComponent(
      "GD BOSS777",
    )}&am=${value}&cu=INR&tn=${encodeURIComponent("GD BOSS777 deposit")}`;
    window.location.href = `${scheme}?${query}`;
  };

  const submit = async () => {
    if (value < MIN_DEPOSIT) {
      toast.error(`Minimum deposit is ₹${MIN_DEPOSIT}`);
      return;
    }
    if (!/^\d{12}$/.test(utr)) {
      toast.error("Enter the 12-digit UTR number from your payment app");
      return;
    }
    if (!user) {
      toast.error("Please login first");
      navigate({ to: "/auth" });
      return;
    }
    try {
      await submitRequest({ data: { kind: "deposit", amount: value, method: "UPI", utr } });
      refreshAccount();
      toast.success("Deposit submitted — balance updates after admin approval");
      navigate({ to: "/payment-history" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not submit request");
    }
  };

  const saveUpiId = async () => {
    setSaving(true);
    try {
      await saveUpi({ data: { upiId: draftUpi.trim() } });
      await upiQuery.refetch();
      setEditOpen(false);
      toast.success("UPI ID updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update UPI ID");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
      <AppHeader title="Add Fund" />
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain mx-auto w-full max-w-md px-4 py-5 pb-24 space-y-5">
        {isAdmin && (
          <section className="rounded-2xl border border-border bg-card p-3 shadow-sm flex items-center justify-between gap-3 text-sm">
            <div className="min-w-0">
              <p className="text-muted-foreground font-semibold text-xs">
                Payment UPI ID (admin only)
              </p>
              <p className="font-bold truncate">
                {upiQuery.isLoading ? "Loading…" : upi || "Not configured yet"}
              </p>
            </div>
            <button
              onClick={() => setEditOpen(true)}
              aria-label="Edit UPI ID"
              className="h-8 w-8 rounded-lg border border-border grid place-items-center shrink-0"
            >
              <Pencil className="h-4 w-4 text-[var(--brand)]" />
            </button>
          </section>
        )}

        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
          <div>
            <label htmlFor="amount" className="text-sm font-semibold">
              Amount (min ₹{MIN_DEPOSIT})
            </label>
            <input
              id="amount"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              placeholder="300"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {QUICK.map((q) => (
              <button
                key={q}
                onClick={() => setAmount(String(q))}
                className={`rounded-xl border py-2.5 text-sm font-bold transition ${
                  value === q
                    ? "brand-gradient text-white border-transparent"
                    : "border-border bg-background text-foreground"
                }`}
              >
                ₹{q}
              </button>
            ))}
          </div>

          <div>
            <p className="text-sm font-semibold mb-2">Pay using your UPI app</p>
            <div className="grid grid-cols-4 gap-2">
              {UPI_APPS.map((app) => (
                <button
                  key={app.key}
                  onClick={() => openUpiApp(app.scheme)}
                  aria-label={`Pay ₹${value || MIN_DEPOSIT} with ${app.label}`}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-background p-2 active:scale-95 transition"
                >
                  <span
                    className="h-12 w-12 rounded-2xl grid place-items-center shadow-sm border border-border/60 text-lg font-black"
                    style={{ background: app.bg, color: app.fg }}
                  >
                    {app.key === "gpay" ? "G" : app.key === "paytm" ? "P" : app.label[0]}
                  </span>
                  <span className="text-[10px] font-bold leading-tight text-center">
                    {app.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground text-center">
            Tap an app to pay ₹{value || MIN_DEPOSIT}. Choose your UPI ID and enter your PIN inside
            the app.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
          <label htmlFor="utr" className="text-sm font-semibold">
            UTR / Reference Number (12 digits)
          </label>
          <input
            id="utr"
            inputMode="numeric"
            value={utr}
            onChange={(e) => setUtr(e.target.value.replace(/\D/g, "").slice(0, 12))}
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            placeholder="123456789012"
          />
          <p className="text-[11px] text-muted-foreground">
            After paying, copy the 12-digit UTR from your UPI app and submit it here.
          </p>
        </section>

        <div className="rounded-2xl border border-border bg-card p-3 flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-[var(--brand)]" /> Wallet balance
          </span>
          <span className="font-bold">₹{formatBalance(balance)}</span>
        </div>

        <button
          onClick={submit}
          className="w-full gold-gradient text-[var(--brand-deep)] font-extrabold py-3.5 rounded-xl shadow-lg active:scale-[0.98]"
        >
          Submit Deposit Request
        </button>
      </main>

      {editOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center px-5">
          <div className="w-full max-w-sm rounded-2xl bg-card border border-border p-5 space-y-4">
            <h2 className="text-base font-extrabold">Edit UPI ID</h2>
            <input
              value={draftUpi}
              onChange={(e) => setDraftUpi(e.target.value.trim())}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              placeholder="name@bank"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setEditOpen(false)}
                className="rounded-xl border border-border py-2.5 font-bold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={saveUpiId}
                disabled={saving}
                className="rounded-xl brand-gradient text-white py-2.5 font-bold text-sm disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Landmark,
  Smartphone,
  History,
  FileClock,
  ChevronRight,
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { RequireAuth } from "@/components/RequireAuth";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "Funds — GD BOSS777" },
      {
        name: "description",
        content: "Add funds, withdraw winnings and manage bank or UPI details.",
      },
      { property: "og:title", content: "Funds — GD BOSS777" },
      {
        property: "og:description",
        content: "Add funds, withdraw winnings and manage payout details.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <FundsPage />
    </RequireAuth>
  ),
});

const ITEMS = [
  {
    to: "/add-fund",
    icon: ArrowDownToLine,
    title: "Add Fund",
    desc: "You can add fund to your wallet (min ₹300)",
  },
  {
    to: "/withdraw",
    icon: ArrowUpFromLine,
    title: "Withdraw Fund",
    desc: "You can withdraw winnings (min ₹1000)",
  },
  {
    to: "/bank-details",
    icon: Landmark,
    title: "Add Bank Details",
    desc: "You can add your bank details for withdrawals",
  },
  {
    to: "/upi-details",
    icon: Smartphone,
    title: "Add UPI Details",
    desc: "You can add your UPI details for withdrawals",
  },
  {
    to: "/payment-history",
    icon: History,
    title: "Fund Deposit History",
    desc: "You can see history of your deposit",
  },
  {
    to: "/payment-history",
    icon: FileClock,
    title: "Fund Withdraw History",
    desc: "You can see history of your fund withdrawals",
  },
] as const;

function FundsPage() {
  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
      <AppHeader title="Funds" />
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain mx-auto w-full max-w-md px-4 py-5 pb-24 space-y-3">
        {ITEMS.map(({ to, icon: Icon, title, desc }) => (
          <Link
            key={title}
            to={to}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm active:scale-[0.99] transition"
          >
            <div className="h-11 w-11 rounded-xl gold-gradient grid place-items-center shrink-0">
              <Icon className="h-5 w-5 text-[var(--brand-deep)]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-sm">{title}</div>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <span className="h-8 w-8 rounded-full bg-accent/60 grid place-items-center shrink-0">
              <ChevronRight className="h-4 w-4 text-[var(--brand)]" />
            </span>
          </Link>
        ))}
        <p className="pt-2 text-center text-[10px] text-muted-foreground">
          Deposits and withdrawals are reviewed by our team before your balance updates.
        </p>
      </main>
      <BottomNav />
    </div>
  );
}

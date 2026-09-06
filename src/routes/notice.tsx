import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/notice")({
  head: () => ({
    meta: [
      { title: "Notice Board — GD BOSS777" },
      { name: "description", content: "Rules and announcements for GD BOSS777 users." },
      { property: "og:title", content: "Notice Board — GD BOSS777" },
      { property: "og:description", content: "Rules and announcements." },
    ],
  }),
  component: NoticePage,
});

const RULES = [
  "Deposits and withdrawals are verified by our team before the wallet is updated.",
  "Predictions are for entertainment purposes only.",
  "Deposits and withdrawals are simulated.",
  "Be respectful to support staff on WhatsApp and chat.",
  "Users under 18 must not use this app.",
];

function NoticePage() {
  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
      <AppHeader title="Notice Board / Rules" />
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain mx-auto w-full max-w-md px-4 py-5 pb-24 space-y-3">
        <div className="rounded-2xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-4 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-[var(--brand-deep)] shrink-0" />
          <p className="text-sm">
            Please read the following rules carefully before placing any prediction.
          </p>
        </div>
        <ol className="space-y-2">
          {RULES.map((r, i) => (
            <li
              key={i}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm text-sm flex gap-3"
            >
              <span className="h-6 w-6 rounded-full brand-gradient text-white text-xs font-bold grid place-items-center shrink-0">
                {i + 1}
              </span>
              {r}
            </li>
          ))}
        </ol>
      </main>
      <BottomNav />
    </div>
  );
}

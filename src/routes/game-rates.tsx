import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/game-rates")({
  head: () => ({
    meta: [
      { title: "Game Rates — GD BOSS777" },
      { name: "description", content: "Payout rates for each prediction market." },
      { property: "og:title", content: "Game Rates — GD BOSS777" },
      { property: "og:description", content: "Payout rates for prediction markets." },
    ],
  }),
  component: GameRatesPage,
});

const RATES = [
  { name: "Single Digit", rate: "1 : 9.5" },
  { name: "Jodi Digit", rate: "1 : 95" },
  { name: "Single Panna", rate: "1 : 142" },
  { name: "Double Panna", rate: "1 : 285" },
  { name: "Triple Panna", rate: "1 : 950" },
  { name: "Half Sangam", rate: "1 : 1400" },
  { name: "Full Sangam", rate: "1 : 9500" },
];

function GameRatesPage() {
  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
      <AppHeader title="Game Rates" />
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain mx-auto w-full max-w-md px-4 py-5 pb-24">
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm divide-y divide-border">
          {RATES.map((r) => (
            <div key={r.name} className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm font-semibold">{r.name}</span>
              <span className="text-sm font-extrabold text-[var(--brand)]">{r.rate}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-[10px] text-muted-foreground">
          Rates are subject to change without notice.
        </p>
      </main>
      <BottomNav />
    </div>
  );
}

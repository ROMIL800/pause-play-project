import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { useBets, formatPlacedAt, type PlacedBet } from "@/lib/bet-store";
import { Clock, Gavel, IndianRupee, Trophy } from "lucide-react";
import { useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";

export const Route = createFileRoute("/my-bets")({
  head: () => ({
    meta: [
      { title: "My Bids — GD BOSS777" },
      { name: "description", content: "Your placed bids with full details." },
      { property: "og:title", content: "My Bids — GD BOSS777" },
      { property: "og:description", content: "Placed bids and their details." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <MyBets />
    </RequireAuth>
  ),
});

function MyBets() {
  const bets = useBets();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
      <AppHeader title="My Bids" />
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain mx-auto w-full max-w-md px-4 py-5 pb-24 space-y-3">
        {bets.length === 0 ? (
          <EmptyState />
        ) : (
          bets.map((b) => (
            <BetCard
              key={b.id}
              bet={b}
              open={openId === b.id}
              onToggle={() => setOpenId(openId === b.id ? null : b.id)}
            />
          ))
        )}
      </main>
      <BottomNav />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
      <div className="mx-auto h-14 w-14 rounded-full bg-accent/50 grid place-items-center mb-3">
        <Gavel className="h-6 w-6 text-[var(--brand)]" />
      </div>
      <div className="font-bold">No bids yet</div>
      <div className="text-xs text-muted-foreground mt-1">
        Place a bid from any market to see it here.
      </div>
      <Link
        to="/"
        className="mt-4 inline-block brand-gradient text-white text-sm font-bold px-4 py-2 rounded-lg"
      >
        Browse Markets
      </Link>
    </div>
  );
}

function BetCard({ bet, open, onToggle }: { bet: PlacedBet; open: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <button onClick={onToggle} className="w-full text-left p-4 active:bg-accent/30">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="font-bold truncate">{bet.gameName}</div>
            <div className="text-xs text-[var(--brand)] font-semibold mt-0.5">
              {bet.betTypeName}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" /> {formatPlacedAt(bet.placedAt)}
            </div>
          </div>
          <span
            className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full whitespace-nowrap ${
              bet.status === "Win"
                ? "bg-[var(--success)]/15 text-[var(--success)]"
                : bet.status === "Loss"
                  ? "bg-destructive/15 text-destructive"
                  : "bg-[var(--gold)]/20 text-[var(--brand-deep)]"
            }`}
          >
            {bet.status}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <Stat icon={<Gavel className="h-3 w-3" />} label="Bids" value={String(bet.totalBids)} />
          <Stat
            icon={<IndianRupee className="h-3 w-3" />}
            label="Points"
            value={String(bet.totalPoints)}
          />
          <Stat icon={<Trophy className="h-3 w-3" />} label="Rate" value={bet.rate} />
        </div>
        <div className="mt-2 text-[11px] text-center text-muted-foreground">
          {open ? "Hide details ▲" : "View details ▼"}
        </div>
      </button>

      {open && (
        <div className="border-t border-border bg-accent/20">
          <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 px-4 py-2 text-[11px] font-bold text-muted-foreground uppercase">
            <span>Digit</span>
            <span>Points</span>
            <span>Type</span>
          </div>
          {bet.bids.map((bid, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_1fr_1fr] gap-2 px-4 py-2 text-sm border-t border-border/60"
            >
              <span className="font-bold">{bid.digit}</span>
              <span className="font-semibold">₹{bid.points}</span>
              <span className="text-xs font-bold text-[var(--brand)]">{bid.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-accent/40 py-2">
      <div className="text-[10px] uppercase text-muted-foreground flex items-center justify-center gap-1">
        {icon}
        {label}
      </div>
      <div className="text-sm font-extrabold text-[var(--brand)]">{value}</div>
    </div>
  );
}

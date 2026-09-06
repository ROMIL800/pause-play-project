import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, Wallet, ArrowRight, Trash2, X } from "lucide-react";
import { GAMES, titleFromId } from "@/lib/mock-data";
import { getBetType } from "@/lib/bet-types";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { placeBet } from "@/lib/account.functions";
import { useAuth } from "@/hooks/use-auth";
import { useBalance, formatBalance, useRefreshAccount } from "@/lib/wallet-store";

export const Route = createFileRoute("/market/$id/$type")({
  head: ({ params }) => {
    const bt = getBetType(params.type);
    return {
      meta: [
        { title: `${bt?.name ?? "Bet"} — Place Bid` },
        { name: "description", content: `Place a ${bt?.name ?? "bid"}.` },
        { property: "og:title", content: `${bt?.name ?? "Bet"} — Place Bid` },
        { property: "og:description", content: `Place a ${bt?.name ?? "bid"}.` },
      ],
    };
  },
  component: BetTypePage,
});

type Row = { id: number; digit: string; points: number; type: "OPEN" | "CLOSE" };

function BetTypePage() {
  const { id, type } = Route.useParams();
  const navigate = useNavigate();
  const game = GAMES.find((g) => g.id === id);
  const bt = getBetType(type);
  const digits = bt?.digits ?? 1;
  const balance = useBalance();
  const { user } = useAuth();
  const submitBet = useServerFn(placeBet);
  const refreshAccount = useRefreshAccount();

  const [gameType, setGameType] = useState<"OPEN" | "CLOSE">("OPEN");
  const [digit, setDigit] = useState("");
  const [points, setPoints] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [confirming, setConfirming] = useState(false);

  const add = () => {
    if (digit.length !== digits) {
      toast.error(`Enter a ${digits}-digit number`);
      return;
    }
    const p = Number(points);
    if (!p || p < 10) {
      toast.error("Minimum 10 points");
      return;
    }
    setRows((r) => [...r, { id: Date.now(), digit, points: p, type: gameType }]);
    setDigit("");
    setPoints("");
  };

  const remove = (rid: number) => setRows((r) => r.filter((x) => x.id !== rid));

  const totalBids = rows.length;
  const totalPoints = rows.reduce((s, r) => s + r.points, 0);

  const review = () => {
    if (rows.length === 0) {
      toast.error("Add at least one bid");
      return;
    }
    if (!bt) {
      toast.error("Invalid bet type");
      return;
    }
    if (totalPoints > balance) {
      toast.error(
        `Insufficient balance — you need ₹${totalPoints}, wallet has ₹${formatBalance(balance)}`,
      );
      return;
    }
    setConfirming(true);
  };

  const submit = async () => {
    if (!bt) return;
    if (!user) {
      toast.error("Please login to place a bet");
      navigate({ to: "/auth" });
      return;
    }
    try {
      const res = await submitBet({
        data: {
          marketId: id,
          marketName: game?.name ?? titleFromId(id),
          betType: type,
          betTypeName: bt.name,
          rate: bt.rate,
          bids: rows.map((r) => ({ digit: r.digit, points: r.points, type: r.type })),
        },
      });
      refreshAccount();
      toast.success(
        `Bet placed successfully! ${totalBids} bids · ₹${totalPoints} · Balance ₹${formatBalance(res.balance)}`,
      );
      setRows([]);
      setConfirming(false);
      navigate({ to: "/my-bets" });
    } catch (e) {
      setConfirming(false);
      toast.error(e instanceof Error ? e.message : "Could not place bet");
    }
  };

  return (
    <div className="h-[100dvh] overflow-hidden bg-[oklch(0.96_0.005_260)] flex flex-col">
      <header className="brand-gradient text-white px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate({ to: "/market/$id", params: { id } })}
            className="p-1 -ml-1"
            aria-label="Back"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-base font-extrabold uppercase tracking-wide">
              {bt?.name ?? "Bet"}
            </h1>
            <div className="text-[11px] text-white/80">{game?.name ?? titleFromId(id)}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-bold">
          <Wallet className="h-5 w-5" />
          <span>₹{formatBalance(balance)}</span>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain mx-auto max-w-md w-full p-4 space-y-4">
        <div className="space-y-3 bg-card rounded-2xl border border-border p-4 shadow-sm">
          <Row label="Select Game Type :">
            <select
              value={gameType}
              onChange={(e) => setGameType(e.target.value as "OPEN" | "CLOSE")}
              className="w-full rounded-full bg-background border border-input pl-4 pr-8 py-2.5 text-sm font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              <option value="OPEN">OPEN</option>
              <option value="CLOSE">CLOSE</option>
            </select>
          </Row>

          <Row label={`Enter ${bt?.name.replace(/ Bulk$/, "") ?? "Digit"} :`}>
            <InputArrow
              inputMode="numeric"
              maxLength={digits}
              value={digit}
              onChange={(v) => setDigit(v.replace(/\D/g, "").slice(0, digits))}
              placeholder={"0".repeat(digits)}
            />
          </Row>

          <Row label="Enter Points :">
            <InputArrow
              inputMode="numeric"
              value={points}
              onChange={(v) => setPoints(v.replace(/\D/g, ""))}
              placeholder="10"
            />
          </Row>

          <div className="flex justify-end">
            <button
              onClick={add}
              className="w-2/3 brand-gradient text-white font-bold py-3 rounded-lg shadow active:scale-[0.98]"
            >
              ADD
            </button>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 px-4 py-2.5 text-xs font-bold text-muted-foreground border-b border-border">
            <span>Digit</span>
            <span>Points</span>
            <span>Type</span>
            <span className="w-6" />
          </div>
          {rows.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">
              No bids added yet.
            </div>
          ) : (
            rows.map((r) => (
              <div
                key={r.id}
                className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 px-4 py-2.5 text-sm border-b border-border last:border-b-0 items-center"
              >
                <span className="font-semibold">{r.digit}</span>
                <span className="font-semibold">{r.points}</span>
                <span className="text-xs font-bold text-[var(--brand)]">{r.type}</span>
                <button
                  onClick={() => remove(r.id)}
                  aria-label="Remove"
                  className="text-destructive p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </main>

      <footer className="sticky bottom-0 bg-card border-t-2 border-[var(--brand)]">
        <div className="mx-auto max-w-md grid grid-cols-3 items-center gap-3 px-4 py-3">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Bids</div>
            <div className="text-lg font-bold">{totalBids}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Points</div>
            <div className="text-lg font-bold">{totalPoints}</div>
          </div>
          <button
            onClick={review}
            className="brand-gradient text-white font-bold py-3 rounded-lg shadow active:scale-[0.98]"
          >
            SUBMIT
          </button>
        </div>
      </footer>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirming(false)} />
          <div className="relative w-full max-w-md bg-card rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl max-h-[85vh] flex flex-col">
            <div className="brand-gradient text-white px-4 py-3 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold uppercase">Confirm Your Bet</h2>
                <div className="text-[11px] text-white/80">
                  {game?.name ?? titleFromId(id)} · {bt?.name}
                </div>
              </div>
              <button onClick={() => setConfirming(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-4 py-3 grid grid-cols-3 gap-2 text-center border-b border-border">
              <div>
                <div className="text-[11px] text-muted-foreground">Rate</div>
                <div className="text-sm font-bold">{bt?.rate}</div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground">Total Bids</div>
                <div className="text-sm font-bold">{totalBids}</div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground">Total Points</div>
                <div className="text-sm font-bold text-[var(--brand)]">₹{totalPoints}</div>
              </div>
            </div>

            <div className="px-4 py-2 flex items-center justify-between text-xs border-b border-border">
              <span className="text-muted-foreground">Wallet balance</span>
              <span className="font-semibold">
                ₹{formatBalance(balance)} →{" "}
                <span className="text-[var(--brand)]">
                  ₹{formatBalance(Math.max(balance - totalPoints, 0))}
                </span>
              </span>
            </div>

            <div className="overflow-y-auto flex-1">
              <div className="grid grid-cols-3 gap-2 px-4 py-2 text-xs font-bold text-muted-foreground border-b border-border sticky top-0 bg-card">
                <span>Digit</span>
                <span>Points</span>
                <span>Type</span>
              </div>
              {rows.map((r) => (
                <div
                  key={r.id}
                  className="grid grid-cols-3 gap-2 px-4 py-2.5 text-sm border-b border-border last:border-b-0"
                >
                  <span className="font-semibold">{r.digit}</span>
                  <span className="font-semibold">₹{r.points}</span>
                  <span className="text-xs font-bold text-[var(--brand)]">{r.type}</span>
                </div>
              ))}
            </div>

            <div className="p-4 grid grid-cols-2 gap-3 border-t border-border">
              <button
                onClick={() => setConfirming(false)}
                className="py-3 rounded-lg border border-border font-bold text-foreground active:scale-[0.98]"
              >
                Edit Bids
              </button>
              <button
                onClick={submit}
                className="brand-gradient text-white font-bold py-3 rounded-lg shadow active:scale-[0.98]"
              >
                Confirm Bet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[1fr_1.3fr] items-center gap-3">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </div>
  );
}

function InputArrow({
  value,
  onChange,
  placeholder,
  inputMode,
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "numeric" | "text";
  maxLength?: number;
}) {
  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        className="w-full rounded-full bg-background border border-input pl-4 pr-11 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
      />
      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-muted grid place-items-center">
        <ArrowRight className="h-4 w-4 text-[var(--brand)]" />
      </span>
    </div>
  );
}

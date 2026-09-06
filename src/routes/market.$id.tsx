import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, Wallet, Trash2, X } from "lucide-react";
import { GAMES, titleFromId } from "@/lib/mock-data";
import { BET_TYPES, getBetType } from "@/lib/bet-types";
import { BetIcon, BET_ICON_VARIANTS } from "@/components/BetIcon";
import { SATTA_MARKETS, getSattaMarkets, sattaChartUrl } from "@/lib/satta.functions";

import { useBalance, formatBalance, useRefreshAccount } from "@/lib/wallet-store";
import { placeBet } from "@/lib/account.functions";
import { useAuth } from "@/hooks/use-auth";

import { toast } from "sonner";

export const Route = createFileRoute("/market/$id")({
  head: ({ params }) => {
    const g = GAMES.find((x) => x.id === params.id);
    const s = SATTA_MARKETS.find((x) => x.id === params.id);
    const name = g?.name ?? s?.name ?? titleFromId(params.id);

    return {
      meta: [
        { title: `${name} — Betting Interface` },
        { name: "description", content: `Choose a bet type and place bids for ${name}.` },
        { property: "og:title", content: `${name} — Betting Interface` },
        { property: "og:description", content: `Choose a bet type and place bids for ${name}.` },
      ],
    };
  },
  component: MarketPage,
});

const PASTELS = [
  "bg-rose-100",
  "bg-amber-50",
  "bg-blue-100",
  "bg-teal-50",
  "bg-violet-100",
  "bg-pink-100",
  "bg-emerald-100",
  "bg-orange-100",
  "bg-green-100",
  "bg-indigo-100",
  "bg-yellow-50",
  "bg-red-100",
  "bg-sky-100",
  "bg-rose-50",
];

type GameType = "OPEN" | "CLOSE" | "FLOWER";
type Row = { id: number; digit: string; points: number; type: GameType };

function MarketPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const game = GAMES.find((g) => g.id === id);
  const sattaMarket = SATTA_MARKETS.find((m) => m.id === id);
  const isSatta = !!sattaMarket;
  const marketName = game?.name ?? sattaMarket?.name ?? titleFromId(id);
  // Gali/Disawar markets only support the jodi digits option.
  const betTypes = isSatta ? BET_TYPES.filter((b) => b.slug === "jodi-digits") : BET_TYPES;
  const chartHref = isSatta ? sattaChartUrl(id) : null;

  const fetchSatta = useServerFn(getSattaMarkets);
  const { data: sattaData } = useQuery({
    queryKey: ["satta-markets"],
    queryFn: () => fetchSatta(),
    enabled: isSatta,
    refetchInterval: 60_000,
  });
  const sattaRow = sattaData?.markets.find((m) => m.id === id);
  const balance = useBalance();
  const { user } = useAuth();

  const submitBet = useServerFn(placeBet);
  const refreshAccount = useRefreshAccount();

  const [openType, setOpenType] = useState<string | null>(null);
  const bt = openType ? getBetType(openType) : undefined;
  const digits = bt?.digits ?? 1;

  const [gameType, setGameType] = useState<GameType>("OPEN");
  const [digit, setDigit] = useState("");
  const [points, setPoints] = useState("");
  const [rows, setRows] = useState<Row[]>([]);

  const totalBids = rows.length;
  const totalPoints = rows.reduce((s, r) => s + r.points, 0);

  const openSheet = (slug: string) => {
    setOpenType(slug);
    setRows([]);
    setDigit("");
    setPoints("");
    setGameType("OPEN");
  };

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

  const submit = async () => {
    if (!bt) return;
    if (rows.length === 0) {
      toast.error("Add at least one bid");
      return;
    }
    if (!user) {
      toast.error("Please login to place a bet");
      navigate({ to: "/auth" });
      return;
    }
    try {
      const res = await submitBet({
        data: {
          marketId: id,
          marketName: marketName,
          betType: bt.slug,
          betTypeName: bt.name,
          rate: bt.rate,
          bids: rows.map((r) => ({ digit: r.digit, points: r.points, type: r.type })),
        },
      });
      refreshAccount();
      toast.success(
        `Bet placed! ${totalBids} bids · ₹${totalPoints} · Balance ₹${formatBalance(res.balance)}`,
      );
      setOpenType(null);
      setRows([]);
      navigate({ to: "/my-bets" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not place bet");
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-[oklch(0.96_0.005_260)]">
      <header className="bg-[oklch(0.94_0.01_260)] px-4 py-4 flex items-center justify-between shadow-sm">
        <button onClick={() => navigate({ to: "/" })} className="p-1 -ml-1" aria-label="Back">
          <ChevronLeft className="h-6 w-6 text-foreground" />
        </button>
        <h1 className="text-lg font-extrabold uppercase tracking-wide text-center flex-1">
          {marketName}
        </h1>
        <div className="flex items-center gap-1.5 text-sm font-bold">
          <Wallet className="h-5 w-5" />
          <span>₹{formatBalance(balance)}</span>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain mx-auto w-full max-w-md pb-24">
        {isSatta && (
          <div className="m-4 rounded-2xl border border-border bg-card p-4 shadow-sm text-center">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Live Result · satta-king-fast.com
            </div>
            <div className="mt-1 text-3xl font-extrabold tabular-nums text-[var(--brand)]">
              {sattaRow?.result ?? "…"}
            </div>
            {sattaRow?.time && (
              <div className="text-[11px] font-semibold text-muted-foreground">
                Result at {sattaRow.time}
              </div>
            )}
            <a
              href={chartHref ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs font-bold text-[var(--brand)] underline"
            >
              Open full chart
            </a>
          </div>
        )}
        <div className="grid grid-cols-2">
          {betTypes.map((b, i) => {
            const variant = BET_ICON_VARIANTS[b.slug] ?? "dice1";
            return (
              <button
                key={b.slug}
                onClick={() => openSheet(b.slug)}
                className={`aspect-square flex flex-col items-center justify-center gap-3 active:opacity-80 transition ${PASTELS[i % PASTELS.length]}`}
              >
                <div className="h-[58%] aspect-square rounded-full bg-card grid place-items-center shadow-md">
                  <BetIcon variant={variant} className="h-[46%] w-[46%] text-[var(--gold)]" />
                </div>
                <div className="text-sm text-foreground/80 text-center leading-tight px-2">
                  {b.name}
                </div>
              </button>
            );
          })}
        </div>

        <div className="px-4 mt-4">
          {chartHref ? (
            <a
              href={chartHref}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center brand-gradient text-white font-bold py-3 rounded-xl shadow"
            >
              View Result Chart
            </a>
          ) : (
            <Link
              to="/chart/$id"
              params={{ id }}
              className="block w-full text-center brand-gradient text-white font-bold py-3 rounded-xl shadow"
            >
              View Result Chart
            </Link>
          )}
        </div>
      </main>

      {bt && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpenType(null)} />
          <div className="relative w-full max-w-md bg-card rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="brand-gradient text-white px-4 py-3 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold uppercase">Place Bet: {bt.name}</h2>
                <div className="text-[11px] text-white/80">
                  {marketName} · Rate {bt.rate}
                </div>
              </div>
              <button onClick={() => setOpenType(null)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 border-b border-border">
              {!isSatta && (
                <Field label="Game Type">
                  <select
                    value={gameType}
                    onChange={(e) => setGameType(e.target.value as GameType)}
                    className="w-full rounded-full bg-background border border-input px-4 py-2.5 text-sm font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  >
                    <option value="OPEN">Open</option>
                    <option value="CLOSE">Close</option>
                    <option value="FLOWER">Flower</option>
                  </select>
                </Field>
              )}

              <Field label="Enter Number">
                <input
                  value={digit}
                  inputMode="numeric"
                  maxLength={digits}
                  onChange={(e) => setDigit(e.target.value.replace(/\D/g, "").slice(0, digits))}
                  placeholder={"0".repeat(digits)}
                  className="w-full rounded-full bg-background border border-input px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </Field>

              <Field label="Enter Points">
                <input
                  value={points}
                  inputMode="numeric"
                  onChange={(e) => setPoints(e.target.value.replace(/\D/g, ""))}
                  placeholder="10"
                  className="w-full rounded-full bg-background border border-input px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </Field>

              <button
                onClick={add}
                className="w-full brand-gradient text-white font-bold py-3 rounded-lg shadow active:scale-[0.98]"
              >
                ADD
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 px-4 py-2 text-xs font-bold text-muted-foreground border-b border-border sticky top-0 bg-card">
                <span>Type</span>
                <span>Number</span>
                <span>Points</span>
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
                    <span className="text-xs font-bold text-[var(--brand)]">{r.type}</span>
                    <span className="font-semibold">{r.digit}</span>
                    <span className="font-semibold">₹{r.points}</span>
                    <button
                      onClick={() => setRows((x) => x.filter((y) => y.id !== r.id))}
                      aria-label="Remove"
                      className="text-destructive p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="grid grid-cols-3 items-center gap-3 px-4 py-3 border-t-2 border-[var(--brand)]">
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Total Bids</div>
                <div className="text-lg font-bold">{totalBids}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Total Points</div>
                <div className="text-lg font-bold text-[var(--brand)]">{totalPoints}</div>
              </div>
              <button
                onClick={submit}
                className="brand-gradient text-white font-bold py-3 rounded-lg shadow active:scale-[0.98]"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[1fr_1.3fr] items-center gap-3">
      <span className="text-sm font-medium text-foreground">{label} :</span>
      {children}
    </div>
  );
}

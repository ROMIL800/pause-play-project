import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  MessageCircle,
  Radio,
  Clock,
  BarChart3,
  Loader2,
  PlayCircle,
  RefreshCw,
} from "lucide-react";
import { slugify } from "@/lib/markets.functions";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";

import { GAMES, type Game } from "@/lib/mock-data";
import { getLiveMarkets, type LiveMarket } from "@/lib/markets.functions";
import { pickMarkets } from "@/lib/market-filter";

import {
  getPhase,
  nowMinutesIST,
  formatResult,
  PHASE_LABEL,
  PHASE_CLASS,
} from "@/lib/market-status";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Live Market Results & Betting — GD BOSS777" },
      {
        name: "description",
        content:
          "Live market results updating every 60 seconds, plus quick betting on every market.",
      },
      { property: "og:title", content: "Live Market Results & Betting — GD BOSS777" },
      {
        property: "og:description",
        content:
          "Live market results updating every 60 seconds, plus quick betting on every market.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const fetchMarkets = useServerFn(getLiveMarkets);
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setTick(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["live-markets"],
    queryFn: () => fetchMarkets(),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const live = pickMarkets(data?.markets ?? []);
  const failed = !!data?.error || (!!data && live.length === 0);

  return (
    <AppShell>
      <>
        <section className="grid grid-cols-3 gap-3">
          <QuickAction icon={ArrowDownToLine} label="Deposit" to="/add-fund" tone="brand" />
          <QuickAction icon={ArrowUpFromLine} label="Withdraw" to="/withdraw" tone="gold" />
          <QuickAction icon={MessageCircle} label="Support" to="/support" tone="success" />
        </section>

        <section className="grid grid-cols-2 gap-3">
          <Link
            to="/satta"
            className="rounded-2xl brand-gradient text-white p-3 shadow active:scale-[0.98] transition"
          >
            <div className="flex items-center gap-2 text-[13px] font-extrabold">
              <BarChart3 className="h-4 w-4" /> Gali Disawar
            </div>
            <p className="mt-1 text-[10px] text-white/80 leading-tight">
              Satta King Fast chart & betting
            </p>
          </Link>
          <Link
            to="/live-chart"
            className="rounded-2xl gold-gradient text-[var(--brand-deep)] p-3 shadow active:scale-[0.98] transition"
          >
            <div className="flex items-center gap-2 text-[13px] font-extrabold">
              <BarChart3 className="h-4 w-4" /> Live Charts
            </div>
            <p className="mt-1 text-[10px] leading-tight opacity-80">Kalyan & all market charts</p>
          </Link>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold">Live Result</h2>
              <p className="text-[11px] text-muted-foreground">
                {failed
                  ? "Live feed unavailable — showing offline markets"
                  : data
                    ? `Updated ${new Date(data.fetchedAt).toLocaleTimeString("en-IN")} · ${live.length} markets`
                    : "Fetching live results…"}
              </p>
            </div>

            <button
              onClick={() => refetch()}
              aria-label="Refresh live results"
              className="h-9 w-9 rounded-lg brand-gradient text-white grid place-items-center"
            >
              {isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </button>
          </div>

          {!data && (
            <div className="h-32 grid place-items-center">
              <Loader2 className="h-7 w-7 animate-spin text-[var(--brand)]" />
            </div>
          )}

          <div className="grid gap-3">
            {live.map((m) => (
              <LiveMarketCard key={m.id} market={m} tick={tick} />
            ))}
            {failed && GAMES.map((g) => <GameCard key={g.id} game={g} />)}
          </div>
        </section>

        <p className="pt-2 text-center text-[10px] text-muted-foreground">
          Live results sourced from dpbossss.boston.
        </p>
      </>
    </AppShell>
  );
}

function LiveMarketCard({ market, tick }: { market: LiveMarket; tick: number }) {
  const phase = getPhase(market.openTime, market.closeTime, nowMinutesIST(new Date(tick)));
  const playable = phase === "running";
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="font-bold text-base uppercase tracking-wide text-[var(--brand)] truncate">
          {market.name}
        </h3>
        <span className={`text-[11px] font-bold whitespace-nowrap ${PHASE_CLASS[phase]}`}>
          {PHASE_LABEL[phase]}
        </span>
      </div>

      <div className="text-center mb-4">
        <div className="text-xl font-extrabold tabular-nums text-foreground">
          {formatResult(market.result, phase)}
        </div>
        {(market.openTime || market.closeTime) && (
          <div className="mt-1 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            Open Bids: {market.openTime || "--"} | Close Bids: {market.closeTime || "--"}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {playable ? (
          <Link
            to="/market/$id"
            params={{ id: market.id }}
            className="flex-1 py-3 rounded-full brand-gradient text-white font-bold inline-flex items-center justify-center gap-2 shadow active:scale-[0.98] transition"
          >
            <PlayCircle className="h-5 w-5" /> Play Game
          </Link>
        ) : (
          <button
            disabled
            aria-disabled="true"
            className="flex-1 py-3 rounded-full bg-muted text-muted-foreground font-bold inline-flex items-center justify-center gap-2 cursor-not-allowed"
          >
            <PlayCircle className="h-5 w-5" /> Play Game
          </button>
        )}
        <Link
          to="/chart/$id"
          params={{ id: slugify(market.name) }}
          className="border border-border bg-background text-sm font-semibold px-4 py-3 rounded-full inline-flex items-center justify-center gap-1.5"
        >
          <BarChart3 className="h-4 w-4" /> Chart
        </Link>
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  to,
  tone,
}: {
  icon: typeof ArrowDownToLine;
  label: string;
  to: string;
  tone: "brand" | "gold" | "success";
}) {
  const toneClass =
    tone === "brand"
      ? "brand-gradient text-white"
      : tone === "gold"
        ? "gold-gradient text-[var(--brand-deep)]"
        : "bg-[var(--success)] text-white";
  return (
    <Link
      to={to}
      className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-sm active:scale-[0.97] transition"
    >
      <div className={`h-11 w-11 rounded-xl grid place-items-center shadow ${toneClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-xs font-semibold">{label}</span>
    </Link>
  );
}

function GameCard({ game }: { game: Game }) {
  const live = game.status === "Live";
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold truncate">{game.name}</h3>
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                live
                  ? "bg-[var(--success)]/15 text-[var(--success)]"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {live ? <Radio className="h-2.5 w-2.5 animate-pulse" /> : null}
              {game.status}
            </span>
          </div>
          {game.time && (
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {game.time}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase text-muted-foreground">Payout</div>
          <div className="text-sm font-extrabold text-[var(--brand)]">up to 9500x</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link
          to="/market/$id"
          params={{ id: game.id }}
          aria-disabled={!live}
          onClick={(e) => {
            if (!live) e.preventDefault();
          }}
          className={`brand-gradient text-white text-sm font-semibold py-2.5 rounded-xl active:scale-[0.98] text-center ${live ? "" : "opacity-40 grayscale pointer-events-none"}`}
        >
          Play Now
        </Link>
        <a
          href={`https://dpbossss.boston/panel-chart-record/${slugify(game.name)}.php`}
          target="_blank"
          rel="noopener noreferrer"
          className="border border-border bg-background text-sm font-semibold py-2.5 rounded-xl text-center inline-flex items-center justify-center gap-1.5"
        >
          <BarChart3 className="h-4 w-4" /> Chart
        </a>
      </div>
    </div>
  );
}

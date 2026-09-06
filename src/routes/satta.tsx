import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BarChart3, Clock, Loader2, PlayCircle } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { getSattaMarkets, sattaChartUrl, type SattaMarket } from "@/lib/satta.functions";

export const Route = createFileRoute("/satta")({
  head: () => ({
    meta: [
      { title: "Gali Disawar Satta King Fast Results — GD BOSS777" },
      {
        name: "description",
        content:
          "Live Gali, Disawar, Faridabad and Ghaziabad Satta King Fast results updating every 60 seconds, with instant betting.",
      },
      { property: "og:title", content: "Gali Disawar Satta King Fast Results — GD BOSS777" },
      { property: "og:description", content: "Live Gali & Disawar results with instant betting." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SattaPage,
});

function SattaPage() {
  const fetchSatta = useServerFn(getSattaMarkets);
  const { data } = useQuery({
    queryKey: ["satta-markets"],
    queryFn: () => fetchSatta(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
      <AppHeader title="Gali Disawar Chart" />
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain mx-auto w-full max-w-md px-4 py-5 pb-24 space-y-3">
        <p className="text-[11px] text-muted-foreground">
          {data
            ? `Updated ${new Date(data.fetchedAt).toLocaleTimeString("en-IN")} · live every 60s`
            : "Fetching live results…"}
        </p>
        {!data && (
          <div className="h-32 grid place-items-center">
            <Loader2 className="h-7 w-7 animate-spin text-[var(--brand)]" />
          </div>
        )}
        <div className="grid gap-3">
          {(data?.markets ?? []).map((m) => (
            <SattaCard key={m.id} market={m} />
          ))}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

function SattaCard({ market }: { market: SattaMarket }) {
  const waiting = market.result === "Waiting";
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="font-bold text-base uppercase tracking-wide text-[var(--brand)] truncate">
          {market.name}
        </h3>
        <span
          className={`text-[11px] font-bold whitespace-nowrap ${
            waiting ? "text-muted-foreground" : "text-[var(--success)]"
          }`}
        >
          {waiting ? "Waiting" : "Result Out"}
        </span>
      </div>

      <div className="text-center mb-4">
        <div className="text-2xl font-extrabold tabular-nums text-foreground">{market.result}</div>
        {market.time && (
          <div className="mt-1 flex items-center justify-center gap-1 text-[11px] font-semibold text-muted-foreground">
            <Clock className="h-3 w-3" />
            Result at {market.time}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Link
          to="/market/$id"
          params={{ id: market.id }}
          className="flex-1 py-3 rounded-full brand-gradient text-white font-bold inline-flex items-center justify-center gap-2 shadow active:scale-[0.98] transition"
        >
          <PlayCircle className="h-5 w-5" /> Play Game
        </Link>
        <a
          href={sattaChartUrl(market.id)}
          target="_blank"
          rel="noopener noreferrer"
          className="border border-border bg-background text-sm font-semibold px-4 py-3 rounded-full inline-flex items-center justify-center gap-1.5"
        >
          <BarChart3 className="h-4 w-4" /> Chart
        </a>
      </div>
    </div>
  );
}

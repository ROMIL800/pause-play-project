import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, Wallet, Clock, Loader2 } from "lucide-react";
import { GAMES, titleFromId } from "@/lib/mock-data";
import { SATTA_MARKETS, sattaChartUrl, getSattaMarkets } from "@/lib/satta.functions";
import { getDailyChart, getPanelChart } from "@/lib/charts.functions";
import { useBalance, formatBalance } from "@/lib/wallet-store";

function marketNameFor(id: string) {
  return (
    GAMES.find((x) => x.id === id)?.name ??
    SATTA_MARKETS.find((x) => x.id === id)?.name ??
    titleFromId(id)
  );
}

export const Route = createFileRoute("/chart/$id")({
  head: ({ params }) => {
    const name = marketNameFor(params.id);
    return {
      meta: [
        { title: `${name} — Result Chart` },
        { name: "description", content: `Live result chart for ${name}.` },
        { property: "og:title", content: `${name} — Result Chart` },
        { property: "og:description", content: `Live result chart for ${name}.` },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: ChartPage,
});

function ChartPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const name = marketNameFor(id);
  const isSatta = SATTA_MARKETS.some((m) => m.id === id);
  const balance = useBalance();

  const fetchSatta = useServerFn(getSattaMarkets);
  const fetchDaily = useServerFn(getDailyChart);
  const fetchPanel = useServerFn(getPanelChart);

  const { data: sattaData } = useQuery({
    queryKey: ["satta-markets"],
    queryFn: () => fetchSatta(),
    enabled: isSatta,
    refetchInterval: 60_000,
  });
  const sattaRow = sattaData?.markets.find((m) => m.id === id);

  const daily = useQuery({
    queryKey: ["daily-chart", id],
    queryFn: () => fetchDaily({ data: { marketId: id } }),
    enabled: isSatta,
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
  });

  const panel = useQuery({
    queryKey: ["panel-chart", id],
    queryFn: () => fetchPanel({ data: { marketId: id } }),
    enabled: !isSatta,
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
  });

  const loading = isSatta ? daily.isLoading : panel.isLoading;
  const error = isSatta ? (daily.data?.error ?? null) : (panel.data?.error ?? null);
  const sourceUrl = isSatta ? sattaChartUrl(id) : (panel.data?.source ?? "");

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
      <header className="brand-gradient text-white px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate({ to: "/" })} className="p-1 -ml-1" aria-label="Back">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-base font-extrabold uppercase tracking-wide">{name} Panel Chart</h1>
            <div className="text-[11px] text-white/80">Live results</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-bold">
          <Wallet className="h-5 w-5" />
          <span>₹{formatBalance(balance)}</span>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain mx-auto w-full max-w-md p-3 pb-24">
        {isSatta && (
          <div className="mb-3 rounded-2xl border border-border bg-card p-4 shadow-sm text-center">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {name} · Live Result
            </div>
            <div className="mt-1 text-3xl font-extrabold tabular-nums text-[var(--brand)]">
              {sattaRow?.result ?? "…"}
            </div>
            {sattaRow?.time && (
              <div className="mt-1 flex items-center justify-center gap-1 text-[11px] font-semibold text-muted-foreground">
                <Clock className="h-3 w-3" />
                Result at {sattaRow.time}
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="h-40 grid place-items-center">
            <Loader2 className="h-7 w-7 animate-spin text-[var(--brand)]" />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-border bg-card p-5 text-center space-y-2">
            <p className="text-sm font-bold text-foreground">Chart not available right now</p>
            <p className="text-[11px] text-muted-foreground">{error}</p>
            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs font-bold text-[var(--brand)] underline"
              >
                Open full chart
              </a>
            )}
          </div>
        )}

        {!loading && !error && isSatta && (
          <div className="rounded-lg overflow-hidden border-2 border-[var(--gold)] bg-card">
            <table className="w-full text-[11px] table-fixed">
              <tbody>
                {(daily.data?.days ?? []).map((d) => (
                  <tr key={d.date} className="border-b border-[var(--gold)] last:border-b-0">
                    <td className="p-2 text-[10px] font-bold text-foreground border-r border-[var(--gold)]">
                      {d.date}
                    </td>
                    <td
                      className={`p-2 text-center text-base font-extrabold ${
                        d.result ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {d.result || "--"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && !isSatta && (
          <div className="rounded-lg overflow-hidden border-2 border-[var(--gold)] bg-card">
            <table className="w-full text-[11px] table-fixed">
              <tbody>
                {(panel.data?.weeks ?? []).map((w) => (
                  <tr key={w.range} className="border-b border-[var(--gold)] last:border-b-0">
                    <td className="align-middle p-2 text-[10px] font-bold text-foreground border-r border-[var(--gold)] w-[70px]">
                      {w.range.split(" to ").map((d, i) => (
                        <div key={i} className="leading-tight">
                          {i === 1 ? <span className="text-muted-foreground">to</span> : null}
                          <div>{d}</div>
                        </div>
                      ))}
                    </td>
                    {w.days.map((d, i) => (
                      <td
                        key={i}
                        className={`p-1.5 text-center border-r border-[var(--gold)] last:border-r-0 ${
                          d.red ? "text-[var(--destructive)]" : "text-foreground"
                        }`}
                      >
                        <div className="text-[10px] font-bold">{d.open}</div>
                        <div className="text-sm font-extrabold leading-tight">{d.jodi}</div>
                        <div className="text-[10px] font-bold">{d.close}</div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && sourceUrl && (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block text-center text-[11px] font-bold text-[var(--brand)] underline"
          >
            Open full chart
          </a>
        )}
      </main>
    </div>
  );
}

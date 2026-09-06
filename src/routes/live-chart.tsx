import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, Loader2, RefreshCw, WifiOff } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useServerFn } from "@tanstack/react-start";
import { getLiveMarkets } from "@/lib/markets.functions";
import { pickMarkets } from "@/lib/market-filter";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

export const Route = createFileRoute("/live-chart")({
  head: () => ({
    meta: [
      { title: "Live Result Chart — GD BOSS777" },
      {
        name: "description",
        content: "Live result numbers for 30 markets, refreshed automatically every 60 seconds.",
      },
      { property: "og:title", content: "Live Result Chart — GD BOSS777" },
      {
        property: "og:description",
        content: "Auto-refreshing live result numbers for all 30 markets.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LiveChartPage,
});

const REFRESH_MS = 60_000;

type Point = { label: string; result: string; value: number };

function LiveChartPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const lastGood = useRef<Point[]>([]);

  const fetchMarkets = useServerFn(getLiveMarkets);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchMarkets();
      if (res.error) throw new Error(res.error);
      const parsed: Point[] = pickMarkets(res.markets).map((m) => ({
        label: m.name,
        result: m.result || "---",
        value: Number(m.result.replace(/[^0-9]/g, "").slice(0, 3)) || 0,
      }));
      if (parsed.length === 0) throw new Error("No result numbers found");
      lastGood.current = parsed;
      setData(parsed);
      setError(null);
      setUpdatedAt(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fetch failed");
      if (lastGood.current.length > 0) setData(lastGood.current);
    } finally {
      setLoading(false);
    }
  }, [fetchMarkets]);

  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
      <header className="brand-gradient text-white px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate({ to: "/" })} className="p-1 -ml-1" aria-label="Back">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-base font-extrabold uppercase tracking-wide">Live Result Chart</h1>
            <div className="text-[11px] text-white/80">
              {error
                ? updatedAt
                  ? `Last known data · ${new Date(updatedAt).toLocaleTimeString("en-IN")}`
                  : "Last known data unavailable"
                : updatedAt
                  ? `Updated ${new Date(updatedAt).toLocaleTimeString("en-IN")} · ${data.length} markets`
                  : "Fetching live data…"}
            </div>
          </div>
        </div>
        <button
          onClick={load}
          aria-label="Refresh now"
          className="h-9 w-9 rounded-lg bg-white/15 grid place-items-center"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <RefreshCw className="h-5 w-5" />
          )}
        </button>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain w-full px-3 py-4 pb-24 space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs">
            <WifiOff className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-destructive">
                Showing last known data — live update failed
              </p>
              <p className="text-muted-foreground">
                {updatedAt
                  ? `Last successful update: ${new Date(updatedAt).toLocaleString("en-IN")}`
                  : "No successful live update yet."}
              </p>
              <p className="text-muted-foreground">Reason: {error}. Auto retry every 60 seconds.</p>
            </div>
          </div>
        )}

        <section className="rounded-2xl border border-border bg-card p-3 shadow-sm relative">
          <h2 className="text-sm font-bold mb-3 px-1">30 Markets — Live Trend</h2>
          {loading && data.length === 0 ? (
            <div className="h-[380px] grid place-items-center">
              <Loader2 className="h-7 w-7 animate-spin text-[var(--brand)]" />
            </div>
          ) : (
            <div className="h-[380px] w-full">
              <Line
                data={{
                  labels: data.map((p) => p.label),
                  datasets: [
                    {
                      label: "Result",
                      data: data.map((p) => p.value),
                      borderColor: "#0033cc",
                      backgroundColor: "rgba(0,51,204,0.15)",
                      borderWidth: 3,
                      fill: true,
                      tension: 0.35,
                      pointRadius: 3,
                      pointBackgroundColor: "#0033cc",
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: {
                      beginAtZero: false,
                      ticks: { color: "#0033cc", font: { weight: "bold" } },
                    },
                    x: {
                      ticks: {
                        maxRotation: 90,
                        minRotation: 60,
                        font: { size: 10, weight: "bold" },
                      },
                    },
                  },
                }}
              />
            </div>
          )}
          {loading && data.length > 0 && (
            <span className="absolute top-3 right-3 text-[10px] text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> refreshing
            </span>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <h2 className="text-sm font-bold px-4 py-3 border-b border-border">Latest Results</h2>
          <div className="divide-y divide-border">
            {data.map((p) => (
              <div key={p.label} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-sm font-semibold uppercase truncate">{p.label}</span>
                <span className="text-lg font-extrabold tabular-nums text-[#0033cc] whitespace-nowrap">
                  {p.result}
                </span>
              </div>
            ))}
          </div>
        </section>

        <p className="text-center text-[10px] text-muted-foreground">
          Live results refresh every 60 seconds.
        </p>
      </main>
    </div>
  );
}

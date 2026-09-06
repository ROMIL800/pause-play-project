import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, Wallet, Clock } from "lucide-react";
import { GAMES, titleFromId } from "@/lib/mock-data";
import { SATTA_MARKETS, sattaChartUrl, getSattaMarkets } from "@/lib/satta.functions";
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
        { name: "description", content: `Weekly result chart for ${name}.` },
        { property: "og:title", content: `${name} — Result Chart` },
        { property: "og:description", content: `Weekly result chart for ${name}.` },
      ],
    };
  },
  component: ChartPage,
});

// Deterministic mock generator
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function buildWeeks(seed: number) {
  const r = rng(seed);
  const weeks: {
    range: string;
    days: { open: string; jodi: string; close: string; red: boolean }[];
  }[] = [];
  const start = new Date("2026-06-22");
  for (let w = 0; w < 6; w++) {
    const s = new Date(start);
    s.setDate(start.getDate() + w * 7);
    const e = new Date(s);
    e.setDate(s.getDate() + 6);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const days = Array.from({ length: 7 }, () => {
      const isRed = r() > 0.6;
      const open = String(Math.floor(r() * 900 + 100));
      const jodi = String(Math.floor(r() * 100)).padStart(2, "0");
      const close = String(Math.floor(r() * 900 + 100));
      return { open, jodi, close, red: isRed };
    });
    weeks.push({ range: `${fmt(s)} to ${fmt(e)}`, days });
  }
  // last row placeholders
  weeks.push({
    range: "2026-08-03 to 2026-08-03",
    days: [
      { open: "469", jodi: "99", close: "667", red: true },
      ...Array.from({ length: 6 }, () => ({ open: "***", jodi: "**", close: "***", red: false })),
    ],
  });
  return weeks;
}

function ChartPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const name = marketNameFor(id);
  const isSatta = SATTA_MARKETS.some((m) => m.id === id);
  const balance = useBalance();
  const fetchSatta = useServerFn(getSattaMarkets);
  const { data: sattaData } = useQuery({
    queryKey: ["satta-markets"],
    queryFn: () => fetchSatta(),
    enabled: isSatta,
    refetchInterval: 60_000,
  });
  const sattaRow = sattaData?.markets.find((m) => m.id === id);
  const seed =
    Array.from(id as string).reduce((a: number, c: string) => a + c.charCodeAt(0), 0) || 1;
  const weeks = buildWeeks(seed);

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
      <header className="brand-gradient text-white px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate({ to: "/" })} className="p-1 -ml-1" aria-label="Back">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-base font-extrabold uppercase tracking-wide">{name} Panel Chart</h1>
            <div className="text-[11px] text-white/80">Weekly results</div>
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
            <a
              href={sattaChartUrl(id)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs font-bold text-[var(--brand)] underline"
            >
              Open full chart
            </a>
          </div>
        )}
        <div className="rounded-lg overflow-hidden border-2 border-[var(--gold)] bg-card">
          <table className="w-full text-[11px] table-fixed">
            <tbody>
              {weeks.map((w) => (
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
        <p className="mt-3 text-center text-[10px] text-muted-foreground">
          Results update as markets declare.
        </p>
      </main>
    </div>
  );
}

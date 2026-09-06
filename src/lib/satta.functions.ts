import { createServerFn } from "@tanstack/react-start";

export type SattaMarket = {
  id: string;
  name: string;
  result: string;
  time: string;
};

export const SATTA_SOURCE = "https://satta-king-fast.com/";

/** The 5 Satta King Fast markets shown in the app, in display order. */
export const SATTA_MARKETS = [
  {
    id: "ghaziabad",
    name: "GHAZIABAD",
    chartUrl: "https://satta-king-fast.com/ghaziabad/satta-result-chart/gb/",
  },
  {
    id: "deshawer",
    name: "DESAWAR",
    chartUrl: "https://satta-king-fast.com/desawar/satta-result-chart/ds/",
  },
  { id: "gali", name: "GALI", chartUrl: "https://satta-king-fast.com/gali/satta-result-chart/gl/" },
  {
    id: "faridabad",
    name: "FARIDABAD",
    chartUrl: "https://satta-king-fast.com/faridabad/satta-result-chart/fb/",
  },
  {
    id: "new-ghaziabad",
    name: "NEW GHAZIABAD",
    chartUrl: "https://satta-king-fast.com/new-ghaziabad/satta-result-chart/ng/",
  },
] as const;

export function sattaChartUrl(id: string) {
  return SATTA_MARKETS.find((m) => m.id === id)?.chartUrl ?? SATTA_SOURCE;
}

const clean = (s: string) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function parseSatta(html: string): Record<string, { result: string; time: string }> {
  const out: Record<string, { result: string; time: string }> = {};
  const re =
    /<h3 class="game-name">([^<]+)<\/h3>\s*<h3 class="game-time">([^<]*)<\/h3>[\s\S]*?class="today-number">\s*<h3>([\s\S]*?)<\/h3>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const name = clean(m[1]).toUpperCase();
    const time = clean(m[2]).replace(/^at\s*/i, "");
    const raw = clean(m[3]);
    const result = !raw || /^(xx|--|-)$/i.test(raw) ? "Waiting" : raw;
    if (!out[name]) out[name] = { result, time };
  }
  return out;
}

export const getSattaMarkets = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ markets: SattaMarket[]; fetchedAt: number; error: string | null }> => {
    const fallback = SATTA_MARKETS.map((m) => ({ ...m, result: "Waiting", time: "" }));
    try {
      const res = await fetch(SATTA_SOURCE, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36",
          Accept: "text/html",
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const table = parseSatta(await res.text());
      const markets = SATTA_MARKETS.map((m) => ({
        id: m.id,
        name: m.name === "DESAWAR" ? "DESHAWER" : m.name,
        result: table[m.name]?.result ?? "Waiting",
        time: table[m.name]?.time ?? "",
      }));
      return { markets, fetchedAt: Date.now(), error: null };
    } catch (e) {
      return {
        markets: fallback,
        fetchedAt: Date.now(),
        error: e instanceof Error ? e.message : "Fetch failed",
      };
    }
  },
);

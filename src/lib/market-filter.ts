import type { LiveMarket } from "./markets.functions";

/** The 30 markets the app supports, in display order. */
export const MARKET_ORDER = [
  "karnataka day",
  "sridevi",
  "time bazar",
  "madhur day",
  "milan day",
  "rajdhani day",
  "supreme day",
  "kalyan",
  "sridevi night",
  "madhur night",
  "milan night",
  "kalyan night",
  "rajdhani night",
  "main bazar",
  "supreme night",
  "time bazar night",
  "karnataka night",
  "sridevi morning",
  "madhuri day",
  "madhuri night",
  "padmavati",
  "old main mumbai",
  "main mumbai",
  "kuber morning",
  "kuber day",
  "kuber night",
  "diamond day",
  "diamond night",
  "golden day",
  "golden night",
];

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function rank(name: string) {
  const n = norm(name);
  const i = MARKET_ORDER.findIndex((m) => n === m);
  if (i >= 0) return i;
  const j = MARKET_ORDER.findIndex((m) => n.startsWith(m) || m.startsWith(n));
  return j >= 0 ? j + 100 : 1000;
}

/** Keeps only the 30 supported markets (falls back to first 30 when names differ). */
export function pickMarkets(markets: LiveMarket[]): LiveMarket[] {
  const matched = markets
    .map((m) => ({ m, r: rank(m.name) }))
    .filter((x) => x.r < 1000)
    .sort((a, b) => a.r - b.r)
    .map((x) => x.m);
  const list = matched.length >= 10 ? matched : markets;
  const seen = new Set<string>();
  return list.filter((m) => (seen.has(m.id) ? false : seen.add(m.id))).slice(0, 30);
}

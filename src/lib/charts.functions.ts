import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Real result charts.
 *
 * Two different chart formats exist, matching the two live result sources the
 * app already uses:
 *  - Matka markets (Kalyan, Milan, …): weekly panel chart (open panna / jodi /
 *    close panna for Mon–Sat).
 *  - Gali/Disawar style markets: one two-digit result per calendar day.
 *
 * Nothing here is generated or cached with placeholder values — when the
 * upstream chart cannot be read the caller receives an explicit error and the
 * page says so instead of showing invented numbers.
 */

const UA =
  "Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36";

const MATKA_CHART_BASE = "https://dpbosssss.mobi/panel-chart-record";

export type PanelDay = { open: string; jodi: string; close: string; red: boolean };
export type PanelWeek = { range: string; days: PanelDay[] };
export type DailyResult = { date: string; result: string };

const strip = (s: string) =>
  s
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Parse a dpboss "panel chart record" page into weeks of six playing days. */
export function parsePanelChart(html: string): PanelWeek[] {
  const table = html.match(/<table[^>]*class="[^"]*panel-chart[^"]*"[\s\S]*?<\/table>/i)?.[0];
  if (!table) return [];
  const weeks: PanelWeek[] = [];
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let row: RegExpExecArray | null;
  while ((row = rowRe.exec(table)) !== null) {
    const cellRe = /<td([^>]*)>([\s\S]*?)<\/td>/gi;
    const cells: { attrs: string; text: string }[] = [];
    let cell: RegExpExecArray | null;
    while ((cell = cellRe.exec(row[1])) !== null) {
      cells.push({ attrs: cell[1] ?? "", text: strip(cell[2] ?? "") });
    }
    if (cells.length < 4) continue;
    const range = cells[0].text.replace(/\s+to\s+/i, " to ");
    if (!/\d{2}\/\d{2}\/\d{4}/.test(range)) continue;

    const days: PanelDay[] = [];
    for (let i = 1; i + 2 < cells.length; i += 3) {
      days.push({
        open: cells[i].text.replace(/\s+/g, ""),
        jodi: cells[i + 1].text.replace(/\s+/g, ""),
        close: cells[i + 2].text.replace(/\s+/g, ""),
        red: /class="[^"]*\br\b[^"]*"/i.test(cells[i + 1].attrs),
      });
    }
    if (days.length) weeks.push({ range, days });
  }
  return weeks;
}

/** Parse a satta-king-fast record chart page into one result per calendar day. */
export function parseDailyChart(html: string, marketName: string): DailyResult[] {
  const table = html.match(/<table[^>]*class="[^"]*chart-table[^"]*"[\s\S]*?<\/table>/i)?.[0];
  if (!table) return [];

  const headRow = table.match(/<tr[^>]*class=['"]?date-name['"]?[^>]*>([\s\S]*?)<\/tr>/i)?.[1];
  if (!headRow) return [];
  const headers = [...headRow.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map((m) =>
    strip(m[1]).toUpperCase(),
  );
  const wanted = marketName.toUpperCase().replace(/[^A-Z]/g, "");
  // Column names are abbreviated (GALI, DSWR, GZBD …) — match on the letters
  // the abbreviation and the market name have in common, in order.
  let col = headers.findIndex((h) => h === wanted);
  if (col === -1) {
    col = headers.findIndex((h) => {
      let i = 0;
      for (const ch of wanted) if (ch === h[i]) i++;
      return h.length >= 3 && i >= h.length;
    });
  }
  if (col === -1) return [];

  const out: DailyResult[] = [];
  const rowRe = /<tr[^>]*class=['"]?day-number['"]?[^>]*>([\s\S]*?)<\/tr>/gi;
  let row: RegExpExecArray | null;
  while ((row = rowRe.exec(table)) !== null) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => strip(m[1]));
    const dayCell = row[1].match(/<td[^>]*class="day"[^>]*title="([^"]+)"/i)?.[1];
    const value = cells[col + 1] ?? "";
    if (!dayCell) continue;
    out.push({ date: dayCell, result: value && !/^(xx|--|-)$/i.test(value) ? value : "" });
  }
  return out;
}

async function loadHtml(url: string) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" } });
  if (!res.ok) throw new Error(`Chart source returned HTTP ${res.status}`);
  return res.text();
}

/** Weekly panel chart (open / jodi / close) for a matka market. */
export const getPanelChart = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ marketId: z.string().min(1).max(60) }).parse(input))
  .handler(
    async ({
      data,
    }): Promise<{ weeks: PanelWeek[]; source: string; fetchedAt: number; error: string | null }> => {
      const slug = data.marketId.replace(/[^a-z0-9-]/gi, "").toLowerCase();
      const source = `${MATKA_CHART_BASE}/${slug}.php`;
      try {
        const weeks = parsePanelChart(await loadHtml(source));
        if (weeks.length === 0) throw new Error("No chart rows published for this market yet");
        // Newest weeks first, matching how results are read in the app.
        return { weeks: weeks.reverse(), source, fetchedAt: Date.now(), error: null };
      } catch (e) {
        return {
          weeks: [],
          source,
          fetchedAt: Date.now(),
          error: e instanceof Error ? e.message : "Chart unavailable",
        };
      }
    },
  );

/** Day-by-day record chart for a Gali/Disawar style market. */
export const getDailyChart = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ marketId: z.string().min(1).max(60) }).parse(input))
  .handler(
    async ({
      data,
    }): Promise<{
      days: DailyResult[];
      source: string;
      fetchedAt: number;
      error: string | null;
    }> => {
      const { SATTA_MARKETS, sattaChartUrl } = await import("@/lib/satta.functions");
      const market = SATTA_MARKETS.find((m) => m.id === data.marketId);
      const source = sattaChartUrl(data.marketId);
      try {
        if (!market) throw new Error("Unknown market");
        const days = parseDailyChart(await loadHtml(source), market.name);
        if (days.length === 0) throw new Error("No chart rows published for this market yet");
        return { days, source, fetchedAt: Date.now(), error: null };
      } catch (e) {
        return {
          days: [],
          source,
          fetchedAt: Date.now(),
          error: e instanceof Error ? e.message : "Chart unavailable",
        };
      }
    },
  );

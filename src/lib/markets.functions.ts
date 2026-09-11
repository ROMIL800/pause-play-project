import { createServerFn } from "@tanstack/react-start";

export type LiveMarket = {
  id: string;
  name: string;
  result: string;
  openTime: string;
  closeTime: string;
};

const SOURCE = "https://dpboss.tax/";

export function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/\[|\]/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function decode(s: string) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseMarkets(html: string): LiveMarket[] {
  const out: LiveMarket[] = [];
  const seen = new Set<string>();
  const re =
    /<h4[^>]*>([^<]{3,60})<\/h4>\s*<span[^>]*>([\s\S]{0,60}?)<\/span>\s*<p[^>]*>([\s\S]{0,80}?)<\/p>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const name = decode(m[1]);
    const result = decode(m[2]);
    const times = decode(m[3]);
    if (!name || !/^[A-Z0-9 [\]\-.]+$/i.test(name)) continue;
    if (/add market/i.test(name) || /^\+?\d{8,}$/.test(result.replace(/\s/g, ""))) continue;
    const id = slugify(name);
    if (!id || seen.has(id)) continue;
    const parts = times.split(/\s{2,}|\s(?=\d{1,2}:\d{2})/).filter(Boolean);
    seen.add(id);
    out.push({
      id,
      name,
      result: result || "Loading...",
      openTime: parts[0]?.trim() ?? "",
      closeTime: parts[1]?.trim() ?? "",
    });
  }
  return out;
}

export const getLiveMarkets = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ markets: LiveMarket[]; fetchedAt: number; error: string | null }> => {
    try {
      const res = await fetch(SOURCE, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36",
          Accept: "text/html",
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const markets = parseMarkets(html);
      if (markets.length === 0) throw new Error("No markets found");
      return { markets, fetchedAt: Date.now(), error: null };
    } catch (e) {
      return {
        markets: [],
        fetchedAt: Date.now(),
        error: e instanceof Error ? e.message : "Fetch failed",
      };
    }
  },
);

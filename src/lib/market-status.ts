export type MarketPhase = "waiting" | "running" | "closed";

/** Parses "10:00 AM" / "10:00AM" / "22:15" into minutes since midnight. */
export function parseTime(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const m = raw.trim().match(/(\d{1,2}):(\d{2})\s*([AaPp][Mm])?/);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const ap = m[3]?.toLowerCase();
  if (Number.isNaN(h) || Number.isNaN(min)) return null;
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  return h * 60 + min;
}

/** Current minutes since midnight in IST (markets run on India time). */
export function nowMinutesIST(date = new Date()): number {
  const ist = new Date(date.getTime() + (330 + date.getTimezoneOffset()) * 60_000);
  return ist.getHours() * 60 + ist.getMinutes();
}

export function getPhase(
  openTime: string | undefined,
  closeTime: string | undefined,
  now = nowMinutesIST(),
): MarketPhase {
  const open = parseTime(openTime);
  const close = parseTime(closeTime);
  if (open === null || close === null) return "running";
  // overnight markets (close time past midnight)
  const end = close < open ? close + 24 * 60 : close;
  const cur = now < open && close < open ? now + 24 * 60 : now;
  if (cur < open) return "waiting";
  if (cur <= end) return "running";
  return "closed";
}

const PLACEHOLDER = "***-**-***";

/**
 * Formats a raw result like "178-60-345" for the given phase:
 * waiting -> "***-**-***", running -> "178-6*-***", closed -> full result.
 */
export function formatResult(raw: string, phase: MarketPhase): string {
  const clean = (raw ?? "").trim();
  if (phase === "waiting") return PLACEHOLDER;
  if (!clean || /loading/i.test(clean)) return phase === "closed" ? PLACEHOLDER : "***-**-***";
  if (phase === "closed") return clean;

  const parts = clean.split("-").map((p) => p.trim());
  if (parts.length < 2) return `${parts[0] ?? "***"}-**-***`;
  const openPanna = parts[0] || "***";
  const jodi = parts[1] || "**";
  const jodiMasked = jodi.length >= 1 ? `${jodi[0]}*` : "**";
  return `${openPanna}-${jodiMasked}-***`;
}

export const PHASE_LABEL: Record<MarketPhase, string> = {
  waiting: "Waiting",
  running: "Running now",
  closed: "Closed for Today",
};

export const PHASE_CLASS: Record<MarketPhase, string> = {
  waiting: "text-muted-foreground",
  running: "text-[var(--success)]",
  closed: "text-destructive",
};

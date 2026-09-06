type Variant = "dice1" | "dice2" | "card-spade" | "cards-chip" | "cards-heart";

const SPADE_PATH =
  "M0 -7 C 2.6 -3.6 6 -1.9 6 1 C 6 3.2 4.3 4.5 2.6 4.5 C 1.6 4.5 0.8 4.1 0.3 3.4 C 0.6 5.2 1.1 6.3 1.8 7 L -1.8 7 C -1.1 6.3 -0.6 5.2 -0.3 3.4 C -0.8 4.1 -1.6 4.5 -2.6 4.5 C -4.3 4.5 -6 3.2 -6 1 C -6 -1.9 -2.6 -3.6 0 -7 Z";

const HEART_PATH =
  "M0 7 C -6 2.6 -6.5 -0.6 -4.6 -2.6 C -2.9 -4.4 -0.7 -3.4 0 -1.6 C 0.7 -3.4 2.9 -4.4 4.6 -2.6 C 6.5 -0.6 6 2.6 0 7 Z";

/** Flat outline icons matching the betting-grid reference style. */
export function BetIcon({ variant, className }: { variant: Variant; className?: string }) {
  const common = {
    viewBox: "0 0 48 48",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };

  if (variant === "dice1" || variant === "dice2") {
    return (
      <svg {...common}>
        <rect x="10" y="10" width="28" height="28" rx="2" />
        {variant === "dice1" ? (
          <circle cx="24" cy="24" r="4.5" fill="currentColor" stroke="none" />
        ) : (
          <>
            <circle cx="19" cy="29" r="4" fill="currentColor" stroke="none" />
            <circle cx="30" cy="19" r="4" fill="currentColor" stroke="none" />
          </>
        )}
      </svg>
    );
  }

  if (variant === "card-spade") {
    return (
      <svg {...common}>
        <g transform="rotate(-12 24 24)">
          <rect x="14" y="9" width="20" height="30" rx="2.5" />
          <path d={SPADE_PATH} transform="translate(24 24)" />
        </g>
      </svg>
    );
  }

  if (variant === "cards-heart") {
    return (
      <svg {...common}>
        <rect x="9" y="12" width="18" height="26" rx="2.5" transform="rotate(-10 18 25)" />
        <rect x="21" y="9" width="18" height="27" rx="2.5" transform="rotate(6 30 22)" />
        <path d={HEART_PATH} transform="translate(30 22)" />
      </svg>
    );
  }

  // cards-chip: two cards with a poker chip badge
  return (
    <svg {...common}>
      <rect x="8" y="12" width="17" height="25" rx="2.5" transform="rotate(-14 16 24)" />
      <rect x="20" y="8" width="17" height="25" rx="2.5" transform="rotate(8 28 20)" />
      <path d={SPADE_PATH} transform="translate(28 19) scale(0.85)" />
      <circle cx="31" cy="34" r="7" />
      <circle cx="31" cy="34" r="3" />
      <path d="M31 27v2M31 39v2M24 34h2M36 34h2" />
    </svg>
  );
}

export const BET_ICON_VARIANTS: Record<string, Variant> = {
  "single-digits": "dice1",
  "single-digits-bulk": "dice1",
  "jodi-digits": "dice2",
  "jodi-digits-bulk": "dice2",
  "single-pana": "card-spade",
  "single-pana-bulk": "card-spade",
  "double-pana": "cards-chip",
  "double-pana-bulk": "cards-chip",
  "jodi-family": "dice2",
  "jodi-group": "dice2",
  "total-jodi": "dice2",
  "half-sangam": "cards-heart",
  "full-sangam": "cards-heart",
  "sp-motor": "card-spade",
  "dp-motor": "cards-chip",
  "sp-dp-tp": "cards-heart",
  "pana-family": "cards-chip",
};

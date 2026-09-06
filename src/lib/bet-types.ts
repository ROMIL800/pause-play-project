export type BetType = {
  slug: string;
  name: string;
  tint: string; // tailwind bg class for tile
  digits: 1 | 2 | 3;
  rate: string;
};

export const BET_TYPES: BetType[] = [
  { slug: "single-digits", name: "Single Digits", tint: "bg-rose-100", digits: 1, rate: "1 : 9.5" },
  {
    slug: "single-digits-bulk",
    name: "Single Digits Bulk",
    tint: "bg-amber-100",
    digits: 1,
    rate: "1 : 9.5",
  },
  { slug: "jodi-digits", name: "Jodi Digits", tint: "bg-sky-100", digits: 2, rate: "1 : 95" },
  {
    slug: "jodi-digits-bulk",
    name: "Jodi Digits Bulk",
    tint: "bg-teal-100",
    digits: 2,
    rate: "1 : 95",
  },
  { slug: "single-pana", name: "Single Pana", tint: "bg-violet-100", digits: 3, rate: "1 : 142" },
  {
    slug: "single-pana-bulk",
    name: "Single Pana Bulk",
    tint: "bg-pink-100",
    digits: 3,
    rate: "1 : 142",
  },
  { slug: "double-pana", name: "Double Pana", tint: "bg-emerald-100", digits: 3, rate: "1 : 285" },
  {
    slug: "double-pana-bulk",
    name: "Double Pana Bulk",
    tint: "bg-orange-100",
    digits: 3,
    rate: "1 : 285",
  },
  { slug: "jodi-family", name: "Jodi Family", tint: "bg-lime-100", digits: 2, rate: "1 : 95" },
  { slug: "jodi-group", name: "Jodi Group", tint: "bg-indigo-100", digits: 2, rate: "1 : 95" },
  { slug: "total-jodi", name: "Total Jodi", tint: "bg-yellow-100", digits: 2, rate: "1 : 95" },
  { slug: "half-sangam", name: "Half Sangam", tint: "bg-fuchsia-100", digits: 3, rate: "1 : 1400" },
  { slug: "full-sangam", name: "Full Sangam", tint: "bg-blue-100", digits: 3, rate: "1 : 9500" },
  { slug: "sp-motor", name: "SP Motor", tint: "bg-red-100", digits: 3, rate: "1 : 142" },
  { slug: "dp-motor", name: "DP Motor", tint: "bg-orange-100", digits: 3, rate: "1 : 285" },
  { slug: "sp-dp-tp", name: "SP,DP,TP", tint: "bg-yellow-100", digits: 3, rate: "1 : 950" },
  { slug: "pana-family", name: "Pana Family", tint: "bg-rose-100", digits: 3, rate: "1 : 142" },
];

export function getBetType(slug: string) {
  return BET_TYPES.find((b) => b.slug === slug);
}

import type { LucideIcon } from "lucide-react";
import {
  Dice1,
  Layers,
  Dice2,
  Grid2x2,
  Spade,
  Boxes,
  Diamond,
  Grid3x3,
  Users,
  Group,
  Sigma,
  GitMerge,
  Combine,
  Zap,
  Flame,
  Shapes,
  Home,
  Circle,
} from "lucide-react";

export const BET_ICONS: Record<string, LucideIcon> = {
  "single-digits": Dice1,
  "single-digits-bulk": Layers,
  "jodi-digits": Dice2,
  "jodi-digits-bulk": Grid2x2,
  "single-pana": Spade,
  "single-pana-bulk": Boxes,
  "double-pana": Diamond,
  "double-pana-bulk": Grid3x3,
  "jodi-family": Users,
  "jodi-group": Group,
  "total-jodi": Sigma,
  "half-sangam": GitMerge,
  "full-sangam": Combine,
  "sp-motor": Zap,
  "dp-motor": Flame,
  "sp-dp-tp": Shapes,
  "pana-family": Home,
  default: Circle,
};

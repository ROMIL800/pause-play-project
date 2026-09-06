export type Game = {
  id: string;
  name: string;
  status: "Live" | "Closed";
  time?: string;
};

export const GAMES: Game[] = [
  { id: "karnataka-day", name: "Karnataka Day", status: "Closed", time: "10:10 AM - 11:10 AM" },
  { id: "sridevi-day", name: "Sridevi Day", status: "Closed", time: "11:40 AM - 12:40 PM" },
  { id: "time-bazar", name: "Time Bazar", status: "Closed", time: "01:05 PM - 02:05 PM" },
  { id: "madhur-day", name: "Madhur Day", status: "Closed", time: "01:30 PM - 02:30 PM" },
  { id: "milan-day", name: "Milan Day", status: "Closed", time: "03:05 PM - 05:05 PM" },
  { id: "rajdhani-day", name: "Rajdhani Day", status: "Closed", time: "03:10 PM - 05:10 PM" },
  { id: "supreme-day", name: "Supreme Day", status: "Closed", time: "03:40 PM - 05:40 PM" },
  { id: "kalyan", name: "Kalyan", status: "Closed", time: "04:05 PM - 06:05 PM" },
  { id: "karnataka-night", name: "Karnataka Night", status: "Closed", time: "06:45 PM - 07:45 PM" },
  { id: "sridevi-night", name: "Sridevi Night", status: "Closed", time: "07:20 PM - 08:20 PM" },
  { id: "madhur-night", name: "Madhur Night", status: "Live", time: "08:30 PM - 10:30 PM" },
  { id: "supreme-night", name: "Supreme Night", status: "Live", time: "08:50 PM - 10:50 PM" },
  { id: "milan-night", name: "Milan Night", status: "Live", time: "09:05 PM - 11:05 PM" },
  { id: "kalyan-night", name: "Kalyan Night", status: "Closed", time: "09:35 PM - 11:40 PM" },
  { id: "rajdhani-night", name: "Rajdhani Night", status: "Live", time: "09:35 PM - 11:45 PM" },
  { id: "main-bazar", name: "Main Bazar", status: "Live", time: "09:50 PM - 11:57 PM" },
];

export const PASSBOOK = [
  { date: "27 Jul", game: "Karnataka Day", number: "247", amount: 100, result: "Win", payout: 900 },
  { date: "26 Jul", game: "Sridevi Day", number: "58", amount: 50, result: "Loss", payout: 0 },
  { date: "26 Jul", game: "Time Bazar", number: "139", amount: 200, result: "Win", payout: 1800 },
  { date: "25 Jul", game: "Milan Day", number: "7", amount: 100, result: "Loss", payout: 0 },
  { date: "24 Jul", game: "Karnataka Day", number: "36", amount: 150, result: "Win", payout: 1350 },
  { date: "23 Jul", game: "Rajdhani Night", number: "482", amount: 300, result: "Loss", payout: 0 },
  { date: "22 Jul", game: "Sridevi Day", number: "91", amount: 75, result: "Win", payout: 675 },
] as const;

export const TREND_30D = Array.from({ length: 30 }, (_, i) => {
  const base = 500 + Math.sin(i / 3) * 180 + Math.cos(i / 5) * 90;
  const noise = ((i * 37) % 120) - 60;
  return { day: i + 1, value: Math.round(base + noise) };
});

export const FREQ_NUMBERS = [
  { n: "0", c: 42 },
  { n: "1", c: 51 },
  { n: "2", c: 38 },
  { n: "3", c: 64 },
  { n: "4", c: 47 },
  { n: "5", c: 72 },
  { n: "6", c: 33 },
  { n: "7", c: 58 },
  { n: "8", c: 45 },
  { n: "9", c: 61 },
];

/** Human-readable market name from a slug id (used for live markets). */
export function titleFromId(id: string) {
  return id
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

import { useQuery } from "@tanstack/react-query";
import { listBets } from "@/lib/account.functions";
import { useAuth } from "@/hooks/use-auth";

export type PlacedBid = {
  digit: string;
  points: number;
  type: "OPEN" | "CLOSE" | "FLOWER";
};

export type PlacedBet = {
  id: string;
  gameId: string;
  gameName: string;
  betType: string;
  betTypeName: string;
  rate: string;
  bids: PlacedBid[];
  totalBids: number;
  totalPoints: number;
  placedAt: number;
  status: "Pending" | "Win" | "Loss";
};

type BetRow = {
  id: string;
  market_id: string;
  market_name: string;
  bet_type: string;
  bet_type_name: string;
  rate: string | null;
  bids: unknown;
  total_bids: number;
  total_points: number | string;
  status: string;
  created_at: string;
};

function toPlacedBet(row: BetRow): PlacedBet {
  return {
    id: row.id,
    gameId: row.market_id,
    gameName: row.market_name,
    betType: row.bet_type,
    betTypeName: row.bet_type_name,
    rate: row.rate ?? "",
    bids: Array.isArray(row.bids) ? (row.bids as PlacedBid[]) : [],
    totalBids: row.total_bids,
    totalPoints: Number(row.total_points),
    placedAt: new Date(row.created_at).getTime(),
    status: (row.status as PlacedBet["status"]) ?? "Pending",
  };
}

export function useBets(): PlacedBet[] {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["bets", user?.id ?? null],
    queryFn: () => listBets(),
    enabled: Boolean(user),
    staleTime: 10_000,
  });
  return ((data ?? []) as BetRow[]).map(toPlacedBet);
}

export function formatPlacedAt(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

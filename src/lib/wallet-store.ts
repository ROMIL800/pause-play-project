import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAccount } from "@/lib/account.functions";
import { useAuth } from "@/hooks/use-auth";

export function formatBalance(value: number) {
  return value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function useAccount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["account", user?.id ?? null],
    queryFn: () => getAccount(),
    enabled: Boolean(user),
    staleTime: 10_000,
    // Admin approvals happen outside this device, so poll for the new balance.
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

/** Live wallet balance for the signed-in user (0 when signed out). */
export function useBalance(): number {
  const { data } = useAccount();
  return Number(data?.balance ?? 0);
}

export function useRefreshAccount() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ["account"] });
    void qc.invalidateQueries({ queryKey: ["transactions"] });
    void qc.invalidateQueries({ queryKey: ["bets"] });
  };
}

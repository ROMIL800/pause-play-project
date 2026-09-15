import { createServerFn } from "@tanstack/react-start";

export type PublicFundActivity = {
  id: string;
  kind: "deposit" | "withdraw";
  amount: number;
  createdAt: string;
};

/** Returns only approved, non-identifying activity; no customer identity leaves the server. */
export const getPublicFundActivity = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicFundActivity[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("transactions")
      .select("id, kind, amount, created_at")
      .in("kind", ["deposit", "withdraw"])
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(6);

    if (error) return [];
    return (data ?? []).flatMap((row) =>
      row.kind === "deposit" || row.kind === "withdraw"
        ? [{ id: row.id, kind: row.kind, amount: Number(row.amount), createdAt: row.created_at }]
        : [],
    );
  },
);

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  published_at: string;
};

/** Active announcements (newest first) plus the ids the current user has read. */
export function useNotifications() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const list = useQuery({
    queryKey: ["notifications", userId],
    enabled: !!userId,
    queryFn: async (): Promise<AppNotification[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, body, link, published_at")
        .eq("is_active", true)
        .order("published_at", { ascending: false })
        .limit(100);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const reads = useQuery({
    queryKey: ["notification-reads", userId],
    enabled: !!userId,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("notification_reads")
        .select("notification_id")
        .eq("user_id", userId!);
      if (error) throw new Error(error.message);
      return (data ?? []).map((r) => r.notification_id);
    },
    staleTime: 60_000,
  });

  const notifications = list.data ?? [];
  const readIds = new Set(reads.data ?? []);
  const unreadCount = userId ? notifications.filter((n) => !readIds.has(n.id)).length : 0;

  return { notifications, readIds, unreadCount, loading: list.isLoading, error: list.error };
}

/** Marks every visible announcement as read for the signed-in user. */
export function useMarkNotificationsRead() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      if (!user || ids.length === 0) return;
      const { error } = await supabase.from("notification_reads").upsert(
        ids.map((notification_id) => ({ user_id: user.id, notification_id })),
        { onConflict: "user_id,notification_id" },
      );
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notification-reads"] });
    },
  });
}

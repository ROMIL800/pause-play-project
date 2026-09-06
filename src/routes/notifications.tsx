import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Bell, ExternalLink, Loader2 } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/hooks/use-auth";
import { useMarkNotificationsRead, useNotifications } from "@/lib/notifications";
import { RequireAuth } from "@/components/RequireAuth";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — GD BOSS777" },
      { name: "description", content: "Announcements and updates from the GD BOSS777 team." },
      { property: "og:title", content: "Notifications — GD BOSS777" },
      { property: "og:description", content: "Announcements and updates for GD BOSS777 players." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <NotificationsPage />
    </RequireAuth>
  ),
});

function NotificationsPage() {
  const { user } = useAuth();
  const { notifications, readIds, loading } = useNotifications();
  const markRead = useMarkNotificationsRead();

  const unreadIds = notifications.filter((n) => !readIds.has(n.id)).map((n) => n.id);
  const key = unreadIds.join(",");

  useEffect(() => {
    if (!user || !key) return;
    markRead.mutate(key.split(","));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, key]);

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
      <AppHeader title="Notifications" />
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain mx-auto w-full max-w-md px-4 py-5 pb-24 space-y-3">
        {loading && (
          <div className="h-32 grid place-items-center">
            <Loader2 className="h-7 w-7 animate-spin text-[var(--brand)]" />
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
            <Bell className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm font-semibold">No notifications yet</p>
            <p className="text-[11px] text-muted-foreground">
              Announcements from the team will appear here.
            </p>
          </div>
        )}

        {notifications.map((n) => {
          const unread = !!user && !readIds.has(n.id);
          return (
            <article
              key={n.id}
              className={`rounded-2xl border bg-card p-4 shadow-sm ${
                unread ? "border-[var(--gold)]" : "border-border"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-sm font-bold">{n.title}</h2>
                {unread && (
                  <span className="shrink-0 rounded-full brand-gradient text-white text-[10px] font-bold px-2 py-0.5">
                    NEW
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-foreground/80 whitespace-pre-line">{n.body}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-[10px] text-muted-foreground">
                  {new Date(n.published_at).toLocaleString("en-IN")}
                </span>
                {n.link && (
                  <a
                    href={n.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--brand)]"
                  >
                    Open <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </main>
      <BottomNav />
    </div>
  );
}

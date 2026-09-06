import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Bell, Lock, Globe, HelpCircle, ChevronRight } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — GD BOSS777" },
      { name: "description", content: "Manage your GD BOSS777 preferences." },
      { property: "og:title", content: "Settings — GD BOSS777" },
      { property: "og:description", content: "Manage app preferences." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <SettingsPage />
    </RequireAuth>
  ),
});

const ITEMS = [
  { icon: Bell, label: "Notifications" },
  { icon: Lock, label: "Change Password" },
  { icon: Globe, label: "Language" },
  { icon: HelpCircle, label: "Help & FAQ" },
];

function SettingsPage() {
  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
      <AppHeader title="Settings" />
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain mx-auto w-full max-w-md px-4 py-5 pb-24">
        <ul className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm divide-y divide-border">
          {ITEMS.map(({ icon: Icon, label }) => (
            <li key={label}>
              <button className="w-full flex items-center justify-between px-4 py-3.5 text-left">
                <span className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-[var(--brand)]" />
                  <span className="text-sm font-semibold">{label}</span>
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      </main>
      <BottomNav />
    </div>
  );
}

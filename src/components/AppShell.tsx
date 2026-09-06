import type { ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { BottomNav } from "./BottomNav";

/**
 * App-like fixed layout: header and bottom nav stay pinned,
 * only the main content area scrolls.
 */
export function AppShell({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
      <AppHeader title={title} />
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-md px-4 pt-4 pb-24 space-y-6">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}

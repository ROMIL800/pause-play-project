import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { RequireAuth } from "@/components/RequireAuth";

export const Route = createFileRoute("/upi-details")({
  head: () => ({
    meta: [
      { title: "Add UPI Details — GD BOSS777" },
      { name: "description", content: "Save your UPI ID to receive fast GD BOSS777 withdrawals." },
      { property: "og:title", content: "Add UPI Details — GD BOSS777" },
      { property: "og:description", content: "Save your UPI ID for fast withdrawals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <UpiDetailsPage />
    </RequireAuth>
  ),
});

const KEY = "matka777.upi.v1";
const APPS = ["PhonePe", "Google Pay", "Paytm", "Other"];

function UpiDetailsPage() {
  const [upi, setUpi] = useState(() =>
    typeof window === "undefined" ? "" : (window.localStorage.getItem(KEY) ?? ""),
  );
  const [app, setApp] = useState(APPS[0]);

  const save = () => {
    if (!/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(upi)) {
      toast.error("Enter a valid UPI ID (e.g. name@upi)");
      return;
    }
    window.localStorage.setItem(KEY, upi);
    toast.success("UPI details saved");
  };

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
      <AppHeader title="Add UPI Details" />
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain mx-auto w-full max-w-md px-4 py-5 pb-24 space-y-4">
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
          <div>
            <label htmlFor="upi" className="text-xs font-semibold text-muted-foreground">
              UPI ID
            </label>
            <input
              id="upi"
              value={upi}
              onChange={(e) => setUpi(e.target.value.trim())}
              placeholder="name@upi"
              className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {APPS.map((a) => (
              <button
                key={a}
                onClick={() => setApp(a)}
                className={`rounded-xl border py-2 text-[11px] font-bold ${
                  app === a
                    ? "border-[var(--brand)] text-[var(--brand)] bg-accent/40"
                    : "border-border"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </section>
        <button
          onClick={save}
          className="w-full brand-gradient text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-[0.98]"
        >
          Save UPI Details
        </button>
      </main>
      <BottomNav />
    </div>
  );
}

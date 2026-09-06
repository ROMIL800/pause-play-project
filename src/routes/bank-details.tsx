import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { RequireAuth } from "@/components/RequireAuth";

export const Route = createFileRoute("/bank-details")({
  head: () => ({
    meta: [
      { title: "Add Bank Details — GD BOSS777" },
      {
        name: "description",
        content: "Save your bank account details to receive GD BOSS777 withdrawals.",
      },
      { property: "og:title", content: "Add Bank Details — GD BOSS777" },
      { property: "og:description", content: "Save bank account details for withdrawals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <BankDetailsPage />
    </RequireAuth>
  ),
});

const KEY = "matka777.bank.v1";

function BankDetailsPage() {
  const [form, setForm] = useState(() => {
    if (typeof window === "undefined") return { holder: "", account: "", ifsc: "", bank: "" };
    try {
      return JSON.parse(window.localStorage.getItem(KEY) ?? "") as Record<string, string>;
    } catch {
      return { holder: "", account: "", ifsc: "", bank: "" };
    }
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.holder || form.account?.length < 8 || !form.ifsc || !form.bank) {
      toast.error("Please fill all bank details correctly");
      return;
    }
    window.localStorage.setItem(KEY, JSON.stringify(form));
    toast.success("Bank details saved");
  };

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
      <AppHeader title="Add Bank Details" />
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain mx-auto w-full max-w-md px-4 py-5 pb-24 space-y-4">
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
          <Field
            label="Account Holder Name"
            value={form.holder ?? ""}
            onChange={(v) => set("holder", v)}
          />
          <Field
            label="Account Number"
            value={form.account ?? ""}
            onChange={(v) => set("account", v.replace(/\D/g, "").slice(0, 18))}
            inputMode="numeric"
          />
          <Field
            label="IFSC Code"
            value={form.ifsc ?? ""}
            onChange={(v) => set("ifsc", v.toUpperCase().slice(0, 11))}
          />
          <Field label="Bank Name" value={form.bank ?? ""} onChange={(v) => set("bank", v)} />
        </section>
        <button
          onClick={save}
          className="w-full brand-gradient text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-[0.98]"
        >
          Save Bank Details
        </button>
      </main>
      <BottomNav />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  inputMode?: "numeric" | "text";
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      <input
        value={value}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
      />
    </div>
  );
}

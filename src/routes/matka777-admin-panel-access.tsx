import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Check, X, Search, KeyRound } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/hooks/use-auth";
import {
  getIsAdmin,
  listAllRequests,
  reviewRequest,
  searchUsers,
  adminResetPassword,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/matka777-admin-panel-access")({
  head: () => ({
    meta: [
      { title: "Admin Panel — GD BOSS777" },
      { name: "description", content: "Approve or reject deposit and withdrawal requests." },
      { property: "og:title", content: "Admin Panel — GD BOSS777" },
      { property: "og:description", content: "Approve or reject fund requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user } = useAuth();
  const admin = useQuery({
    queryKey: ["is-admin", user?.id ?? null],
    queryFn: () => getIsAdmin(),
    enabled: Boolean(user),
  });
  const isAdmin = Boolean(admin.data?.isAdmin);

  const requests = useQuery({
    queryKey: ["admin-requests"],
    queryFn: () => listAllRequests(),
    enabled: isAdmin,
    refetchInterval: 20_000,
  });

  const review = useServerFn(reviewRequest);
  const [busy, setBusy] = useState<string | null>(null);

  const act = async (id: string, action: "approve" | "reject") => {
    setBusy(id);
    try {
      await review({ data: { id, action } });
      await requests.refetch();
      toast.success(action === "approve" ? "Approved — wallet updated" : "Request rejected");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(null);
    }
  };

  const search = useServerFn(searchUsers);
  const resetPassword = useServerFn(adminResetPassword);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    {
      userId: string;
      name: string | null;
      phone: string;
      status: string;
      balance: number;
      registeredAt: string;
    }[]
  >([]);
  const [searching, setSearching] = useState(false);
  const [temp, setTemp] = useState<{ userId: string; password: string } | null>(null);

  const runSearch = async () => {
    if (query.trim().length < 3) {
      toast.error("Enter a mobile number, User ID or name");
      return;
    }
    setSearching(true);
    setTemp(null);
    try {
      const rows = await search({ data: { query: query.trim() } });
      setResults(rows);
      if (!rows.length) toast.error("No account found");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const doReset = async (userId: string) => {
    setBusy(userId);
    try {
      const res = await resetPassword({ data: { userId } });
      setTemp({ userId, password: res.tempPassword });
      toast.success("Temporary password generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
      <AppHeader title="Admin Panel" />
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain mx-auto w-full max-w-md px-4 py-5 pb-24 space-y-3">
        {!user && (
          <p className="text-sm text-muted-foreground">Please sign in with the admin account.</p>
        )}
        {user && !admin.isLoading && !isAdmin && (
          <p className="text-sm text-destructive font-semibold">You do not have admin access.</p>
        )}

        {isAdmin && (
          <>
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold">
                <Search className="h-4 w-4 text-[var(--brand)]" /> Users · Search User
              </div>
              <div className="flex gap-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void runSearch();
                  }}
                  placeholder="Mobile number or User ID"
                  className="flex-1 rounded-xl border border-border bg-background py-2.5 px-3 text-sm outline-none"
                />
                <button
                  onClick={runSearch}
                  disabled={searching}
                  className="rounded-xl brand-gradient text-white px-4 text-sm font-bold disabled:opacity-60"
                >
                  {searching ? "..." : "Search"}
                </button>
              </div>

              {results.map((u) => (
                <div key={u.userId} className="rounded-xl border border-border p-3 space-y-1">
                  <div className="font-bold text-sm">{u.name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{u.phone}</div>
                  <div className="text-[11px] text-muted-foreground break-all">
                    User ID: {u.userId}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Status: <span className="font-semibold text-[#15803d]">{u.status}</span> ·
                    Balance ₹{u.balance.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Registered: {new Date(u.registeredAt).toLocaleString("en-IN")}
                  </div>
                  <button
                    onClick={() => doReset(u.userId)}
                    disabled={busy === u.userId}
                    className="mt-2 inline-flex items-center gap-1 rounded-xl border border-[var(--brand)] text-[var(--brand)] px-3 py-2 text-xs font-bold disabled:opacity-60"
                  >
                    <KeyRound className="h-3.5 w-3.5" /> Reset Password
                  </button>
                  {temp?.userId === u.userId && (
                    <div className="mt-2 rounded-xl border-2 border-dashed border-[var(--gold)] bg-[var(--gold)]/10 p-2 text-center">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Temporary password — share with the user
                      </div>
                      <div className="text-base font-extrabold tracking-widest">
                        {temp.password}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        User must set a new password at next login.
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-border bg-card p-3 flex items-center gap-2 text-sm">
              <ShieldCheck className="h-4 w-4 text-[var(--brand)]" />
              <span className="font-semibold">{requests.data?.length ?? 0} requests</span>
            </div>

            {(requests.data ?? []).map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-sm capitalize">
                      {r.kind} · ₹{r.amount.toLocaleString("en-IN")}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {r.fullName ?? r.phone}
                    </div>
                    <div className="text-xs text-muted-foreground">{r.phone}</div>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                      r.status === "pending"
                        ? "bg-accent text-[var(--brand)]"
                        : r.status === "approved"
                          ? "bg-[#22c55e]/15 text-[#15803d]"
                          : "bg-destructive/15 text-destructive"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {r.utr ? `UTR: ${r.utr}` : r.method ? `Method: ${r.method}` : null}
                  {r.reference ? ` · ${r.reference}` : ""}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {new Date(r.created_at).toLocaleString("en-IN")}
                </div>
                {r.status === "pending" && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => act(r.id, "approve")}
                      disabled={busy === r.id}
                      className="inline-flex items-center justify-center gap-1 rounded-xl bg-[#16a34a] text-white py-2.5 text-sm font-bold disabled:opacity-60"
                    >
                      <Check className="h-4 w-4" /> Approve
                    </button>
                    <button
                      onClick={() => act(r.id, "reject")}
                      disabled={busy === r.id}
                      className="inline-flex items-center justify-center gap-1 rounded-xl border border-destructive text-destructive py-2.5 text-sm font-bold disabled:opacity-60"
                    >
                      <X className="h-4 w-4" /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}

            {requests.data?.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No requests yet.</p>
            )}
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

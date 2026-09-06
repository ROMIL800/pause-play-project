import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Users,
  Bell,
  LifeBuoy,
  Settings2,
  UserCog,
  ScrollText,
  Activity,
  LogOut,
  Loader2,
  Menu,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  getAdminSession,
  getAdminOverview,
  adminListUsers,
  adminSetUserBlocked,
  adminListNotifications,
  adminCreateNotification,
  adminUpdateNotification,
  adminGetSettings,
  adminUpdateSetting,
  adminSupportQueue,
  adminAuditLog,
  adminSystemHealth,
  adminChangePassword,
} from "@/lib/admin-panel.functions";
import { reviewRequest } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Dashboard — GD BOSS777" },
      { name: "description", content: "Manage users, notifications, support and settings." },
      { property: "og:title", content: "Admin Dashboard — GD BOSS777" },
      { property: "og:description", content: "GD BOSS777 administration console." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminDashboardPage,
});

const SECTIONS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "support", label: "Support", icon: LifeBuoy },
  { id: "settings", label: "Settings", icon: Settings2 },
  { id: "profile", label: "Admin Profile", icon: UserCog },
  { id: "audit", label: "Activity Log", icon: ScrollText },
  { id: "health", label: "System Health", icon: Activity },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
      {children}
    </div>
  );
}

function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const session = useServerFn(getAdminSession);
  const [section, setSection] = useState<SectionId>("overview");
  const [navOpen, setNavOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/admin-login", replace: true });
  }, [loading, user, navigate]);

  const me = useQuery({
    queryKey: ["admin-session", user?.id ?? null],
    queryFn: () => session(),
    enabled: Boolean(user),
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/admin-login", replace: true });
  }

  if (loading || (user && me.isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user && me.data && !me.data.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-sm text-center space-y-3">
          <h1 className="text-lg font-extrabold text-destructive">Access denied</h1>
          <p className="text-sm text-muted-foreground">
            This account is signed in but does not have administrator permissions.
          </p>
          <button
            onClick={signOut}
            className="rounded-xl brand-gradient text-white px-4 py-2 text-sm font-bold"
          >
            Sign in with another account
          </button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background md:flex">
      <aside
        className={`${navOpen ? "block" : "hidden"} md:block md:w-60 md:shrink-0 border-b md:border-b-0 md:border-r border-border bg-card`}
      >
        <div className="p-4 font-extrabold text-sm">GD BOSS777 Admin</div>
        <nav className="px-2 pb-3 space-y-1">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSection(s.id);
                setNavOpen(false);
              }}
              className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${
                section === s.id ? "brand-gradient text-white" : "text-muted-foreground"
              }`}
            >
              <s.icon className="h-4 w-4" /> {s.label}
            </button>
          ))}
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-destructive"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </nav>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="flex items-center gap-2 border-b border-border bg-card px-4 py-3">
          <button className="md:hidden" onClick={() => setNavOpen((v) => !v)} aria-label="Menu">
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-sm font-extrabold">
            {SECTIONS.find((s) => s.id === section)?.label}
          </h1>
          <span className="ml-auto text-xs text-muted-foreground truncate">
            {me.data?.fullName ?? me.data?.phone}
          </span>
        </header>

        <main className="mx-auto max-w-3xl px-4 py-5 space-y-3">
          {section === "overview" && <OverviewSection />}
          {section === "users" && <UsersSection />}
          {section === "notifications" && <NotificationsSection />}
          {section === "support" && <SupportSection />}
          {section === "settings" && <SettingsSection />}
          {section === "profile" && <ProfileSection onSignOut={signOut} />}
          {section === "audit" && <AuditSection />}
          {section === "health" && <HealthSection />}
        </main>
      </div>
    </div>
  );
}

function OverviewSection() {
  const fn = useServerFn(getAdminOverview);
  const q = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => fn(),
    refetchInterval: 30_000,
  });
  const d = q.data;
  const tiles = [
    { label: "Players", value: d?.users ?? 0 },
    { label: "Blocked", value: d?.blocked ?? 0 },
    { label: "Pending requests", value: d?.pendingRequests ?? 0 },
    { label: "Bets placed", value: d?.bets ?? 0 },
    { label: "Wallet balance", value: `₹${(d?.totalBalance ?? 0).toLocaleString("en-IN")}` },
    { label: "Approved deposits", value: `₹${(d?.deposits ?? 0).toLocaleString("en-IN")}` },
    { label: "Approved withdrawals", value: `₹${(d?.withdrawals ?? 0).toLocaleString("en-IN")}` },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="text-xs text-muted-foreground">{t.label}</div>
          <div className="text-xl font-extrabold">{q.isLoading ? "…" : t.value}</div>
        </div>
      ))}
    </div>
  );
}

function UsersSection() {
  const list = useServerFn(adminListUsers);
  const setBlocked = useServerFn(adminSetUserBlocked);
  const [query, setQuery] = useState("");
  const [term, setTerm] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["admin-users", term],
    queryFn: () => list({ data: { query: term } }),
  });

  async function toggle(userId: string, blocked: boolean) {
    setBusy(userId);
    try {
      await setBlocked({ data: { userId, blocked } });
      await q.refetch();
      toast.success(blocked ? "Account blocked" : "Account reactivated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <Card>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setTerm(query.trim())}
            placeholder="Search mobile number, name or User ID"
            className="flex-1 rounded-xl border border-border bg-background py-2.5 px-3 text-sm outline-none"
          />
          <button
            onClick={() => setTerm(query.trim())}
            className="rounded-xl brand-gradient text-white px-4 text-sm font-bold"
          >
            Search
          </button>
        </div>
      </Card>
      {(q.data ?? []).map((u) => (
        <Card key={u.userId}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-bold text-sm">{u.name ?? "—"}</div>
              <div className="text-xs text-muted-foreground">{u.phone}</div>
              <div className="text-[11px] text-muted-foreground break-all">ID: {u.userId}</div>
              <div className="text-[11px] text-muted-foreground">
                Balance ₹{u.balance.toLocaleString("en-IN")} ·{" "}
                {new Date(u.registeredAt).toLocaleDateString("en-IN")}
              </div>
            </div>
            <span
              className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                u.blocked ? "bg-destructive/15 text-destructive" : "bg-[#22c55e]/15 text-[#15803d]"
              }`}
            >
              {u.blocked ? "Blocked" : "Active"}
            </span>
          </div>
          <button
            onClick={() => toggle(u.userId, !u.blocked)}
            disabled={busy === u.userId}
            className="rounded-xl border border-border px-3 py-2 text-xs font-bold disabled:opacity-60"
          >
            {u.blocked ? "Reactivate account" : "Block account"}
          </button>
        </Card>
      ))}
      {q.data?.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No accounts found.</p>
      )}
    </>
  );
}

function NotificationsSection() {
  const list = useServerFn(adminListNotifications);
  const create = useServerFn(adminCreateNotification);
  const update = useServerFn(adminUpdateNotification);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const q = useQuery({ queryKey: ["admin-notifications"], queryFn: () => list() });

  async function submit() {
    try {
      await create({ data: { title: title.trim(), body: body.trim() } });
      setTitle("");
      setBody("");
      await q.refetch();
      toast.success("Notification published");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not publish");
    }
  }

  async function act(id: string, action: "activate" | "deactivate" | "delete") {
    try {
      await update({ data: { id, action } });
      await q.refetch();
      toast.success("Updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
  }

  return (
    <>
      <Card>
        <div className="text-sm font-bold">New notification</div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full rounded-xl border border-border bg-background py-2.5 px-3 text-sm outline-none"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Message"
          rows={3}
          className="w-full rounded-xl border border-border bg-background py-2.5 px-3 text-sm outline-none"
        />
        <button
          onClick={submit}
          className="rounded-xl brand-gradient text-white px-4 py-2 text-sm font-bold"
        >
          Publish
        </button>
      </Card>
      {(q.data ?? []).map((n) => (
        <Card key={n.id}>
          <div className="font-bold text-sm">{n.title}</div>
          <div className="text-xs text-muted-foreground">{n.body}</div>
          <div className="text-[11px] text-muted-foreground">
            {new Date(n.published_at).toLocaleString("en-IN")} · {n.is_active ? "Active" : "Hidden"}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => act(n.id, n.is_active ? "deactivate" : "activate")}
              className="rounded-xl border border-border px-3 py-2 text-xs font-bold"
            >
              {n.is_active ? "Hide" : "Show"}
            </button>
            <button
              onClick={() => act(n.id, "delete")}
              className="rounded-xl border border-destructive text-destructive px-3 py-2 text-xs font-bold"
            >
              Delete
            </button>
          </div>
        </Card>
      ))}
    </>
  );
}

function SupportSection() {
  const fn = useServerFn(adminSupportQueue);
  const review = useServerFn(reviewRequest);
  const q = useQuery({
    queryKey: ["admin-support"],
    queryFn: () => fn(),
    refetchInterval: 15_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 0,
    retry: 1,
  });
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  async function act(id: string, action: "approve" | "reject") {
    setBusy(id);
    try {
      await review({ data: { id, action } });
      toast.success(action === "approve" ? "Request accepted" : "Request rejected");
      await q.refetch();
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not process the request");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <Card>
        <div className="text-sm font-bold">Pending player requests</div>
        <p className="text-xs text-muted-foreground">
          Accepting a deposit credits the player's wallet exactly once. Rejecting credits nothing.
        </p>
      </Card>
      {q.isError && (
        <Card>
          <div className="text-sm font-semibold text-destructive">
            Could not load the request queue.
          </div>
          <button
            onClick={() => void q.refetch()}
            className="mt-2 rounded-xl border border-border px-3 py-2 text-xs font-bold"
          >
            Try again
          </button>
        </Card>
      )}
      {(q.data ?? []).map((r) => (
        <Card key={r.id}>
          <div className="font-bold text-sm capitalize">
            {r.kind} · ₹{r.amount.toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-muted-foreground">{r.phone}</div>
          <div className="text-[11px] text-muted-foreground">
            {r.utr ? `UTR: ${r.utr} · ` : ""}
            {r.note ? `${r.note} · ` : ""}
            {new Date(r.created_at).toLocaleString("en-IN")}
          </div>
          <div className="text-[10px] text-muted-foreground break-all">
            Request ID: {r.id} · Status: {r.status}
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => act(r.id, "approve")}
              disabled={busy === r.id}
              className="flex-1 rounded-xl brand-gradient text-white py-2 text-xs font-bold disabled:opacity-60"
            >
              {busy === r.id ? "Working…" : "Accept"}
            </button>
            <button
              onClick={() => act(r.id, "reject")}
              disabled={busy === r.id}
              className="flex-1 rounded-xl border border-destructive text-destructive py-2 text-xs font-bold disabled:opacity-60"
            >
              Reject
            </button>
          </div>
        </Card>
      ))}
      {q.data?.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Nothing pending.</p>
      )}
    </>
  );
}

function SettingsSection() {
  const get = useServerFn(adminGetSettings);
  const save = useServerFn(adminUpdateSetting);
  const q = useQuery({ queryKey: ["admin-settings"], queryFn: () => get() });
  const [draft, setDraft] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const rows = q.data ?? [];
  return (
    <Card>
      <div className="text-sm font-bold">Application settings</div>
      {rows.map((r) => (
        <div key={r.key} className="space-y-1">
          <label htmlFor={`set-${r.key}`} className="text-xs font-semibold text-muted-foreground">
            {r.key.replace(/_/g, " ")}
          </label>
          <div className="flex gap-2">
            <input
              id={`set-${r.key}`}
              value={draft[r.key] ?? r.value}
              onChange={(e) => setDraft((d) => ({ ...d, [r.key]: e.target.value }))}
              className="flex-1 rounded-xl border border-border bg-background py-2.5 px-3 text-sm outline-none"
            />
            <button
              onClick={async () => {
                try {
                  await save({ data: { key: r.key, value: draft[r.key] ?? r.value } });
                  await q.refetch();
                  // Payment screens read the live UPI ID — drop any cached copy.
                  queryClient.invalidateQueries({ queryKey: ["deposit-upi"] });
                  toast.success("Saved");
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Save failed");
                }
              }}
              className="rounded-xl brand-gradient text-white px-4 text-sm font-bold"
            >
              Save
            </button>
          </div>
        </div>
      ))}
    </Card>
  );
}

function ProfileSection({ onSignOut }: { onSignOut: () => void }) {
  const fn = useServerFn(getAdminSession);
  const changePassword = useServerFn(adminChangePassword);
  const q = useQuery({ queryKey: ["admin-profile"], queryFn: () => fn() });
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const pwField =
    "w-full rounded-xl border border-border bg-background py-2.5 px-3 text-sm outline-none";

  async function submitPassword() {
    if (next.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (next !== confirm) {
      toast.error("New passwords do not match");
      return;
    }
    setSaving(true);
    try {
      await changePassword({ data: { currentPassword: current, newPassword: next } });
      setCurrent("");
      setNext("");
      setConfirm("");
      toast.success("Password changed — use the new password from now on");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not change the password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Card>
        <div className="text-sm font-bold">Admin session</div>
        <div className="text-xs text-muted-foreground">Name: {q.data?.fullName ?? "—"}</div>
        <div className="text-xs text-muted-foreground">Mobile: {q.data?.phone ?? "—"}</div>
        <div className="text-[11px] text-muted-foreground break-all">User ID: {q.data?.userId}</div>
        <div className="text-[11px] text-muted-foreground">
          Role: {q.data?.isAdmin ? "Administrator" : "Player"}
        </div>
        <button
          onClick={onSignOut}
          className="rounded-xl border border-destructive text-destructive px-3 py-2 text-xs font-bold"
        >
          Sign out
        </button>
      </Card>
      <Card>
        <div className="text-sm font-bold">Change admin password</div>
        <p className="text-xs text-muted-foreground">
          Verified by the authentication backend. The old password stops working immediately.
        </p>
        <input
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          placeholder="Current password"
          className={pwField}
        />
        <input
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          placeholder="New password (min 8 characters)"
          className={pwField}
        />
        <input
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm new password"
          className={pwField}
        />
        <button
          onClick={submitPassword}
          disabled={saving || !current || !next}
          className="rounded-xl brand-gradient text-white py-2.5 text-sm font-bold disabled:opacity-60"
        >
          {saving ? "Saving…" : "Change password"}
        </button>
      </Card>
    </>
  );
}

function AuditSection() {
  const fn = useServerFn(adminAuditLog);
  const q = useQuery({ queryKey: ["admin-audit"], queryFn: () => fn() });
  return (
    <>
      {(q.data ?? []).map((e) => (
        <Card key={e.id}>
          <div className="text-sm font-bold">{e.action}</div>
          {e.target_user_id && (
            <div className="text-[11px] text-muted-foreground break-all">
              Target: {e.target_user_id}
            </div>
          )}
          <div className="text-[11px] text-muted-foreground">
            {new Date(e.created_at).toLocaleString("en-IN")}
          </div>
        </Card>
      ))}
      {q.data?.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No admin activity yet.</p>
      )}
    </>
  );
}

function HealthSection() {
  const fn = useServerFn(adminSystemHealth);
  const q = useQuery({ queryKey: ["admin-health"], queryFn: () => fn(), refetchInterval: 30_000 });
  return (
    <Card>
      <div className="text-sm font-bold">Backend status</div>
      <div className="text-xs text-muted-foreground">Database: {q.data?.database ?? "…"}</div>
      <div className="text-xs text-muted-foreground">Latency: {q.data?.latencyMs ?? "…"} ms</div>
      <div className="text-[11px] text-muted-foreground">
        Checked: {q.data ? new Date(q.data.checkedAt).toLocaleString("en-IN") : "…"}
      </div>
      {q.data?.message && <div className="text-xs text-destructive">{q.data.message}</div>}
    </Card>
  );
}

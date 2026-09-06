import { Link, useNavigate } from "@tanstack/react-router";
import {
  Home,
  Gavel,
  BookOpen,
  Gift,
  MessageSquare,
  Landmark,
  AlertTriangle,
  Sparkles,
  LineChart,
  Share2,
  LogOut,
  X,
  User,
  ShieldCheck,
} from "lucide-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth, signOutUser } from "@/hooks/use-auth";
import { getIsAdmin } from "@/lib/admin.functions";

import { toast } from "sonner";

const links = [
  { to: "/", label: "Home", icon: Home },
  { to: "/my-bets", label: "My Bids", icon: Gavel },
  { to: "/payment-history", label: "Passbook", icon: BookOpen },
  { to: "/gift", label: "Get Gift", icon: Gift },
  { to: "/support", label: "Chat", icon: MessageSquare },
  { to: "/wallet", label: "Funds", icon: Landmark },
  { to: "/notice", label: "Notice Board / Rules", icon: AlertTriangle },
  { to: "/game-rates", label: "Game Rates", icon: Sparkles },
  { to: "/live-chart", label: "Live Chart", icon: LineChart },
] as const;

export function SideMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const adminQuery = useQuery({
    queryKey: ["is-admin", user?.id ?? null],
    queryFn: () => getIsAdmin(),
    enabled: Boolean(user),
  });
  const isAdmin = Boolean(adminQuery.data?.isAdmin);

  const phone = user?.phone
    ? user.phone.startsWith("+")
      ? user.phone
      : `+${user.phone}`
    : "Not signed in";

  async function copyLink(text: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const el = document.createElement("textarea");
        el.value = text;
        el.setAttribute("readonly", "");
        el.style.position = "fixed";
        el.style.opacity = "0";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  }

  async function handleShare() {
    const url = window.location.origin;
    const text = `Play on GD BOSS777 — ${url}`;

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "GD BOSS777", text, url });
        onClose();
        return;
      } catch (err) {
        const name = (err as { name?: string } | null)?.name;
        if (name === "AbortError") {
          onClose();
          return;
        }
        // share unsupported/blocked (e.g. non-HTTPS or desktop) — fall back to copy
      }
    }

    await copyLink(text);
    onClose();
  }

  async function handleLogout() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOutUser();
    toast.success("Signed out");
    onClose();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <aside
        className={`absolute left-0 top-0 h-full w-[82%] max-w-[320px] bg-card shadow-2xl transition-transform ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="brand-gradient text-white px-4 pt-5 pb-6 flex items-center gap-3 relative">
          <div className="h-14 w-14 rounded-full bg-white/15 grid place-items-center border border-white/25">
            <User className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <div className="text-base font-bold truncate">Alakh Sharma</div>
            <div className="text-xs text-white/80 truncate">{phone}</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="absolute top-3 right-3 h-8 w-8 rounded-lg bg-white/10 grid place-items-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="py-2 overflow-y-auto max-h-[calc(100%-116px)]">
          <ul>
            {links.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  onClick={onClose}
                  className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-foreground hover:bg-accent"
                >
                  <Icon className="h-5 w-5 text-[var(--brand)]" />
                  {label}
                </Link>
              </li>
            ))}
            {isAdmin && (
              <li>
                <Link
                  to="/matka777-admin-panel-access"
                  onClick={onClose}
                  className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-[var(--brand)] hover:bg-accent"
                >
                  <ShieldCheck className="h-5 w-5 text-[var(--brand)]" />
                  Admin Panel
                </Link>
              </li>
            )}
            <li>
              <button
                onClick={handleShare}
                className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-foreground hover:bg-accent text-left"
              >
                <Share2 className="h-5 w-5 text-[var(--brand)]" />
                Share Application
              </button>
            </li>
            <li>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-destructive hover:bg-accent text-left"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </aside>
    </div>
  );
}

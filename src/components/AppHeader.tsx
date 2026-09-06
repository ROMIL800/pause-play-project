import { Link, useRouter } from "@tanstack/react-router";
import { Wallet, LogIn, Menu, RefreshCw, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { SideMenu } from "./SideMenu";
import { useBalance, formatBalance } from "@/lib/wallet-store";
import { useNotifications } from "@/lib/notifications";
import { BrandLogo } from "./BrandLogo";

import { Marquee } from "./Marquee";

const MIN_ONLINE = 900;
const MAX_ONLINE = 2400;
const TICK_MS = 10_000;
const TICKS_PER_LEG = 90; // 15 minutes

function LiveCustomers() {
  const [count, setCount] = useState(1247);

  useEffect(() => {
    let current = 1247;
    let target = current;
    let ticksLeft = 0;

    const t = setInterval(() => {
      if (ticksLeft <= 0) {
        // Every 15 minutes pick a new target 500-1000 away, up or down.
        const delta = 500 + Math.floor(Math.random() * 501);
        const up =
          current - delta < MIN_ONLINE
            ? true
            : current + delta > MAX_ONLINE
              ? false
              : Math.random() > 0.5;
        target = Math.min(MAX_ONLINE, Math.max(MIN_ONLINE, current + (up ? delta : -delta)));
        ticksLeft = TICKS_PER_LEG;
      }
      const step = (target - current) / ticksLeft;
      const jitter = Math.floor(Math.random() * 7) - 3; // small up/down wobble
      current = Math.min(MAX_ONLINE, Math.max(MIN_ONLINE, Math.round(current + step + jitter)));
      ticksLeft -= 1;
      setCount(current);
    }, TICK_MS);

    return () => clearInterval(t);
  }, []);

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[10px] font-bold">
      <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-pulse" />
      <span className="tabular-nums">{count.toLocaleString("en-IN")}</span> Online
    </span>
  );
}

export function AppHeader({ title }: { title?: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const balance = useBalance();
  const { unreadCount } = useNotifications();
  const [menuOpen, setMenuOpen] = useState(false);

  const phone = user?.phone ? (user.phone.startsWith("+") ? user.phone : `+${user.phone}`) : null;
  const displayName = phone ?? "Guest User";

  function handleRefresh() {
    router.invalidate();
    toast.success("Refreshed");
  }

  return (
    <>
      <header className="brand-gradient text-white shrink-0 z-30 shadow-lg">
        <div className="mx-auto max-w-md px-4 pt-2 pb-3.5">
          {/* Single row: menu + smaller logo on left, icons on right corner */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="h-9 w-9 shrink-0 rounded-xl bg-white/15 grid place-items-center active:scale-95"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link to="/" className="flex min-w-0 flex-1 items-center">
              <BrandLogo className="h-11 w-full max-w-[180px]" />
            </Link>

            <div className="ml-auto flex shrink-0 items-center gap-1.5">
              <Link
                to="/notifications"
                aria-label={
                  unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"
                }
                className="relative h-9 w-9 rounded-xl bg-white/15 grid place-items-center active:scale-95"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[var(--destructive)] text-white text-[9px] font-bold grid place-items-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>

              <button
                onClick={handleRefresh}
                aria-label="Refresh"
                className="h-9 w-9 rounded-xl bg-white/15 grid place-items-center active:scale-95"
              >
                <RefreshCw className="h-5 w-5" />
              </button>

              {!user && (
                <Link
                  to="/auth"
                  aria-label="Sign in"
                  className="h-9 w-9 rounded-xl bg-white/15 grid place-items-center active:scale-95"
                >
                  <LogIn className="h-5 w-5" />
                </Link>
              )}
            </div>
          </div>

          {/* Second row: online chip + wallet card */}
          <div className="mt-2 flex items-center gap-2">
            <LiveCustomers />
            <div className="ml-auto flex-1 rounded-xl bg-white/10 backdrop-blur border border-white/15 px-3 py-1.5 flex items-center justify-end gap-2.5">
              <div className="gold-gradient h-7 w-7 rounded-lg grid place-items-center shadow">
                <Wallet className="h-3.5 w-3.5 text-[var(--brand-deep)]" />
              </div>
              <div className="text-right">
                <div className="text-[9px] uppercase tracking-wider text-white/70 leading-none">
                  {displayName}
                </div>
                <div className="text-sm font-extrabold leading-tight">₹{formatBalance(balance)}</div>
              </div>
            </div>
          </div>

          {title && <h1 className="mt-2 text-base font-bold tracking-tight">{title}</h1>}
        </div>
      </header>
      <Marquee />
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

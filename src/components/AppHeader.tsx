import { Link, useRouter } from "@tanstack/react-router";
import { Wallet, LogIn, Menu, RefreshCw, Bell, Languages, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { SideMenu } from "./SideMenu";
import { useBalance, formatBalance } from "@/lib/wallet-store";
import { useNotifications } from "@/lib/notifications";
import { BrandLogo } from "./BrandLogo";

import { Marquee } from "./Marquee";
import { LANGUAGES, useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

const MIN_ONLINE = 900;
const MAX_ONLINE = 2400;
const TICK_MS = 10_000;
const TICKS_PER_LEG = 90; // 15 minutes

function LiveCustomers() {
  const { t } = useLanguage();
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
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-2.5 py-1 text-[10px] font-bold">
      <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
      <span className="tabular-nums">{count.toLocaleString("en-IN")}</span> {t("online")}
    </span>
  );
}

export function AppHeader({ title }: { title?: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const balance = useBalance();
  const { unreadCount } = useNotifications();
  const [menuOpen, setMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const phone = user?.phone ? (user.phone.startsWith("+") ? user.phone : `+${user.phone}`) : null;
  const displayName = phone ?? t("guest");

  function handleRefresh() {
    router.invalidate();
    toast.success("Refreshed");
  }

  return (
    <>
      <header className="brand-gradient text-primary-foreground shrink-0 z-30 shadow-lg">
        <div className="mx-auto max-w-md px-4 pt-[calc(0.5rem+env(safe-area-inset-top))] pb-4">
          {/* Single row: menu + smaller logo on left, icons on right corner */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="h-10 w-10 shrink-0 rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground active:scale-95"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <Link to="/" className="flex min-w-0 flex-1 items-center">
              <BrandLogo className="h-11 w-full max-w-[180px]" />
            </Link>

            <div className="ml-auto flex shrink-0 items-center gap-1.5">
              <Link
                to="/notifications"
                aria-label={
                  unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"
                }
                className="relative h-10 w-10 rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 grid place-items-center active:scale-95"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[var(--destructive)] text-white text-[9px] font-bold grid place-items-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                aria-label="Refresh"
                className="h-10 w-10 rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground active:scale-95"
              >
                <RefreshCw className="h-5 w-5" />
              </Button>

              {!user && (
                <Link
                  to="/auth"
                  aria-label="Sign in"
                  className="h-10 w-10 rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 grid place-items-center active:scale-95"
                >
                  <LogIn className="h-5 w-5" />
                </Link>
              )}
            </div>
          </div>

          {/* Second row: online chip + wallet card */}
          <div className="mt-3 flex items-center gap-2">
            <LiveCustomers />
            <label className="relative flex h-8 items-center gap-1 rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 px-2 text-[10px] font-bold">
              <Languages className="h-3.5 w-3.5" />
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value as typeof language)}
                aria-label="Select language"
                className="absolute inset-0 cursor-pointer opacity-0"
              >
                {LANGUAGES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
              {LANGUAGES.find((item) => item.code === language)?.short}
            </label>
          </div>
          <div className="mt-2 rounded-xl border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-2.5 backdrop-blur flex items-center gap-2.5">
            <div className="gold-gradient h-7 w-7 rounded-lg grid place-items-center shadow">
              <Wallet className="h-3.5 w-3.5 text-[var(--brand-deep)]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[10px] font-semibold text-primary-foreground/75">
                {displayName}
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[9px] text-primary-foreground/70">
                <ShieldCheck className="h-3 w-3" /> {t("secure")}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] uppercase text-primary-foreground/70">{t("balance")}</div>
              <div className="text-base font-extrabold leading-tight">
                ₹{formatBalance(balance)}
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

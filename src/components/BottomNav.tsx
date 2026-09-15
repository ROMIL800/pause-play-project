import { Link } from "@tanstack/react-router";
import { Home, Gavel, Receipt, Landmark, MessageCircle } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const items = [
  { to: "/my-bets", label: "myBids", icon: Gavel },
  { to: "/payment-history", label: "payments", icon: Receipt },
  { to: "/", label: "home", icon: Home },
  { to: "/wallet", label: "funds", icon: Landmark },
  { to: "/support", label: "support", icon: MessageCircle },
] as const;

export function BottomNav() {
  const { t } = useLanguage();
  return (
    <>
      <div className="h-20" />
      <div className="fixed bottom-0 inset-x-0 z-40">
        <nav className="border-t border-border bg-card/95 shadow-[0_-8px_24px_color-mix(in_oklab,var(--brand)_8%,transparent)] backdrop-blur">
          <ul className="mx-auto max-w-md grid grid-cols-5">
            {items.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  activeOptions={{ exact: true }}
                  className="flex min-h-16 flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold text-muted-foreground transition-colors data-[status=active]:text-brand"
                >
                  <Icon className="h-5 w-5" />
                  <span>{t(label)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}

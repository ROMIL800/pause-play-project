import { Link } from "@tanstack/react-router";
import { Home, Gavel, Receipt, Landmark, MessageCircle } from "lucide-react";

const items = [
  { to: "/my-bets", label: "My Bids", icon: Gavel },
  { to: "/payment-history", label: "Payments", icon: Receipt },
  { to: "/", label: "Home", icon: Home },
  { to: "/wallet", label: "Funds", icon: Landmark },
  { to: "/support", label: "Support", icon: MessageCircle },
] as const;

export function BottomNav() {
  return (
    <>
      <div className="h-20" />
      <div className="fixed bottom-0 inset-x-0 z-40">
        <nav className="border-t border-border bg-card/95 backdrop-blur">
          <ul className="mx-auto max-w-md grid grid-cols-5">
            {items.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  activeOptions={{ exact: true }}
                  className="flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium text-muted-foreground data-[status=active]:text-[var(--brand)]"
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}

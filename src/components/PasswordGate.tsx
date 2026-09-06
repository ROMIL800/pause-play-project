import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { getPasswordStatus } from "@/lib/auth.functions";

/**
 * After a support-assisted password reset the player must pick a new permanent
 * password before using the app again.
 */
export function PasswordGate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const status = useQuery({
    queryKey: ["password-status", user?.id ?? null],
    queryFn: () => getPasswordStatus(),
    enabled: Boolean(user),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (status.data?.mustChangePassword && pathname !== "/change-password") {
      navigate({ to: "/change-password" });
    }
  }, [status.data?.mustChangePassword, pathname, navigate]);

  return null;
}

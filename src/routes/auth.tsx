import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, KeyRound, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { registerAccount } from "@/lib/auth.functions";
import { checkLoginThrottle, recordLoginAttempt } from "@/lib/security.functions";

import { isValidMobile } from "@/lib/phone";
import { signInWithMobile } from "@/lib/mobile-signin";
import { whatsappHref } from "@/lib/contact";
import { WhatsAppLogo } from "@/components/WhatsAppLogo";


export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Welcome Back — GD BOSS777" },
      {
        name: "description",
        content: "Sign in to GD BOSS777 with your mobile number and password.",
      },
      { property: "og:title", content: "Welcome Back — GD BOSS777" },
      { property: "og:description", content: "Mobile number and password login." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const register = useServerFn(registerAccount);
  const checkThrottle = useServerFn(checkLoginThrottle);
  const recordAttempt = useServerFn(recordLoginAttempt);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [referral, setReferral] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  async function doLogin() {
    setError(null);
    if (!isValidMobile(phone)) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const identifier = phone.replace(/\D/g, "");
    try {
      const gate = await checkThrottle({ data: { identifier } });
      if (!gate.allowed) {
        throw new Error(
          `Too many failed attempts. Please try again in ${gate.minutes} minute(s) or contact support.`,
        );
      }
      const { error: signInError } = await signInWithMobile(phone, password);
      await recordAttempt({ data: { identifier, success: !signInError } });
      if (signInError) {
        throw new Error("Incorrect mobile number or password");
      }
      toast.success("Login successful");
      navigate({ to: "/" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Login failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function doRegister() {
    setError(null);
    if (!isValidMobile(phone)) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    if (name.trim().length < 2) {
      setError("Please enter your name");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await register({
        data: {
          phone: phone.replace(/\D/g, ""),
          fullName: name.trim(),
          password,
          ...(referral.trim() ? { referralCode: referral.trim().toUpperCase() } : {}),
        },
      });

      const { error: signInError } = await signInWithMobile(phone, password);
      if (signInError) throw new Error("Account created. Please log in.");
      toast.success("Account created");
      navigate({ to: "/" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not create account";
      setError(msg);
      toast.error(msg);
      if (/already exists/i.test(msg)) setMode("login");
    } finally {
      setLoading(false);
    }
  }

  const field =
    "w-full rounded-xl border border-border bg-background py-3.5 px-4 outline-none text-base placeholder:text-muted-foreground/60";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="brand-gradient text-white">
        <div className="mx-auto max-w-md px-4 py-5 flex items-center gap-3">
          <Link to="/" className="rounded-full p-1.5 bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="text-[11px] uppercase tracking-widest text-white/70">GD BOSS777</div>
            <h1 className="text-lg font-extrabold">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-md px-4 py-8 flex flex-col justify-center">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="text-center mb-6">
            <div className="mx-auto h-14 w-14 rounded-2xl brand-gradient text-white grid place-items-center shadow-md mb-4">
              {mode === "login" ? (
                <KeyRound className="h-7 w-7" />
              ) : (
                <UserPlus className="h-7 w-7" />
              )}
            </div>
            <h2 className="text-xl font-bold">
              {mode === "login" ? "Login with Password" : "New Registration"}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {mode === "login"
                ? "Enter your mobile number and password"
                : "Create your account to start playing"}
            </p>
          </div>

          <label className="text-xs font-semibold text-muted-foreground">Mobile Number</label>
          <div
            className={`mt-1.5 flex items-center rounded-xl border bg-background px-3 ${
              error ? "border-destructive ring-1 ring-destructive" : "border-border"
            }`}
          >
            <span className="text-sm font-semibold text-muted-foreground pr-2 border-r border-border">
              +91
            </span>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="Enter Mobile Number"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, ""));
                if (error) setError(null);
              }}
              className="flex-1 bg-transparent py-3.5 pl-3 outline-none text-base placeholder:text-muted-foreground/60"
            />
          </div>

          {mode === "register" && (
            <>
              <label className="mt-4 block text-xs font-semibold text-muted-foreground">Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`mt-1.5 ${field}`}
              />
            </>
          )}

          <label className="mt-4 block text-xs font-semibold text-muted-foreground">Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            className={`mt-1.5 ${field}`}
          />

          {mode === "register" && (
            <>
              <label className="mt-4 block text-xs font-semibold text-muted-foreground">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Re-enter password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={`mt-1.5 ${field}`}
              />
              <label className="mt-4 block text-xs font-semibold text-muted-foreground">
                Referral Code (optional)
              </label>
              <input
                type="text"
                placeholder="Enter friend's referral code"
                value={referral}
                onChange={(e) => setReferral(e.target.value.toUpperCase())}
                className={`mt-1.5 ${field}`}
              />
            </>
          )}

          {error && <p className="mt-2 text-xs text-destructive font-medium">{error}</p>}

          <button
            onClick={mode === "login" ? doLogin : doRegister}
            disabled={loading}
            className="mt-5 w-full brand-gradient text-white font-semibold py-3.5 rounded-xl disabled:opacity-60 active:scale-[0.98] transition"
          >
            {loading
              ? mode === "login"
                ? "Logging in..."
                : "Creating..."
              : mode === "login"
                ? "Login"
                : "Create Account"}
          </button>

          <button
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError(null);
              setPassword("");
              setConfirm("");
            }}
            className="mt-4 w-full text-center text-xs text-muted-foreground"
          >
            {mode === "login" ? (
              <>
                New user?{" "}
                <span className="font-semibold text-[var(--brand)]">Create an account</span>
              </>
            ) : (
              <>
                Already registered? <span className="font-semibold text-[var(--brand)]">Login</span>
              </>
            )}
          </button>
        </div>

        <a
          href={whatsappHref("Hello, I need help with my account.")}
          target="_blank"
          rel="noreferrer"
          className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] text-white font-bold py-3.5 shadow-md active:scale-[0.98] transition"
        >
          <WhatsAppLogo className="h-5 w-5" />
          Help / Support
        </a>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Forgot your password? Contact support to get it reset.
        </p>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          By continuing you agree to our Terms and Conditions.
        </p>
      </main>
    </div>
  );
}

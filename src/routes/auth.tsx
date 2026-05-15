import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Icon } from "../components/Icon";
import { useAuth } from "../lib/auth-context";
import { auth as authApi, ApiError } from "../lib/api";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { verified?: "1" | "0" } => {
    const v = search.verified;
    if (v === "1" || v === 1) return { verified: "1" };
    if (v === "0" || v === 0) return { verified: "0" };
    return {};
  },
  head: () => ({
    meta: [
      { title: "Sign in or create your account — ShopSmart" },
      {
        name: "description",
        content:
          "Sign in to ShopSmart or create a new account to access exclusive collections and a seamless shopping experience.",
      },
      { property: "og:title", content: "ShopSmart — Sign in or Sign up" },
      {
        property: "og:description",
        content: "Join ShopSmart for premium products and a seamless shopping experience.",
      },
    ],
  }),
  component: AuthPage,
});

type Mode = "register" | "login";
const RESEND_COOLDOWN = 120; // seconds

function AuthPage() {
  const { user, loading, login, register } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<Mode>(search.verified === "1" ? "login" : "register");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifyBanner] = useState<"success" | "failure" | null>(
    search.verified === "1" ? "success" : search.verified === "0" ? "failure" : null,
  );

  // Verification screen state (after successful register)
  const [verificationSent, setVerificationSent] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resendInfo, setResendInfo] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        setCooldown((c) => (c <= 1 ? 0 : c - 1));
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [cooldown]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "register") {
      if (username.trim().length < 3) return setError("Username must be at least 3 characters.");
      if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Please enter a valid email address.");
      if (password.length < 8) return setError("Password must be at least 8 characters.");
    } else {
      if (!username.trim() || !password) return setError("Enter your username and password.");
    }

    setSubmitting(true);
    try {
      if (mode === "register") {
        await register(username.trim(), email.trim(), password);
        // Show "verify your email" screen instead of navigating away
        setPendingEmail(email.trim());
        setVerificationSent(true);
        setCooldown(RESEND_COOLDOWN);
      } else {
        await login(username.trim(), password);
        navigate({ to: "/" });
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const resendVerification = async () => {
    if (cooldown > 0 || resending) return;
    setResendInfo(null);
    setError(null);
    setResending(true);
    try {
      await authApi.resendVerification(pendingEmail || undefined);
      setResendInfo("Verification email sent again. Check your inbox.");
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not resend verification email.");
    } finally {
      setResending(false);
    }
  };

  const formatCooldown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left brand panel */}
      <aside className="hidden lg:flex flex-col justify-between bg-primary text-primary-foreground p-10 relative overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-lg bg-primary-foreground/15 flex items-center justify-center">
            <Icon name="storefront" className="text-[22px]" />
          </span>
          <span className="font-display font-bold text-xl">ShopSmart</span>
        </div>
        <div className="relative z-10">
          <h1 className="font-display font-bold text-4xl xl:text-5xl leading-tight">
            Elevate your everyday.
          </h1>
          <p className="mt-4 text-primary-foreground/80 max-w-md">
            Join our community to access exclusive collections and a seamless shopping experience.
          </p>
        </div>
        <div className="text-primary-foreground/60 text-sm">© ShopSmart</div>
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -bottom-24 -right-24 w-80 h-80 bg-primary-foreground/10 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -top-16 -left-16 w-64 h-64 bg-primary-foreground/10 rounded-full blur-3xl" />
      </aside>

      {/* Right form panel */}
      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 lg:hidden mb-6">
            <span className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <Icon name="storefront" className="text-[22px]" />
            </span>
            <span className="font-display font-bold text-xl">ShopSmart</span>
          </div>

          {verificationSent ? (
            /* ---------------- Verification sent screen ---------------- */
            <div>
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Icon name="mark_email_read" className="text-[28px]" />
              </div>
              <h2 className="mt-4 font-display font-bold text-3xl">Check your email</h2>
              <p className="text-muted-foreground mt-2">
                Please click the verification link sent to{" "}
                <span className="font-medium text-foreground">{pendingEmail || "your email"}</span>.
                Once verified, sign in to start shopping.
              </p>

              {resendInfo && (
                <div className="mt-6 text-sm text-primary bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">
                  {resendInfo}
                </div>
              )}
              {error && (
                <div className="mt-6 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={resendVerification}
                  disabled={cooldown > 0 || resending}
                  className="w-full py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {resending
                    ? "Sending..."
                    : cooldown > 0
                      ? `Resend in ${formatCooldown(cooldown)}`
                      : "Resend verification link"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVerificationSent(false);
                    setMode("login");
                    setPassword("");
                    setError(null);
                    setResendInfo(null);
                  }}
                  className="w-full py-3 rounded-full bg-secondary text-foreground font-semibold hover:bg-accent transition"
                >
                  I've verified — Sign in
                </button>
                <Link
                  to="/"
                  className="block text-center text-sm text-muted-foreground hover:text-foreground"
                >
                  Continue browsing
                </Link>
              </div>
            </div>
          ) : (
            <>
              <h2 className="font-display font-bold text-3xl">Welcome</h2>
              <p className="text-muted-foreground mt-1">Please enter your details to continue.</p>

              {verifyBanner === "success" && (
                <div className="mt-4 text-sm text-primary bg-primary/10 border border-primary/20 rounded-lg px-3 py-2 flex items-start gap-2">
                  <Icon name="check_circle" className="text-[18px] mt-0.5" />
                  <span>Email verified successfully. Please sign in to continue.</span>
                </div>
              )}
              {verifyBanner === "failure" && (
                <div className="mt-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 flex items-start gap-2">
                  <Icon name="error" className="text-[18px] mt-0.5" />
                  <span>
                    Verification link is invalid or expired. Sign up again or resend the verification email.
                  </span>
                </div>
              )}

              {/* Toggle */}
              <div className="mt-6 grid grid-cols-2 p-1 rounded-full bg-secondary text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className={`py-2 rounded-full transition ${
                    mode === "register" ? "bg-card shadow text-foreground" : "text-muted-foreground"
                  }`}
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`py-2 rounded-full transition ${
                    mode === "login" ? "bg-card shadow text-foreground" : "text-muted-foreground"
                  }`}
                >
                  Login
                </button>
              </div>

              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <Field label="Username" icon="person">
                  <input
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="alex.morgan"
                    className="bg-transparent border-0 focus:ring-0 outline-none w-full text-sm"
                  />
                </Field>

                {mode === "register" && (
                  <Field label="Email Address" icon="mail">
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="mail@example.com"
                      className="bg-transparent border-0 focus:ring-0 outline-none w-full text-sm"
                    />
                  </Field>
                )}

                <Field label="Password" icon="lock">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete={mode === "register" ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-transparent border-0 focus:ring-0 outline-none w-full text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <Icon
                      name={showPassword ? "visibility_off" : "visibility"}
                      className="text-[20px]"
                    />
                  </button>
                </Field>
                {mode === "register" && (
                  <p className="text-xs text-muted-foreground">Must be at least 8 characters long.</p>
                )}

                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition disabled:opacity-60"
                >
                  {submitting
                    ? mode === "register"
                      ? "Creating account..."
                      : "Signing in..."
                    : mode === "register"
                      ? "Create Account"
                      : "Sign In"}
                </button>
              </form>

              <p className="mt-8 text-center text-xs text-muted-foreground">
                By creating an account, you agree to our{" "}
                <Link to="/" className="underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/" className="underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="mt-1.5 flex items-center gap-2 px-3 h-12 rounded-xl bg-secondary border border-transparent focus-within:border-primary focus-within:bg-card transition">
        <Icon name={icon} className="text-muted-foreground text-[20px]" />
        {children}
      </div>
    </label>
  );
}

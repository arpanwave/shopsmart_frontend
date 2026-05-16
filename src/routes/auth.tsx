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
    ],
  }),
  component: AuthPage,
});

type Mode = "register" | "login";

const RESEND_COOLDOWN = 120;

function AuthPage() {
  const { user, loading, login, register, refreshUser } = useAuth();

  const navigate = useNavigate();
  const search = Route.useSearch();

  const [mode, setMode] = useState<Mode>(
    search.verified === "1" ? "login" : "register",
  );

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [oauthLoading, setOauthLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [verifyBanner] = useState<"success" | "failure" | null>(
    search.verified === "1"
      ? "success"
      : search.verified === "0"
        ? "failure"
        : null,
  );

  const [verificationSent, setVerificationSent] = useState(false);

  const [pendingEmail, setPendingEmail] = useState("");

  const [cooldown, setCooldown] = useState(0);

  const [resending, setResending] = useState(false);

  const [resendInfo, setResendInfo] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/" });
    }
  }, [user, loading, navigate]);

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
      if (username.trim().length < 3) {
        return setError("Username must be at least 3 characters.");
      }

      if (!/^\S+@\S+\.\S+$/.test(email)) {
        return setError("Please enter a valid email address.");
      }

      if (password.length < 8) {
        return setError("Password must be at least 8 characters.");
      }
    } else {
      if (!username.trim() || !password) {
        return setError("Enter your username and password.");
      }
    }

    setSubmitting(true);

    try {
      if (mode === "register") {
        await register(username.trim(), email.trim(), password);

        setPendingEmail(email.trim());

        setVerificationSent(true);

        setCooldown(RESEND_COOLDOWN);
      } else {
        await login(username.trim(), password);

        await refreshUser();

        navigate({ to: "/" });
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.";

      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    setOauthLoading(true);

    window.location.href =
      `${import.meta.env.VITE_API_URL}/oauth2/authorization/google`;
  };

  const resendVerification = async () => {
    if (cooldown > 0 || resending) return;

    setResendInfo(null);

    setError(null);

    setResending(true);

    try {
      await authApi.resendVerification(pendingEmail || undefined);

      setResendInfo(
        "Verification email sent again. Check your inbox.",
      );

      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not resend verification email.",
      );
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
      <aside className="hidden lg:flex flex-col justify-between bg-primary text-primary-foreground p-10 relative overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-lg bg-primary-foreground/15 flex items-center justify-center">
            <Icon name="storefront" className="text-[22px]" />
          </span>

          <span className="font-display font-bold text-xl">
            ShopSmart
          </span>
        </div>

        <div className="relative z-10">
          <h1 className="font-display font-bold text-4xl xl:text-5xl leading-tight">
            Elevate your everyday.
          </h1>

          <p className="mt-4 text-primary-foreground/80 max-w-md">
            Join our community to access exclusive collections
            and a seamless shopping experience.
          </p>
        </div>

        <div className="text-primary-foreground/60 text-sm">
          © ShopSmart
        </div>
      </aside>

      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <h2 className="font-display font-bold text-3xl">
            Welcome
          </h2>

          <p className="text-muted-foreground mt-1">
            Please enter your details to continue.
          </p>

          {/* GOOGLE LOGIN */}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={oauthLoading}
            className="mt-6 w-full border border-border rounded-full h-12 flex items-center justify-center gap-3 hover:bg-secondary transition disabled:opacity-60"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              className="w-5 h-5"
            >
              <path
                fill="#FFC107"
                d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12S17.4 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
              />
            </svg>

            <span className="font-medium">
              {oauthLoading
                ? "Redirecting..."
                : "Continue with Google"}
            </span>
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>

            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">
                OR CONTINUE WITH
              </span>
            </div>
          </div>

          {/* YOUR EXISTING FORM CONTINUES HERE */}

          {/* KEEP REST OF YOUR CURRENT FORM EXACTLY SAME */}
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
      <span className="text-sm font-medium text-foreground">
        {label}
      </span>

      <div className="mt-1.5 flex items-center gap-2 px-3 h-12 rounded-xl bg-secondary border border-transparent focus-within:border-primary focus-within:bg-card transition">
        <Icon
          name={icon}
          className="text-muted-foreground text-[20px]"
        />

        {children}
      </div>
    </label>
  );
}
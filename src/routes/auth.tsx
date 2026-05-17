import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { Icon } from "../components/Icon";

import { useAuth } from "../lib/auth-context";

import {
  auth as authApi,
  ApiError,
} from "../lib/api";

export const Route =
  createFileRoute("/auth")({

    validateSearch: (
      search: Record<string, unknown>
    ): { verified?: "1" | "0" } => {

      const v = search.verified;

      if (v === "1" || v === 1) {
        return { verified: "1" };
      }

      if (v === "0" || v === 0) {
        return { verified: "0" };
      }

      return {};
    },

    head: () => ({
      meta: [
        {
          title:
            "Sign in or create your account — ShopSmart",
        },
        {
          name: "description",
          content:
            "Sign in to ShopSmart or create a new account to access exclusive collections and a seamless shopping experience.",
        },
      ],
    }),

    component: AuthPage,
  });

type Mode =
  | "register"
  | "login";

const RESEND_COOLDOWN = 120;

function AuthPage() {

  const {
    user,
    loading,
    login,
    register,
    refreshUser,
  } = useAuth();

  const navigate =
    useNavigate();

  const search =
    Route.useSearch();

  const [mode, setMode] =
    useState<Mode>(
      search.verified === "1"
        ? "login"
        : "register"
    );

  const [username, setUsername] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    oauthLoading,
    setOauthLoading,
  ] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [verifyBanner] =
    useState<
      "success" | "failure" | null
    >(
      search.verified === "1"
        ? "success"
        : search.verified === "0"
          ? "failure"
          : null
    );

  const [
    verificationSent,
    setVerificationSent,
  ] = useState(false);

  const [
    pendingEmail,
    setPendingEmail,
  ] = useState("");

  const [cooldown, setCooldown] =
    useState(0);

  const [resending, setResending] =
    useState(false);

  const [resendInfo, setResendInfo] =
    useState<string | null>(null);

  const timerRef =
    useRef<
      ReturnType<typeof setInterval> | null
    >(null);

  useEffect(() => {

    if (!loading && user) {
      navigate({ to: "/" });
    }

  }, [user, loading, navigate]);

  useEffect(() => {

    if (cooldown <= 0) {

      if (timerRef.current) {

        clearInterval(
          timerRef.current
        );

        timerRef.current = null;
      }

      return;
    }

    if (!timerRef.current) {

      timerRef.current =
        setInterval(() => {

          setCooldown((c) =>
            c <= 1 ? 0 : c - 1
          );

        }, 1000);
    }

    return () => {

      if (timerRef.current) {

        clearInterval(
          timerRef.current
        );

        timerRef.current = null;
      }
    };

  }, [cooldown]);

  const onSubmit = async (
    e: FormEvent
  ) => {

    e.preventDefault();

    setError(null);

    if (mode === "register") {

      if (
        username.trim().length < 3
      ) {
        return setError(
          "Username must be at least 3 characters."
        );
      }

      if (
        !/^\S+@\S+\.\S+$/.test(
          email
        )
      ) {
        return setError(
          "Please enter a valid email address."
        );
      }

      if (
        password.length < 8
      ) {
        return setError(
          "Password must be at least 8 characters."
        );
      }

    } else {

      if (
        !username.trim() ||
        !password
      ) {
        return setError(
          "Enter your username and password."
        );
      }
    }

    setSubmitting(true);

    try {

      if (mode === "register") {

        await register(
          username.trim(),
          email.trim(),
          password
        );

        setPendingEmail(
          email.trim()
        );

        setVerificationSent(true);

        setCooldown(
          RESEND_COOLDOWN
        );

      } else {

        await login(
          username.trim(),
          password
        );

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

  const resendVerification =
    async () => {

      if (
        cooldown > 0 ||
        resending
      ) {
        return;
      }

      setResendInfo(null);

      setError(null);

      setResending(true);

      try {

        await authApi.resendVerification(
          pendingEmail ||
          undefined
        );

        setResendInfo(
          "Verification email sent again. Check your inbox."
        );

        setCooldown(
          RESEND_COOLDOWN
        );

      } catch (err) {

        setError(
          err instanceof ApiError
            ? err.message
            : "Could not resend verification email."
        );

      } finally {

        setResending(false);
      }
    };

  const formatCooldown = (
    s: number
  ) => {

    const m =
      Math.floor(s / 60);

    const sec = s % 60;

    return `${m}:${sec
      .toString()
      .padStart(2, "0")}`;
  };

  return (

    <div className="min-h-screen bg-background lg:grid lg:grid-cols-2">

      {/* LEFT PANEL */}

      <aside className="hidden lg:flex flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground relative">

        <div className="flex items-center gap-3">

          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/15">

            <Icon
              name="storefront"
              className="text-[22px]"
            />

          </span>

          <span className="font-display text-2xl font-bold">
            ShopSmart
          </span>

        </div>

        <div className="relative z-10 max-w-lg">

          <h1 className="font-display text-4xl font-bold leading-tight xl:text-5xl">
            Elevate your everyday.
          </h1>

          <p className="mt-5 text-lg text-primary-foreground/80">
            Join our community to access exclusive collections
            and a seamless shopping experience.
          </p>

        </div>

        <div className="text-sm text-primary-foreground/60">
          © ShopSmart
        </div>

      </aside>

      {/* RIGHT PANEL */}

      <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 sm:py-10 lg:px-10">

        <div className="w-full max-w-md">

          {/* MOBILE LOGO */}

          <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">

            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">

              <Icon
                name="storefront"
                className="text-[22px]"
              />

            </span>

            <span className="font-display text-2xl font-bold">
              ShopSmart
            </span>

          </div>

          {/* HEADER */}

          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Welcome
          </h2>

          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Please enter your details to continue.
          </p>

          {/* VERIFY BANNER */}

          {verifyBanner === "success" && (

            <div className="mt-4 rounded-xl border border-primary/20 bg-primary/10 px-3 py-3 text-sm text-primary">

              Email verified successfully.
              Please sign in to continue.

            </div>
          )}

          {verifyBanner === "failure" && (

            <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-3 text-sm text-destructive">

              Verification failed or expired.

            </div>
          )}

          {/* SUCCESS MESSAGE */}

          {verificationSent && (

            <div className="mt-4 rounded-xl border border-primary/20 bg-primary/10 px-3 py-3 text-sm text-primary">

              Verification email sent to{" "}
              <span className="font-semibold break-all">
                {pendingEmail}
              </span>

              <div className="mt-3">

                <button
                  type="button"
                  onClick={
                    resendVerification
                  }
                  disabled={
                    cooldown > 0 ||
                    resending
                  }
                  className="font-semibold underline underline-offset-2 disabled:opacity-50"
                >

                  {resending
                    ? "Sending..."
                    : cooldown > 0
                      ? `Resend in ${formatCooldown(cooldown)}`
                      : "Resend verification email"}

                </button>

              </div>

            </div>
          )}

          {resendInfo && (

            <div className="mt-4 rounded-xl border border-primary/20 bg-primary/10 px-3 py-3 text-sm text-primary">

              {resendInfo}

            </div>
          )}

          {/* TOGGLE */}

          <div className="mt-6 grid grid-cols-2 rounded-full bg-secondary p-1 text-sm font-semibold">

            <button
              type="button"
              onClick={() =>
                setMode(
                  "register"
                )
              }
              className={`rounded-full py-2.5 transition ${
                mode === "register"
                  ? "bg-card text-foreground shadow"
                  : "text-muted-foreground"
              }`}
            >

              Sign Up

            </button>

            <button
              type="button"
              onClick={() =>
                setMode("login")
              }
              className={`rounded-full py-2.5 transition ${
                mode === "login"
                  ? "bg-card text-foreground shadow"
                  : "text-muted-foreground"
              }`}
            >

              Login

            </button>

          </div>

          {/* FORM */}

          <form
            onSubmit={onSubmit}
            className="mt-6 space-y-4"
          >

            <Field
              label="Username"
              icon="person"
            >

              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value
                  )
                }
                placeholder="alex.morgan"
                className="w-full bg-transparent text-sm outline-none"
              />

            </Field>

            {mode ===
              "register" && (

              <Field
                label="Email Address"
                icon="mail"
              >

                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(
                      e.target.value
                    )
                  }
                  placeholder="mail@example.com"
                  className="w-full bg-transparent text-sm outline-none"
                />

              </Field>
            )}

            <Field
              label="Password"
              icon="lock"
            >

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                autoComplete={
                  mode ===
                  "register"
                    ? "new-password"
                    : "current-password"
                }
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                placeholder="••••••••"
                className="w-full bg-transparent text-sm outline-none"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (v) => !v
                  )
                }
                className="text-muted-foreground transition hover:text-foreground"
              >

                <Icon
                  name={
                    showPassword
                      ? "visibility_off"
                      : "visibility"
                  }
                  className="text-[20px]"
                />

              </button>

            </Field>

            {error && (

              <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-3 text-sm text-destructive">

                {error}

              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60 sm:text-base"
            >

              {submitting
                ? mode ===
                  "register"
                  ? "Creating account..."
                  : "Signing in..."
                : mode ===
                  "register"
                  ? "Create Account"
                  : "Sign In"}

            </button>

          </form>

          {/* DIVIDER */}

          <div className="relative my-6">

            <div className="absolute inset-0 flex items-center">

              <div className="w-full border-t border-border" />

            </div>

            <div className="relative flex justify-center text-xs uppercase">

              <span className="bg-background px-3 text-muted-foreground">
                Or continue with
              </span>

            </div>

          </div>

          {/* GOOGLE BUTTON */}

          <button
            type="button"
            onClick={
              handleGoogleLogin
            }
            disabled={oauthLoading}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-border px-4 transition hover:bg-secondary disabled:opacity-60"
          >

            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              className="h-5 w-5 shrink-0"
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

          {/* FOOTER */}

          <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">

            By continuing, you agree to our{" "}

            <Link
              to="/"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Terms
            </Link>

            {" "}and{" "}

            <Link
              to="/"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Privacy Policy
            </Link>

          </p>

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

      <div className="mt-1.5 flex h-12 items-center gap-2 rounded-xl border border-transparent bg-secondary px-3 transition focus-within:border-primary focus-within:bg-card">

        <Icon
          name={icon}
          className="text-[20px] text-muted-foreground"
        />

        {children}

      </div>

    </label>
  );
}
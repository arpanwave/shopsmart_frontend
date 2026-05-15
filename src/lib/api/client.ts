/**
 * Central HTTP client for the ShopSmart backend.
 *
 * Auth strategy:
 * - httpOnly cookies
 * - Browser automatically sends cookies
 * - Frontend never stores JWT tokens
 */

const RAW_API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:8080";

if (
  typeof window !== "undefined" &&
  window.location.protocol === "https:" &&
  RAW_API_BASE.startsWith("http://") &&
  !RAW_API_BASE.startsWith("http://localhost")
) {
  console.warn(
    "[api] Upgrading insecure API_BASE to https."
  );
}

export const API_BASE =
  typeof window !== "undefined" &&
  window.location.protocol === "https:" &&
  RAW_API_BASE.startsWith("http://") &&
  !RAW_API_BASE.startsWith("http://localhost")
    ? RAW_API_BASE.replace(/^http:\/\//, "https://")
    : RAW_API_BASE;

/* -------------------------------------------------- */
/* ApiError */
/* -------------------------------------------------- */

export class ApiError extends Error {

  status: number;

  data: unknown;

  constructor(
    message: string,
    status: number,
    data: unknown
  ) {

    super(message);

    this.status = status;

    this.data = data;
  }
}

/* -------------------------------------------------- */
/* Safe error messages */
/* -------------------------------------------------- */

function genericMessageForStatus(
  status: number
): string {

  if (status === 400) {
    return "Invalid request.";
  }

  if (status === 401) {
    return "Please sign in to continue.";
  }

  if (status === 403) {
    return "You do not have permission.";
  }

  if (status === 404) {
    return "Resource not found.";
  }

  if (status === 409) {
    return "Conflict occurred.";
  }

  if (status === 422) {
    return "Invalid data provided.";
  }

  if (status >= 500) {
    return "Server error.";
  }

  return "Something went wrong.";
}

function looksSafeUserMessage(
  s: string
): boolean {

  const trimmed = s.trim();

  if (!trimmed) {
    return false;
  }

  if (trimmed.length > 200) {
    return false;
  }

  if (trimmed.includes("\n")) {
    return false;
  }

  return true;
}

function pickSafeErrorMessage(
  data: unknown,
  status: number
): string {

  if (
    data &&
    typeof data === "object"
  ) {

    const rec =
      data as Record<string, unknown>;

    if (
      typeof rec.message === "string" &&
      looksSafeUserMessage(rec.message)
    ) {

      return rec.message.trim();
    }
  }

  return genericMessageForStatus(status);
}

/* -------------------------------------------------- */
/* Request plumbing */
/* -------------------------------------------------- */

type RequestOpts = {

  method?:
    | "GET"
    | "POST"
    | "PUT"
    | "DELETE"
    | "PATCH";

  body?: unknown;

  headers?: Record<string, string>;

  unwrap?: boolean;

  // Set to false on public endpoints so a 401 doesn't trigger a token
  // refresh attempt or a redirect to /auth (anonymous browsing).
  auth?: boolean;

  // Internal: set when this call is itself a retry after a token refresh,
  // so we don't loop infinitely if the retry also returns 401.
  _retried?: boolean;

  // Internal: skip the auto-refresh-on-401 flow entirely (used by the
  // refresh and login/logout endpoints themselves).
  _skipAuthRetry?: boolean;
};

/* -------------------------------------------------- */
/* Session tracking + 401 → refresh interceptor       */
/* -------------------------------------------------- */

// Tracks whether the user is (or was recently) authenticated. We only
// hard-redirect to /auth on a failed refresh if we believed the user had
// a session — anonymous browsing must stay on the page.
let hasSession = false;

// Listeners notified when the refresh flow concludes the session is dead.
type SessionEndListener = () => void;
const sessionEndListeners: Set<SessionEndListener> = new Set();

export const session = {
  markActive() {
    hasSession = true;
  },
  markEnded() {
    hasSession = false;
  },
  isActive() {
    return hasSession;
  },
  onEnded(fn: SessionEndListener) {
    sessionEndListeners.add(fn);
    return () => sessionEndListeners.delete(fn);
  },
};

// Coalesce concurrent refresh attempts into a single network call.
let refreshInFlight: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        await rawRequest<unknown>("/api/auth/refresh", {
          method: "POST",
          _skipAuthRetry: true,
        });
        return true;
      } catch {
        return false;
      } finally {
        // Allow the next refresh attempt later (e.g. after another expiry).
        setTimeout(() => {
          refreshInFlight = null;
        }, 0);
      }
    })();
  }
  return refreshInFlight;
}

function endSessionAndRedirect() {
  hasSession = false;
  sessionEndListeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* noop */
    }
  });
  if (typeof window !== "undefined" && window.location.pathname !== "/auth") {
    window.location.href = "/auth";
  }
}

async function rawRequest<T>(
  path: string,
  opts: RequestOpts = {}
): Promise<T> {

  const {
    method = "GET",
    body,
    headers = {},
    unwrap = true,
    auth = true,
    _retried = false,
    _skipAuthRetry = false,
  } = opts;

  // Public endpoints opt out of the refresh/redirect flow.
  const skipAuthRetry = _skipAuthRetry || !auth;

  const isFormData =
    typeof FormData !== "undefined" &&
    body instanceof FormData;

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...headers,
  };

  let payload: BodyInit | undefined;

  if (
    body !== undefined &&
    body !== null
  ) {

    if (isFormData) {

      payload =
        body as FormData;

    } else {

      finalHeaders["Content-Type"] =
        "application/json";

      payload =
        JSON.stringify(body);
    }
  }

  const res = await fetch(
    `${API_BASE}${path}`,
    {
      method,
      headers: finalHeaders,
      body: payload,

      // VERY IMPORTANT
      credentials: "include",
    }
  );

  // 401 interceptor: try a one-time refresh, then retry the original call.
  // Skipped for the refresh/login/logout calls themselves.
  if (
    res.status === 401 &&
    !_retried &&
    !skipAuthRetry
  ) {
    const refreshed = await attemptRefresh();
    if (refreshed) {
      return rawRequest<T>(path, { ...opts, _retried: true });
    }
    // Refresh failed. If the user was logged in, kick them to /auth.
    if (hasSession) {
      endSessionAndRedirect();
    }
    // Fall through and throw the original 401 below.
  }

  let data: unknown = null;

  const contentType =
    res.headers.get("content-type") || "";

  if (
    contentType.includes(
      "application/json"
    )
  ) {

    try {

      data = await res.json();

    } catch {

      data = null;
    }

  } else {

    try {

      const text =
        await res.text();

      data = text || null;

    } catch {

      data = null;
    }
  }

  if (!res.ok) {

    throw new ApiError(
      pickSafeErrorMessage(
        data,
        res.status
      ),
      res.status,
      data
    );
  }

  // Spring response format:
  // { success, message, data }

  if (
    unwrap &&
    data &&
    typeof data === "object" &&
    "success" in (
      data as Record<string, unknown>
    ) &&
    "data" in (
      data as Record<string, unknown>
    )
  ) {

    return (
      data as { data: T }
    ).data;
  }

  return data as T;
}

/* -------------------------------------------------- */
/* API methods */
/* -------------------------------------------------- */

export const api = {

  get: <T>(
    path: string,
    opts?: Omit<
      RequestOpts,
      "method" | "body"
    >
  ) =>
    rawRequest<T>(
      path,
      {
        ...opts,
        method: "GET",
      }
    ),

  post: <T>(
    path: string,
    body?: unknown,
    opts?: Omit<
      RequestOpts,
      "method" | "body"
    >
  ) =>
    rawRequest<T>(
      path,
      {
        ...opts,
        method: "POST",
        body,
      }
    ),

  put: <T>(
    path: string,
    body?: unknown,
    opts?: Omit<
      RequestOpts,
      "method" | "body"
    >
  ) =>
    rawRequest<T>(
      path,
      {
        ...opts,
        method: "PUT",
        body,
      }
    ),

  patch: <T>(
    path: string,
    body?: unknown,
    opts?: Omit<
      RequestOpts,
      "method" | "body"
    >
  ) =>
    rawRequest<T>(
      path,
      {
        ...opts,
        method: "PATCH",
        body,
      }
    ),

  delete: <T>(
    path: string,
    opts?: Omit<
      RequestOpts,
      "method" | "body"
    >
  ) =>
    rawRequest<T>(
      path,
      {
        ...opts,
        method: "DELETE",
      }
    ),
};
import {
  createRouter,
  useRouter,
} from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";

function DefaultErrorComponent({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {

  const router =
    useRouter();

  return (

    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8 sm:px-6">

      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 text-center shadow-sm sm:p-8">

        {/* Icon */}

        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 sm:h-20 sm:w-20">

          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-destructive sm:h-10 sm:w-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >

            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />

          </svg>

        </div>

        {/* Heading */}

        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Something went wrong
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          An unexpected error occurred.
          Please try again.
        </p>

        {/* Dev Error */}

        {import.meta.env.DEV &&
          error.message && (

          <pre className="mt-5 max-h-48 overflow-auto rounded-xl bg-muted p-4 text-left font-mono text-xs leading-relaxed text-destructive whitespace-pre-wrap break-words">

            {error.message}

          </pre>
        )}

        {/* Actions */}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">

          <button
            onClick={() => {

              router.invalidate();

              reset();
            }}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:h-10"
          >

            Try again

          </button>

          <a
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-input bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-accent sm:h-10"
          >

            Go home

          </a>

        </div>

      </div>

    </div>
  );
}

export const getRouter = () => {

  const router =
    createRouter({

      routeTree,

      context: {},

      scrollRestoration: true,

      defaultPreloadStaleTime: 0,

      defaultErrorComponent:
        DefaultErrorComponent,
    });

  return router;
};
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "../components/AppLayout";
import { Icon } from "../components/Icon";
import { useAuth } from "../lib/auth-context";
import { admin as adminApi, ApiError, type Page, type User } from "../lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — ShopSmart" },
      {
        name: "description",
        content: "Manage users, block or unblock accounts.",
      },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [page, setPage] = useState<Page<User> | null>(null);
  const [pageNum, setPageNum] = useState(0);
  const [busyId, setBusyId] = useState<string | number | null>(null);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate({ to: "/auth" });
    } else if (!isAdmin) {
      navigate({ to: "/" });
    }
  }, [user, loading, isAdmin, navigate]);

  const refresh = async () => {
    try {
      const res = await adminApi.listUsers(pageNum, 10);
      setPage(res);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not load users"
      );
    }
  };

  useEffect(() => {
    if (isAdmin) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, pageNum]);

  const toggle = async (u: User) => {
    setBusyId(u.id);

    try {
      if (u.enabled) {
        await adminApi.block(u.id);
        toast.success(`Blocked ${u.username}`);
      } else {
        await adminApi.unblock(u.id);
        toast.success(`Unblocked ${u.username}`);
      }

      await refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 text-center">Loading...</div>
      </AppLayout>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display font-bold text-3xl">Admin</h1>
            <p className="text-muted-foreground mt-1">
              Manage user accounts.
            </p>
          </div>

          <span className="w-fit text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold">
            {page?.totalElements ?? 0} users
          </span>
        </div>

        {/* Users */}
        <div className="mt-6 bg-card border border-border rounded-2xl overflow-hidden">
          {page === null ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl bg-secondary animate-pulse"
                />
              ))}
            </div>
          ) : page.content.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              No users found.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {page.content.map((u) => (
                <li
                  key={u.id}
                  className="p-4 flex flex-col gap-4 sm:flex-row sm:items-center"
                >
                  {/* Left */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary grid place-items-center font-semibold shrink-0">
                      {u.username?.[0]?.toUpperCase() ?? "?"}
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold truncate">
                        {u.username}
                      </p>

                      <p className="text-xs text-muted-foreground truncate">
                        {u.email}
                      </p>
                    </div>
                  </div>

                  {/* Right */}
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <span
                      className={`text-[11px] uppercase tracking-wide font-semibold px-2 py-1 rounded-full ${
                        u.role === "ROLE_ADMIN"
                          ? "bg-primary/10 text-primary"
                          : "bg-accent text-accent-foreground"
                      }`}
                    >
                      {u.role?.replace("ROLE_", "") ?? "USER"}
                    </span>

                    <span
                      className={`text-[11px] font-semibold px-2 py-1 rounded-full ${
                        u.enabled
                          ? "bg-primary/10 text-primary"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {u.enabled ? "Active" : "Blocked"}
                    </span>

                    <button
                      onClick={() => toggle(u)}
                      disabled={busyId === u.id}
                      className={`px-3 py-2 text-xs font-semibold rounded-full inline-flex items-center gap-1 disabled:opacity-60 ${
                        u.enabled
                          ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                          : "bg-primary text-primary-foreground hover:opacity-90"
                      }`}
                    >
                      <Icon
                        name={u.enabled ? "block" : "check_circle"}
                        className="text-[14px]"
                      />

                      {busyId === u.id
                        ? "Please wait..."
                        : u.enabled
                        ? "Block"
                        : "Unblock"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Pagination */}
          {page && page.totalPages > 1 && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 border-t border-border text-sm">
              <button
                onClick={() => setPageNum((n) => Math.max(0, n - 1))}
                disabled={pageNum === 0}
                className="px-3 py-2 rounded-full bg-secondary disabled:opacity-50"
              >
                Previous
              </button>

              <span className="text-muted-foreground text-center">
                Page {pageNum + 1} of {page.totalPages}
              </span>

              <button
                onClick={() =>
                  setPageNum((n) =>
                    Math.min(page.totalPages - 1, n + 1)
                  )
                }
                disabled={pageNum >= page.totalPages - 1}
                className="px-3 py-2 rounded-full bg-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
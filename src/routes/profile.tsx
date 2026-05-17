import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "../components/AppLayout";
import { Icon } from "../components/Icon";
import { useAuth } from "../lib/auth-context";
import { orders as ordersApi, ApiError, type Order } from "../lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile — ShopSmart" },
      {
        name: "description",
        content:
          "Manage your ShopSmart profile, settings, and order history.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {

  const { user, loading, logout } = useAuth();

  const navigate = useNavigate();

  const [orderList, setOrderList] =
    useState<Order[] | null>(null);

  useEffect(() => {

    if (!loading && !user) {
      navigate({ to: "/auth" });
    }

  }, [user, loading, navigate]);

  useEffect(() => {

    if (!user) return;

    let cancelled = false;

    (async () => {

      try {

        const list =
          await ordersApi.list();

        if (!cancelled) {
          setOrderList(
            Array.isArray(list)
              ? list
              : []
          );
        }

      } catch {

        if (!cancelled) {
          setOrderList([]);
        }
      }

    })();

    return () => {
      cancelled = true;
    };

  }, [user]);

  const onLogout = async () => {

    try {

      await logout();

      toast.success("Signed out");

      navigate({ to: "/auth" });

    } catch (err) {

      toast.error(
        err instanceof ApiError
          ? err.message
          : "Could not sign out"
      );
    }
  };

  if (loading || !user) {
    return null;
  }

  const initial =
    user.username?.[0]?.toUpperCase() ?? "U";

  return (
    <AppLayout>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">

        {/* Profile Header */}

        <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center">

            {/* Avatar */}

            <div className="relative mx-auto lg:mx-0">

              <div className="grid h-20 w-20 place-items-center rounded-full bg-primary text-3xl font-bold text-primary-foreground sm:h-24 sm:w-24 sm:text-4xl font-display">
                {initial}
              </div>

              <button
                className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full border border-border bg-card text-muted-foreground transition hover:text-foreground"
                aria-label="Change photo"
              >

                <Icon
                  name="photo_camera"
                  className="text-[16px]"
                />

              </button>

            </div>

            {/* User Info */}

            <div className="min-w-0 flex-1 text-center lg:text-left">

              <h1 className="truncate font-display text-2xl font-bold sm:text-3xl">
                {user.username}
              </h1>

              <p className="mt-1 break-all text-sm text-muted-foreground sm:text-base">
                {user.email}
              </p>

              <div className="mt-3 flex flex-wrap justify-center gap-2 lg:justify-start">

                {(user.verified ?? user.enabled ?? true) ? (

                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">

                    <Icon
                      name="verified"
                      className="text-[14px]"
                    />

                    Verified

                  </span>

                ) : (

                  <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">

                    <Icon
                      name="schedule"
                      className="text-[14px]"
                    />

                    Email not verified

                  </span>

                )}

              </div>

            </div>

            {/* Edit Button */}

            <button
              onClick={() =>
                navigate({
                  to: "/products/manage",
                })
              }
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-accent px-4 py-3 font-semibold text-accent-foreground transition hover:bg-primary/10 sm:w-auto"
            >

              <Icon
                name="edit"
                className="text-[16px]"
              />

              Edit Profile

            </button>

          </div>

        </section>

        {/* Main Content */}

        <div className="grid gap-6 xl:grid-cols-[320px_1fr]">

          {/* Settings Sidebar */}

          <aside className="rounded-2xl border border-border bg-card p-2 h-fit">

            <SettingRow
              icon="local_shipping"
              title="Shipping Addresses"
              subtitle="Manage delivery locations"
            />

            <SettingRow
              icon="credit_card"
              title="Payment Methods"
              subtitle="Cards and digital wallets"
            />

            <SettingRow
              icon="notifications"
              title="Notifications"
              subtitle="Email and push alerts"
            />

            <SettingRow
              icon="shield_person"
              title="Security & Privacy"
              subtitle="Password and auth settings"
            />

            <button
              onClick={onLogout}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-destructive transition hover:bg-destructive/10"
            >

              <Icon
                name="logout"
                className="text-[18px]"
              />

              Sign Out

            </button>

          </aside>

          {/* Orders Section */}

          <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <h2 className="font-display text-xl font-semibold">
                Order History
              </h2>

              <Link
                to="/"
                className="inline-flex w-fit items-center text-sm font-semibold text-primary hover:underline"
              >
                Continue shopping
              </Link>

            </div>

            {/* Loading */}

            {orderList === null && (

              <div className="mt-4 space-y-3">

                <div className="h-20 animate-pulse rounded-xl bg-secondary" />

                <div className="h-20 animate-pulse rounded-xl bg-secondary" />

              </div>
            )}

            {/* Empty */}

            {orderList &&
              orderList.length === 0 && (

              <div className="mt-6 rounded-xl border border-dashed border-border py-10 text-center">

                <Icon
                  name="shopping_bag"
                  className="mx-auto text-[36px] text-muted-foreground"
                />

                <p className="mt-3 text-sm text-muted-foreground">
                  You haven&apos;t placed any orders yet.
                </p>

              </div>
            )}

            {/* Orders List */}

            {orderList &&
              orderList.length > 0 && (

              <ul className="mt-4 divide-y divide-border">

                {orderList.map((o) => (

                  <li
                    key={o.id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >

                    <div className="min-w-0">

                      <p className="truncate font-semibold">
                        Order #{o.id}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">

                        {new Date(
                          o.createdAt
                        ).toLocaleDateString()}

                        {" • "}

                        {o.status}

                      </p>

                    </div>

                    <span className="font-display text-lg font-bold sm:text-xl">
                      ${Number(o.total).toFixed(2)}
                    </span>

                  </li>
                ))}

              </ul>
            )}

          </section>

        </div>

      </div>

    </AppLayout>
  );
}

function SettingRow({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle: string;
}) {

  return (
    <button className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-accent">

      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">

        <Icon
          name={icon}
          className="text-[18px]"
        />

      </span>

      <div className="min-w-0 flex-1">

        <div className="text-sm font-semibold">
          {title}
        </div>

        <div className="truncate text-xs text-muted-foreground">
          {subtitle}
        </div>

      </div>

      <Icon
        name="chevron_right"
        className="text-[20px] text-muted-foreground shrink-0"
      />

    </button>
  );
}
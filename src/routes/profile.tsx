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
      { name: "description", content: "Manage your ShopSmart profile, settings, and order history." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [orderList, setOrderList] = useState<Order[] | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await ordersApi.list();
        if (!cancelled) setOrderList(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setOrderList([]);
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
      toast.error(err instanceof ApiError ? err.message : "Could not sign out");
    }
  };

  if (loading || !user) return null;

  const initial = user.username?.[0]?.toUpperCase() ?? "U";

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header card */}
        <section className="bg-card border border-border rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary text-primary-foreground grid place-items-center font-display font-bold text-3xl">
              {initial}
            </div>
            <button
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-card border border-border grid place-items-center text-muted-foreground hover:text-foreground"
              aria-label="Change photo"
            >
              <Icon name="photo_camera" className="text-[16px]" />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-2xl sm:text-3xl truncate">
              {user.username}
            </h1>
            <p className="text-muted-foreground truncate">{user.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(user.verified ?? user.enabled ?? true) ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  <Icon name="verified" className="text-[14px]" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold">
                  <Icon name="schedule" className="text-[14px]" />
                  Email not verified
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate({ to: "/products/manage" })}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-accent text-accent-foreground font-semibold hover:bg-primary/10"
          >
            <Icon name="edit" className="text-[16px]" />
            Edit Profile
          </button>
        </section>

        <div className="grid lg:grid-cols-[320px_1fr] gap-6">
          {/* Settings */}
          <aside className="bg-card border border-border rounded-2xl p-2">
            <SettingRow icon="local_shipping" title="Shipping Addresses" subtitle="Manage delivery locations" />
            <SettingRow icon="credit_card" title="Payment Methods" subtitle="Cards and digital wallets" />
            <SettingRow icon="notifications" title="Notifications" subtitle="Email and push alerts" />
            <SettingRow icon="shield_person" title="Security & Privacy" subtitle="Password and auth settings" />
            <button
              onClick={onLogout}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-destructive font-semibold hover:bg-destructive/10"
            >
              <Icon name="logout" className="text-[18px]" />
              Sign Out
            </button>
          </aside>

          {/* Orders */}
          <section className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-xl">Order History</h2>
              <Link to="/" className="text-sm text-primary font-semibold hover:underline">
                Continue shopping
              </Link>
            </div>

            {orderList === null && (
              <div className="mt-4 space-y-3">
                <div className="h-20 rounded-xl bg-secondary animate-pulse" />
                <div className="h-20 rounded-xl bg-secondary animate-pulse" />
              </div>
            )}

            {orderList && orderList.length === 0 && (
              <p className="mt-4 text-sm text-muted-foreground">
                You haven&apos;t placed any orders yet.
              </p>
            )}

            {orderList && orderList.length > 0 && (
              <ul className="mt-4 divide-y divide-border">
                {orderList.map((o) => (
                  <li key={o.id} className="py-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">Order #{o.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(o.createdAt).toLocaleDateString()} • {o.status}
                      </p>
                    </div>
                    <span className="font-display font-bold">${Number(o.total).toFixed(2)}</span>
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
    <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-accent text-left">
      <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
        <Icon name={icon} className="text-[18px]" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-xs text-muted-foreground truncate">{subtitle}</div>
      </div>
      <Icon name="chevron_right" className="text-muted-foreground text-[20px]" />
    </button>
  );
}

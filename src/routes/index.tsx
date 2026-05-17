import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "../components/AppLayout";
import { ProductCard } from "../components/ProductCard";
import { Icon } from "../components/Icon";
import { useAuth } from "../lib/auth-context";
import {
  products as productsApi,
  cart as cartApi,
  ApiError,
  type Product,
} from "../lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "ShopSmart — Premium tech and more, curated for you",
      },
      {
        name: "description",
        content:
          "Discover the latest premium tech gear and lifestyle products carefully curated for you on ShopSmart.",
      },
      {
        property: "og:title",
        content: "ShopSmart — Premium tech and more",
      },
      {
        property: "og:description",
        content:
          "Discover premium tech gear and lifestyle products carefully curated for you.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { user, loading } = useAuth();

  const navigate = useNavigate();

  const [items, setItems] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"new" | "best">("new");

  useEffect(() => {
    let cancelled = false;

    const q = query.trim();

    const handle = setTimeout(async () => {
      try {
        const page = q
          ? await productsApi.search(q, 0, 24)
          : await productsApi.list(0, 24);

        if (!cancelled) {
          setItems(page.content);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Could not load products."
          );
        }
      }
    }, q ? 300 : 0);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query]);

  const filtered = items;

  const onAdd = async (p: Product) => {
    if (!user) {
      toast.message("Sign in to add items to your cart.");

      navigate({ to: "/auth" });

      return;
    }

    try {
      await cartApi.add(Number(p.id), 1);

      toast.success(`Added "${p.title}" to cart`);
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Could not add to cart"
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground px-4 text-center">
        Loading...
      </div>
    );
  }

  return (
    <AppLayout
      showSearch
      searchValue={query}
      onSearchChange={setQuery}
    >
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-8">
        {/* Hero */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            {user ? (
              <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl leading-tight break-words">
                Welcome,{" "}
                <span className="text-primary">
                  {user.username}
                </span>
              </h1>
            ) : (
              <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl leading-tight">
                Discover{" "}
                <span className="text-primary">
                  premium
                </span>{" "}
                products
              </h1>
            )}

            <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
              Discover the latest premium tech gear carefully
              curated for you.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 border-b border-border min-w-max">
            {(["new", "best"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition whitespace-nowrap ${
                  tab === t
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "new"
                  ? "New Arrivals"
                  : "Bestsellers"}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="mt-6">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 mb-4">
              {error}
            </div>
          )}

          {/* Skeleton */}
          {filtered === null && !error && (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-2xl bg-secondary animate-pulse"
                />
              ))}
            </div>
          )}

          {/* Empty */}
          {filtered && filtered.length === 0 && (
            <div className="text-center py-16 px-4 border border-dashed border-border rounded-2xl">
              <Icon
                name="inventory_2"
                className="text-[40px] text-muted-foreground mx-auto"
              />

              <p className="mt-3 text-sm sm:text-base text-muted-foreground">
                {query
                  ? "No products match your search."
                  : "No products yet — add the first one!"}
              </p>
            </div>
          )}

          {/* Products */}
          {filtered && filtered.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {filtered.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAdd={onAdd}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </AppLayout>
  );
}
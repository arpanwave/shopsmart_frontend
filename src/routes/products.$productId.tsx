import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "../components/AppLayout";
import { Icon } from "../components/Icon";
import { useAuth } from "../lib/auth-context";
import {
  products as productsApi,
  cart as cartApi,
  ApiError,
  type Product,
} from "../lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/products/$productId")({
  head: () => ({
    meta: [
      { title: "Product details — ShopSmart" },
      { name: "description", content: "Explore product details, specs, and reviews on ShopSmart." },
    ],
  }),
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { productId } = useParams({ from: "/products/$productId" });
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await productsApi.get(productId);
        if (!cancelled) setProduct(p);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof ApiError ? err.message : "Could not load product.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const addToCart = async () => {
    if (!product) return;
    if (!user) {
      toast.message("Sign in to add items to your cart.");
      navigate({ to: "/auth" });
      return;
    }
    setAdding(true);
    try {
      await cartApi.add(Number(product.id), qty);
      toast.success(`Added ${qty} × “${product.title}” to cart`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not add to cart");
    } finally {
      setAdding(false);
    }
  };

  const buyNow = async () => {
    if (!user) {
      toast.message("Sign in to continue with your purchase.");
      navigate({ to: "/auth" });
      return;
    }
    await addToCart();
    navigate({ to: "/cart" });
  };

  const removeProduct = async () => {
    if (!product) return;
    if (!confirm(`Delete “${product.title}”?`)) return;
    try {
      await productsApi.remove(product.id);
      toast.success("Product deleted");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete product");
    }
  };

  if (loading) return null;

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">
            Home
          </Link>
          <Icon name="chevron_right" className="text-[16px]" />
          <span className="text-foreground line-clamp-1">{product?.title ?? "Product"}</span>
        </nav>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 mb-4">
            {error}
          </div>
        )}

        {!product && !error && (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="aspect-square rounded-2xl bg-secondary animate-pulse" />
            <div className="space-y-4">
              <div className="h-8 w-2/3 bg-secondary animate-pulse rounded" />
              <div className="h-6 w-1/3 bg-secondary animate-pulse rounded" />
              <div className="h-24 bg-secondary animate-pulse rounded" />
            </div>
          </div>
        )}

        {product && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Image */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="aspect-square bg-secondary">
                <img
                  src={productsApi.imageUrl(product.id)}
                  alt={product.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            </div>

            {/* Info */}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {product.category && (
                  <span className="px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold uppercase tracking-wide">
                    {product.category}
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  Free shipping
                </span>
              </div>
              <h1 className="font-display font-bold text-3xl sm:text-4xl mt-3">{product.title}</h1>

              <div className="mt-4 flex items-baseline gap-3">
                <span className="font-display font-bold text-3xl">
                  ${Number(product.price).toFixed(2)}
                </span>
                <span className="text-sm text-muted-foreground">Inclusive of all taxes.</span>
              </div>

              <p className="mt-6 text-muted-foreground leading-relaxed whitespace-pre-line">
                {product.description || "No description provided."}
              </p>

              {/* Stock */}
              {product.stock !== undefined && (
                <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary font-semibold">
                  <Icon name="check_circle" className="text-[18px]" />
                  {product.stock > 0 ? `In stock (${product.stock})` : "Out of stock"}
                </p>
              )}

              {/* Qty */}
              <div className="mt-6 flex items-center gap-3">
                <span className="text-sm font-semibold">Qty</span>
                <div className="inline-flex items-center bg-secondary rounded-full">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 grid place-items-center text-muted-foreground hover:text-foreground"
                    aria-label="Decrease"
                  >
                    <Icon name="remove" className="text-[18px]" />
                  </button>
                  <span className="w-8 text-center font-semibold">{qty}</span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="w-9 h-9 grid place-items-center text-muted-foreground hover:text-foreground"
                    aria-label="Increase"
                  >
                    <Icon name="add" className="text-[18px]" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={addToCart}
                  disabled={adding}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-60"
                >
                  <Icon name="shopping_cart" className="text-[18px]" />
                  {adding ? "Adding…" : "Add to Cart"}
                </button>
                <button
                  onClick={buyNow}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-accent text-accent-foreground font-semibold hover:bg-primary/10"
                >
                  Buy Now
                </button>
              </div>

              {/* Feature chips */}
              <div className="mt-8 grid grid-cols-2 gap-3">
                <Feature icon="local_shipping" title="Free Shipping" subtitle="On orders over $50" />
                <Feature
                  icon="verified"
                  title="Authentic Product"
                  subtitle="Quality guaranteed"
                />
              </div>

              {/* Admin controls */}
              {isAdmin && (
                <div className="mt-6 p-4 rounded-2xl bg-accent/40 border border-border">
                  <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground mb-2">
                    Admin actions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to="/products/manage"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90"
                    >
                      <Icon name="edit" className="text-[16px]" />
                      Edit in dashboard
                    </Link>
                    <button
                      onClick={removeProduct}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-destructive/10 text-destructive text-sm font-semibold hover:bg-destructive/20"
                    >
                      <Icon name="delete" className="text-[16px]" />
                      Delete product
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function Feature({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border">
      <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
        <Icon name={icon} className="text-[20px]" />
      </span>
      <div>
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </div>
    </div>
  );
}

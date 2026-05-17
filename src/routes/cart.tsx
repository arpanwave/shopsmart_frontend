import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "../components/AppLayout";
import { Icon } from "../components/Icon";
import { useAuth } from "../lib/auth-context";
import {
  cart as cartApi,
  orders as ordersApi,
  products as productsApi,
  ApiError,
  type CartItem,
  type CartResponse,
} from "../lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — ShopSmart" },
      {
        name: "description",
        content:
          "Review the items in your ShopSmart cart and place your order.",
      },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [cart, setCart] = useState<CartResponse | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth" });
    }
  }, [user, loading, navigate]);

  const refresh = async () => {
    try {
      const data = await cartApi.get();
      setCart(data);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not load cart."
      );
    }
  };

  useEffect(() => {
    if (user) {
      refresh();
    }
  }, [user]);

  const updateQty = async (
    it: CartItem,
    q: number
  ) => {
    if (q < 1) return;

    try {
      const updated =
        await cartApi.updateQty(
          it.cartItemId,
          q
        );

      setCart(updated);

    } catch (err) {

      toast.error(
        err instanceof ApiError
          ? err.message
          : "Could not update quantity"
      );
    }
  };

  const remove = async (
    it: CartItem
  ) => {

    try {

      const updated =
        await cartApi.remove(
          it.cartItemId
        );

      setCart(updated);

      toast.success("Item removed");

    } catch (err) {

      toast.error(
        err instanceof ApiError
          ? err.message
          : "Could not remove item"
      );
    }
  };

  const subtotal =
    cart?.totalPrice ?? 0;

  const tax =
    subtotal * 0.085;

  const total =
    subtotal + tax;

  const placeOrder = async () => {

    setPlacing(true);

    try {

      const order =
        await ordersApi.create();

      toast.success(
        `Order placed! #${order.id}`
      );

      setCart(null);

      navigate({ to: "/profile" });

    } catch (err) {

      toast.error(
        err instanceof ApiError
          ? err.message
          : "Could not place order"
      );

    } finally {

      setPlacing(false);
    }
  };

  if (loading || !user) {
    return null;
  }

  return (
    <AppLayout>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 sm:py-6">

        {/* Header */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="min-w-0">

            <h1 className="font-display font-bold text-2xl sm:text-3xl">
              Your Cart
            </h1>

            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              {cart
                ? `${cart.totalItems} item${cart.totalItems === 1 ? "" : "s"} in your cart`
                : "Loading…"}
            </p>

          </div>

          <Link
            to="/"
            className="inline-flex w-fit items-center text-sm font-semibold text-primary hover:underline"
          >
            Continue shopping
          </Link>

        </div>

        {/* Error */}

        {error && (
          <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Main Grid */}

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">

          {/* Cart Items */}

          <div className="space-y-4">

            {cart === null && !error && (
              <>
                <div className="h-28 rounded-2xl bg-secondary animate-pulse" />
                <div className="h-28 rounded-2xl bg-secondary animate-pulse" />
              </>
            )}

            {cart &&
              cart.items.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border py-16 text-center">

                <Icon
                  name="shopping_cart"
                  className="text-[40px] text-muted-foreground"
                />

                <p className="mt-2 text-muted-foreground">
                  Your cart is empty.
                </p>

                <Link
                  to="/"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                >
                  Browse products
                </Link>

              </div>
            )}

            {cart?.items?.map((it) => (

              <div
                key={it.cartItemId}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-3 sm:flex-row sm:items-start sm:p-4"
              >

                {/* Product Image */}

                <div className="h-24 w-full overflow-hidden rounded-xl bg-secondary sm:h-24 sm:w-24 md:h-28 md:w-28 shrink-0">

                  <img
                    src={productsApi.imageUrl(
                      it.productId
                    )}
                    alt={it.productName}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (
                        e.currentTarget as HTMLImageElement
                      ).style.display = "none";
                    }}
                  />

                </div>

                {/* Product Info */}

                <div className="flex min-w-0 flex-1 flex-col">

                  <Link
                    to="/products/$productId"
                    params={{
                      productId: String(
                        it.productId
                      ),
                    }}
                    className="line-clamp-2 font-display text-base font-semibold hover:text-primary sm:text-lg"
                  >
                    {it.productName}
                  </Link>

                  <span className="mt-2 text-lg font-bold">
                    ${Number(it.price).toFixed(2)}
                  </span>

                  {/* Controls */}

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                    {/* Quantity */}

                    <div className="inline-flex w-fit items-center rounded-full bg-secondary">

                      <button
                        onClick={() =>
                          updateQty(
                            it,
                            it.quantity - 1
                          )
                        }
                        className="grid h-9 w-9 place-items-center text-muted-foreground transition hover:text-foreground"
                        aria-label="Decrease"
                      >
                        <Icon
                          name="remove"
                          className="text-[16px]"
                        />
                      </button>

                      <span className="w-10 text-center text-sm font-semibold">
                        {it.quantity}
                      </span>

                      <button
                        onClick={() =>
                          updateQty(
                            it,
                            it.quantity + 1
                          )
                        }
                        className="grid h-9 w-9 place-items-center text-muted-foreground transition hover:text-foreground"
                        aria-label="Increase"
                      >
                        <Icon
                          name="add"
                          className="text-[16px]"
                        />
                      </button>

                    </div>

                    {/* Remove */}

                    <button
                      onClick={() => remove(it)}
                      className="inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-2 text-sm text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Remove"
                    >

                      <Icon
                        name="delete"
                        className="text-[18px]"
                      />

                      Remove

                    </button>

                  </div>

                </div>

              </div>
            ))}

          </div>

          {/* Summary */}

          <aside className="h-fit rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-20">

            <h2 className="font-display text-xl font-bold">
              Order Summary
            </h2>

            <dl className="mt-5 space-y-3 text-sm">

              <Row
                label="Subtotal"
                value={`$${subtotal.toFixed(2)}`}
              />

              <Row
                label="Shipping"
                value="Calculated at checkout"
                muted
              />

              <Row
                label="Tax estimate"
                value={`$${tax.toFixed(2)}`}
              />

            </dl>

            <div className="mt-5 flex items-baseline justify-between border-t border-border pt-5">

              <span className="font-display text-base font-semibold">
                Total
              </span>

              <span className="font-display text-2xl font-bold sm:text-3xl">
                ${total.toFixed(2)}
              </span>

            </div>

            <button
              onClick={placeOrder}
              disabled={
                placing ||
                !cart ||
                cart.items.length === 0
              }
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50 sm:text-base"
            >

              {placing
                ? "Placing order…"
                : "Initiate Order"}

              <Icon
                name="arrow_forward"
                className="text-[18px]"
              />

            </button>

            <p className="mt-3 inline-flex w-full items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">

              <Icon
                name="lock"
                className="text-[14px]"
              />

              Secure checkout guarantee

            </p>

          </aside>

        </div>

      </div>

    </AppLayout>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {

  return (
    <div className="flex items-start justify-between gap-3">

      <dt className="text-muted-foreground">
        {label}
      </dt>

      <dd
        className={
          muted
            ? "text-right text-muted-foreground"
            : "text-right font-semibold"
        }
      >
        {value}
      </dd>

    </div>
  );
}
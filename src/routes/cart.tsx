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
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6">

        <div className="flex items-baseline justify-between gap-4">

          <div>

            <h1 className="font-display font-bold text-3xl">
              Your Cart
            </h1>

            <p className="text-muted-foreground mt-1">
              {cart
                ? `${cart.totalItems} item${cart.totalItems === 1 ? "" : "s"} in your cart`
                : "Loading…"}
            </p>

          </div>

          <Link
            to="/"
            className="text-sm text-primary font-semibold hover:underline"
          >
            Continue shopping
          </Link>

        </div>

        {error && (
          <div className="mt-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="mt-6 grid lg:grid-cols-[1fr_360px] gap-6">

          {/* Items */}

          <div className="space-y-3">

            {cart === null && !error && (
              <>
                <div className="h-28 bg-secondary rounded-2xl animate-pulse" />
                <div className="h-28 bg-secondary rounded-2xl animate-pulse" />
              </>
            )}

            {cart &&
              cart.items.length === 0 && (
              <div className="text-center py-16 border border-dashed border-border rounded-2xl">

                <Icon
                  name="shopping_cart"
                  className="text-[40px] text-muted-foreground"
                />

                <p className="mt-2 text-muted-foreground">
                  Your cart is empty.
                </p>

                <Link
                  to="/"
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold"
                >
                  Browse products
                </Link>

              </div>
            )}

            {cart?.items?.map((it) => (

              <div
                key={it.cartItemId}
                className="bg-card border border-border rounded-2xl p-3 sm:p-4 flex gap-3 sm:gap-4"
              >

                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-secondary overflow-hidden shrink-0">

                  <img
                    src={productsApi.imageUrl(
                      it.productId
                    )}
                    alt={it.productName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (
                        e.currentTarget as HTMLImageElement
                      ).style.display = "none";
                    }}
                  />

                </div>

                <div className="flex-1 min-w-0 flex flex-col">

                  <Link
                    to="/products/$productId"
                    params={{
                      productId: String(
                        it.productId
                      ),
                    }}
                    className="font-display font-semibold line-clamp-1 hover:text-primary"
                  >
                    {it.productName}
                  </Link>

                  <span className="font-semibold mt-1">
                    ${Number(it.price).toFixed(2)}
                  </span>

                  <div className="mt-auto flex items-center justify-between">

                    <div className="inline-flex items-center bg-secondary rounded-full">

                      <button
                        onClick={() =>
                          updateQty(
                            it,
                            it.quantity - 1
                          )
                        }
                        className="w-8 h-8 grid place-items-center text-muted-foreground hover:text-foreground"
                        aria-label="Decrease"
                      >
                        <Icon
                          name="remove"
                          className="text-[16px]"
                        />
                      </button>

                      <span className="w-8 text-center font-semibold text-sm">
                        {it.quantity}
                      </span>

                      <button
                        onClick={() =>
                          updateQty(
                            it,
                            it.quantity + 1
                          )
                        }
                        className="w-8 h-8 grid place-items-center text-muted-foreground hover:text-foreground"
                        aria-label="Increase"
                      >
                        <Icon
                          name="add"
                          className="text-[16px]"
                        />
                      </button>

                    </div>

                    <button
                      onClick={() => remove(it)}
                      className="w-9 h-9 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 grid place-items-center"
                      aria-label="Remove"
                    >
                      <Icon
                        name="delete"
                        className="text-[18px]"
                      />
                    </button>

                  </div>

                </div>

              </div>
            ))}

          </div>

          {/* Summary */}

          <aside className="lg:sticky lg:top-20 h-fit bg-card border border-border rounded-2xl p-5">

            <h2 className="font-display font-bold text-xl">
              Order Summary
            </h2>

            <dl className="mt-4 space-y-2 text-sm">

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

            <div className="border-t border-border mt-4 pt-4 flex items-baseline justify-between">

              <span className="font-display font-semibold">
                Total
              </span>

              <span className="font-display font-bold text-2xl">
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
              className="mt-5 w-full py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >

              {placing
                ? "Placing order…"
                : "Initiate Order"}

              <Icon
                name="arrow_forward"
                className="text-[18px]"
              />

            </button>

            <p className="mt-3 text-xs text-muted-foreground inline-flex items-center gap-1.5 justify-center w-full">

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
    <div className="flex items-center justify-between">

      <dt className="text-muted-foreground">
        {label}
      </dt>

      <dd
        className={
          muted
            ? "text-muted-foreground"
            : "font-semibold"
        }
      >
        {value}
      </dd>

    </div>
  );
}
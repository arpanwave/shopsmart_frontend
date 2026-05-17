import { Link } from "@tanstack/react-router";

import { Icon } from "./Icon";

import {
  products as productsApi,
  type Product,
} from "../lib/api";

type Props = {
  product: Product;

  onAdd?: (
    p: Product
  ) => void;

  featured?: boolean;
};

export function ProductCard({
  product,
  onAdd,
  featured,
}: Props) {

  return (

    <div
      className={`group bg-card rounded-2xl border border-border overflow-hidden flex flex-col hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 ${
        featured
          ? "sm:col-span-2 lg:col-span-2"
          : ""
      }`}
    >

      {/* IMAGE */}

      <Link
        to="/products/$productId"
        params={{
          productId: String(
            product.id
          ),
        }}
        className="relative block aspect-square bg-secondary overflow-hidden"
      >

        <img
          src={productsApi.imageUrl(
            product.id
          )}
          alt={product.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          onError={(e) => {

            (
              e.currentTarget as HTMLImageElement
            ).style.display = "none";
          }}
        />

      </Link>

      {/* CONTENT */}

      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">

        {/* CATEGORY */}

        {product.category && (

          <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground font-semibold line-clamp-1">

            {product.category}

          </span>
        )}

        {/* TITLE */}

        <Link
          to="/products/$productId"
          params={{
            productId: String(
              product.id
            ),
          }}
          className="font-display font-semibold text-sm sm:text-base text-foreground line-clamp-2 hover:text-primary transition leading-snug min-h-[2.5rem] sm:min-h-[3rem]"
        >

          {product.title}

        </Link>

        {/* PRICE + BUTTON */}

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">

          <span className="font-display font-bold text-base sm:text-lg truncate">

            $
            {Number(
              product.price
            ).toFixed(2)}

          </span>

          <button
            onClick={() =>
              onAdd?.(product)
            }
            className="shrink-0 w-10 h-10 sm:w-9 sm:h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 active:scale-95 transition"
            aria-label="Add to cart"
          >

            <Icon
              name="add_shopping_cart"
              className="text-[18px]"
            />

          </button>

        </div>

      </div>

    </div>
  );
}
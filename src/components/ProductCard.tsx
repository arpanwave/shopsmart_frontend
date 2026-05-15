import { Link } from "@tanstack/react-router";
import { Icon } from "./Icon";
import { products as productsApi, type Product } from "../lib/api";

type Props = {
  product: Product;
  onAdd?: (p: Product) => void;
  featured?: boolean;
};

export function ProductCard({ product, onAdd, featured }: Props) {
  return (
    <div
      className={`group bg-card rounded-2xl border border-border overflow-hidden flex flex-col hover:shadow-md transition ${
        featured ? "sm:col-span-2 lg:col-span-2" : ""
      }`}
    >
      <Link
        to="/products/$productId"
        params={{ productId: String(product.id) }}
        className="relative block aspect-square bg-secondary overflow-hidden"
      >
        <img
          src={productsApi.imageUrl(product.id)}
          alt={product.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      </Link>
      <div className="p-4 flex flex-col flex-1 gap-2">
        {product.category && (
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
            {product.category}
          </span>
        )}
        <Link
          to="/products/$productId"
          params={{ productId: String(product.id) }}
          className="font-display font-semibold text-foreground line-clamp-2 hover:text-primary transition"
        >
          {product.title}
        </Link>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-display font-bold text-lg">${Number(product.price).toFixed(2)}</span>
          <button
            onClick={() => onAdd?.(product)}
            className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition"
            aria-label="Add to cart"
          >
            <Icon name="add_shopping_cart" className="text-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
}

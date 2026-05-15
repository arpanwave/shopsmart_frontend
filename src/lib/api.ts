/**
 * Barrel re-export. The implementation lives in src/lib/api/* — split for
 * clarity. Existing imports like `import { auth, products } from "@/lib/api"`
 * continue to work unchanged.
 */

export { API_BASE, ApiError, api, session } from "./api/client";

export { auth } from "./api/auth";

export {
  products,
  normalizeProduct,
  type ProductInput,
} from "./api/products";

export { admin } from "./api/admin";

export { cart, orders } from "./api/cart";

export type {
  BackendProduct,
  CartItem,
  CartResponse,
  Order,
  Page,
  Product,
  Role,
  User,
} from "./api/types";
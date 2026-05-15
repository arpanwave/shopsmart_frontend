/* ---------------- Domain types ---------------- */

export type Role = "ROLE_USER" | "ROLE_ADMIN" | string;

export type User = {
  id: string | number;
  username: string;
  email: string;
  role?: Role;
  enabled?: boolean;
  /** Legacy aliases kept so existing UI compiles. */
  verified?: boolean;
  avatar?: string | null;
};

/** Backend product shape (Spring) — see API docs. */
export type BackendProduct = {
  prodId: number | string;
  name: string;
  description?: string;
  brand?: string;
  category?: string;
  price: number;
  stockQuantity?: number;
  productAvailable?: boolean;
  releaseDate?: string;
  imageUrl?: string;
  ownerId?: string | number;
  ownerUsername?: string;
  ownerEmail?: string;
  userId?: string | number;
  user_id?: string | number;
  user?: { id?: string | number };
};

/**
 * Normalized Product used throughout the UI. Carries both the canonical
 * backend names AND short aliases (`id`, `title`, `stock`) so existing
 * components keep working without rewrites.
 */
export type Product = {
  // canonical (backend)
  prodId: number | string;
  name: string;
  description?: string;
  brand?: string;
  category?: string;
  price: number;
  stockQuantity?: number;
  productAvailable?: boolean;
  releaseDate?: string;
  ownerId?: string | number;
  ownerUsername?: string;
  ownerEmail?: string;

  // aliases (UI convenience)
  id: number | string;
  title: string;
  stock?: number;
};

/** Spring `Page<T>` shape. */
export type Page<T> = {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
};

/* ---------------- Cart ---------------- */

export type CartItem = {

  cartItemId: number;

  productId: number;

  productName: string;

  price: number;

  quantity: number;

  subtotal: number;

  imageName?: string;
};

export type CartResponse = {

  cartId: number;

  items: CartItem[];

  totalPrice: number;

  totalItems: number;
};

/* ---------------- Orders ---------------- */

export type Order = {

  id: string | number;

  total: number;

  status: string;

  createdAt: string;

  items?: Array<{
    productId: string | number;
    quantity: number;
    price: number;
    title?: string;
  }>;
};
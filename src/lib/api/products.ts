import { api, API_BASE } from "./client";
import type { BackendProduct, Page, Product } from "./types";

/** Map a backend product into the UI-friendly shape (with alias fields). */
export function normalizeProduct(p: BackendProduct): Product {
  const ownerId = p.ownerId ?? p.userId ?? p.user_id ?? p.user?.id;
  return {
    prodId: p.prodId,
    name: p.name,
    description: p.description,
    brand: p.brand,
    category: p.category,
    price: p.price,
    stockQuantity: p.stockQuantity,
    productAvailable: p.productAvailable,
    releaseDate: p.releaseDate,
    ownerId,
    ownerUsername: p.ownerUsername,
    ownerEmail: p.ownerEmail,
    // aliases
    id: p.prodId,
    title: p.name,
    stock: p.stockQuantity,
  };
}

function normalizePage(page: Page<BackendProduct>): Page<Product> {
  return { ...page, content: page.content.map(normalizeProduct) };
}

export type ProductInput = {
  name?: string;
  /** Alias for `name`, accepted for backwards compat with old UI code. */
  title?: string;
  description?: string;
  brand?: string;
  category?: string;
  price?: number;
  stockQuantity?: number;
  /** Alias for `stockQuantity`. */
  stock?: number;
  productAvailable?: boolean;
  releaseDate?: string;
  image?: File | null;
};

function buildProductFormData(input: ProductInput, requireAll: boolean): FormData {
  const fd = new FormData();
  const name = input.name ?? input.title;
  const stockQuantity = input.stockQuantity ?? input.stock;

  const append = (k: string, v: string | undefined | null) => {
    if (v !== undefined && v !== null && v !== "") fd.append(k, v);
  };

  append("name", name);
  append("description", input.description);
  append("brand", input.brand);
  append("category", input.category);
  if (input.price !== undefined) fd.append("price", String(input.price));
  if (stockQuantity !== undefined) fd.append("stockQuantity", String(stockQuantity));
  if (input.productAvailable !== undefined)
    fd.append("productAvailable", String(input.productAvailable));
  append("releaseDate", input.releaseDate);
  if (input.image) fd.append("image", input.image);

  if (requireAll) {
    if (!name) throw new Error("Product name is required");
    if (input.price === undefined) throw new Error("Product price is required");
  }
  return fd;
}

export const products = {
  list: async (page = 0, size = 20): Promise<Page<Product>> => {
    const res = await api.get<Page<BackendProduct>>(
      `/api/products?page=${page}&size=${size}`,
      { auth: false },
    );
    return normalizePage(res);
  },

  adminList: async (page = 0, size = 100): Promise<Page<Product>> => {
    const res = await api.get<Page<BackendProduct>>(
      `/api/admin/products?page=${page}&size=${size}`,
    );
    return normalizePage(res);
  },

  search: async (keyword: string, page = 0, size = 20): Promise<Page<Product>> => {
    const res = await api.get<Page<BackendProduct>>(
      `/api/products/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`,
      { auth: false },
    );
    return normalizePage(res);
  },

  get: async (id: string | number): Promise<Product> => {
    const res = await api.get<BackendProduct>(`/api/products/${id}`, { auth: false });
    return normalizeProduct(res);
  },

  remove: (id: string | number) => api.delete<unknown>(`/api/products/${id}`),

  imageUrl: (id: string | number) => `${API_BASE}/api/products/${id}/image`,

  create: async (input: ProductInput): Promise<Product> => {
    const fd = buildProductFormData(input, true);
    const res = await api.post<BackendProduct>("/api/products", fd);
    return normalizeProduct(res);
  },

  update: async (id: string | number, input: ProductInput): Promise<Product> => {
    const fd = buildProductFormData(input, false);
    const res = await api.put<BackendProduct>(`/api/products/${id}`, fd);
    return normalizeProduct(res);
  },
};

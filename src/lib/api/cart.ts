/**
 * Real backend Cart & Orders API
 */

import { api } from "./client";

import type {
  CartResponse,
  Order,
} from "./types";

/* -------------------------------------------------- */
/* Cart */
/* -------------------------------------------------- */

export const cart = {

  // Get current user's cart
  get: () =>
    api.get<CartResponse>(
      "/api/cart"
    ),

  // Add product to cart
  add: (
    productId: number,
    quantity = 1
  ) =>
    api.post<CartResponse>(
      "/api/cart/add",
      {
        productId,
        quantity,
      }
    ),

  // Update quantity
  updateQty: (
    cartItemId: number,
    quantity: number
  ) =>
    api.put<CartResponse>(
      `/api/cart/item/${cartItemId}`,
      {
        quantity,
      }
    ),

  // Remove item
  remove: (
    cartItemId: number
  ) =>
    api.delete<CartResponse>(
      `/api/cart/item/${cartItemId}`
    ),

  // Clear cart
  clear: () =>
    api.delete<void>(
      "/api/cart/clear"
    ),
};

/* -------------------------------------------------- */
/* Orders */
/* -------------------------------------------------- */

export const orders = {

  /**
   * Placeholder until backend
   * /api/orders exists.
   */

  create: async (): Promise<Order> => {

    const cartData =
      await cart.get();

    const order: Order = {

      id: `temp-${Date.now()}`,

      total:
        cartData.totalPrice,

      status: "PENDING",

      createdAt:
        new Date().toISOString(),

      items:
        cartData.items.map(
          (item) => ({
            productId:
              item.productId,

            quantity:
              item.quantity,

            price:
              item.price,

            title:
              item.productName,
          })
        ),
    };

    // Clear cart after order
    await cart.clear();

    return order;
  },

  list: async (): Promise<Order[]> => {
    return [];
  },

  get: async (
    _id: string | number
  ): Promise<Order> => {

    throw new Error(
      "Orders backend not implemented yet."
    );
  },
};
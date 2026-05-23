"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/lib/types";

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  add: (item: CartItem) => void;
  remove: (productId: string, size: string) => void;
  setQuantity: (productId: string, size: string, quantity: number) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
  // Merge a set of items (e.g. a DB cart loaded after login) into the local cart.
  merge: (incoming: CartItem[]) => void;
};

const sameLine = (a: CartItem, productId: string, size: string) =>
  a.productId === productId && a.size === size;

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,

      add: (item) =>
        set((state) => {
          const existing = state.items.find((i) =>
            sameLine(i, item.productId, item.size)
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                sameLine(i, item.productId, item.size)
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
              isOpen: true,
            };
          }
          return { items: [...state.items, item], isOpen: true };
        }),

      remove: (productId, size) =>
        set((state) => ({
          items: state.items.filter((i) => !sameLine(i, productId, size)),
        })),

      setQuantity: (productId, size, quantity) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              sameLine(i, productId, size)
                ? { ...i, quantity: Math.max(1, quantity) }
                : i
            )
            .filter((i) => i.quantity > 0),
        })),

      clear: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      merge: (incoming) =>
        set((state) => {
          const map = new Map<string, CartItem>();
          for (const i of [...incoming, ...state.items]) {
            const key = `${i.productId}::${i.size}`;
            const found = map.get(key);
            map.set(
              key,
              found ? { ...found, quantity: found.quantity + i.quantity } : { ...i }
            );
          }
          return { items: Array.from(map.values()) };
        }),
    }),
    { name: "kickd-cart" }
  )
);

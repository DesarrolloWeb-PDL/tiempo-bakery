'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, CartState } from '@/types/cart';

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (newItem) => {
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.productId === newItem.productId
          );

          if (existingItem) {
            // Si ya existe, aumentar cantidad (respetando stock máximo)
            return {
              items: state.items.map((item) =>
                item.productId === newItem.productId
                  ? {
                      ...item,
                      quantity: Math.min(
                        item.quantity + 1,
                        item.maxStock
                      ),
                    }
                  : item
              ),
            };
          }

          // Si no existe, agregarlo
          return {
            items: [...state.items, { ...newItem, quantity: 1 }],
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId
              ? {
                  ...item,
                  quantity: Math.min(quantity, item.maxStock),
                }
              : item
          ),
        }));
      },

      updateSliced: (productId, sliced) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId
              ? { ...item, sliced }
              : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }));
      },

      openCart: () => {
        set({ isOpen: true });
      },

      closeCart: () => {
        set({ isOpen: false });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },
    }),
    {
      name: 'tiempo-bakery-cart',
      // Solo persistir los items, no el estado de apertura
      partialize: (state) => ({ items: state.items }),
    }
  )
);

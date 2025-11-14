/**
 * Shopping Cart Store
 * Manages hotel booking cart state with Zustand
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LiteAPIRate } from '@/lib/liteapi/types';

export interface CartItem {
  id: string; // Unique cart item ID
  hotel: {
    id: string;
    name: string;
    address: string;
    image: string;
    reviewScore?: number;
  };
  room: {
    name: string;
    rateId: string;
    rate: LiteAPIRate;
  };
  booking: {
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
    nights: number;
  };
  pricing: {
    total: number;
    perNight: number;
    currency: string;
  };
  addedAt: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id' | 'addedAt'>) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => {
        set((state) => ({
          items: [
            ...state.items,
            {
              ...item,
              id: `${item.hotel.id}-${item.room.rateId}-${Date.now()}`,
              addedAt: new Date().toISOString(),
            },
          ],
        }));
      },
      
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },
      
      clearCart: () => {
        set({ items: [] });
      },
      
      getTotalPrice: () => {
        const state = get();
        return state.items.reduce((total, item) => total + item.pricing.total, 0);
      },
      
      getTotalItems: () => {
        const state = get();
        return state.items.length;
      },
    }),
    {
      name: 'telluride-cart-storage',
    }
  )
);


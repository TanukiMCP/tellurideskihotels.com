/**
 * Cart Icon Component
 * Displays shopping cart icon with item count badge
 */

import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';

export function CartIcon() {
  const totalItems = useCartStore((state) => state.getTotalItems());

  return (
    <a
      href="/cart"
      className="relative p-2 text-neutral-700 hover:text-primary-600 transition-colors"
      aria-label={`Shopping cart with ${totalItems} items`}
    >
      <ShoppingCart className="w-6 h-6" />
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {totalItems > 9 ? '9+' : totalItems}
        </span>
      )}
    </a>
  );
}


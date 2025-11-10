/**
 * Add to Cart Button
 * Allows users to add hotel rooms to their booking cart
 */

import { useState } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import { useCartStore, type CartItem } from '@/stores/cartStore';

interface AddToCartButtonProps {
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
    rate: any; // LiteAPIRate
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
  className?: string;
}

export function AddToCartButton({
  hotel,
  room,
  booking,
  pricing,
  className = '',
}: AddToCartButtonProps) {
  const [isAdded, setIsAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    addItem({
      hotel,
      room,
      booking,
      pricing,
    });
    
    setIsAdded(true);
    
    // Reset after 3 seconds
    setTimeout(() => {
      setIsAdded(false);
    }, 3000);
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={isAdded}
      className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
        isAdded
          ? 'bg-green-600 text-white cursor-not-allowed'
          : 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-card'
      } ${className}`}
    >
      {isAdded ? (
        <>
          <Check className="w-5 h-5" />
          Added to Cart
        </>
      ) : (
        <>
          <ShoppingCart className="w-5 h-5" />
          Add to Cart
        </>
      )}
    </button>
  );
}


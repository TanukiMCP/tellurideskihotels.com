/**
 * Cart View Component
 * Displays cart items and allows users to manage their bookings
 */

import { useCartStore } from '@/stores/cartStore';
import { Trash2, ShoppingBag, ArrowRight, Calendar, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export function CartView() {
  const { items, removeItem, clearCart, getTotalPrice } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 lg:p-16 text-center shadow-card">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-neutral-100 mb-6">
          <ShoppingBag className="w-12 h-12 text-neutral-400" />
        </div>
        <h2 className="text-3xl font-bold text-neutral-900 mb-4">Your cart is empty</h2>
        <p className="text-lg text-neutral-600 mb-8 max-w-md mx-auto">
          Start exploring our collection of exceptional Telluride accommodations
        </p>
        <a
          href="/places-to-stay"
          className="inline-flex items-center gap-3 bg-primary-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-card hover:shadow-card-hover hover:bg-primary-700 transition-all duration-300"
        >
          Browse Hotels
          <ArrowRight className="w-5 h-5" />
        </a>
      </div>
    );
  }

  const totalPrice = getTotalPrice();
  const currency = items[0]?.pricing.currency || 'USD';

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Cart Items */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-neutral-900">
            {items.length} {items.length === 1 ? 'Item' : 'Items'}
          </h2>
          <button
            onClick={clearCart}
            className="text-sm text-red-600 hover:text-red-700 font-semibold transition-colors"
          >
            Clear All
          </button>
        </div>

        {/* Cart Items List */}
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow duration-300"
          >
            <div className="flex flex-col sm:flex-row">
              {/* Image */}
              <div className="sm:w-48 h-48 flex-shrink-0 bg-neutral-100">
                <img
                  src={item.hotel.image}
                  alt={item.hotel.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Content */}
              <div className="flex-grow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900 mb-1">
                      {item.hotel.name}
                    </h3>
                    <p className="text-sm text-neutral-600">{item.hotel.address}</p>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Room Details */}
                <div className="mb-4">
                  <p className="font-semibold text-neutral-900 mb-2">{item.room.name}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {format(parseISO(item.booking.checkIn), 'MMM d')} - {format(parseISO(item.booking.checkOut), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>
                        {item.booking.adults} {item.booking.adults === 1 ? 'Adult' : 'Adults'}
                        {item.booking.children > 0 && `, ${item.booking.children} ${item.booking.children === 1 ? 'Child' : 'Children'}`}
                      </span>
                    </div>
                    <span className="text-neutral-500">•</span>
                    <span>{item.booking.nights} {item.booking.nights === 1 ? 'Night' : 'Nights'}</span>
                  </div>
                </div>

                {/* Pricing */}
                <div className="flex items-baseline justify-between pt-4 border-t border-neutral-200">
                  <span className="text-sm text-neutral-600">
                    {currency} {item.pricing.perNight.toFixed(2)} per night
                  </span>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary-600">
                      {currency} {item.pricing.total.toFixed(2)}
                    </p>
                    <p className="text-xs text-neutral-600">Total price</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Sidebar */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl p-8 shadow-card sticky top-24">
          <h3 className="text-2xl font-bold text-neutral-900 mb-6">Order Summary</h3>
          
          <div className="space-y-4 mb-6">
            <div className="flex justify-between text-neutral-700">
              <span>Subtotal</span>
              <span className="font-semibold">{currency} {totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-neutral-700">
              <span>Taxes & Fees</span>
              <span className="font-semibold">Calculated at checkout</span>
            </div>
          </div>

          <div className="pt-6 border-t border-neutral-200 mb-6">
            <div className="flex justify-between items-baseline">
              <span className="text-lg font-semibold text-neutral-900">Total</span>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary-600">
                  {currency} {totalPrice.toFixed(2)}
                </p>
                <p className="text-xs text-neutral-600">Before taxes & fees</p>
              </div>
            </div>
          </div>

          <button className="w-full bg-primary-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-card hover:shadow-card-hover hover:bg-primary-700 transition-all duration-300 flex items-center justify-center gap-3">
            Proceed to Checkout
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-xs text-neutral-600 text-center mt-4">
            You'll review your booking details before finalizing
          </p>
        </div>
      </div>
    </div>
  );
}


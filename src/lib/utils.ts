import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function calculateNights(checkIn: Date | string, checkOut: Date | string): number {
  const start = typeof checkIn === 'string' ? new Date(checkIn) : checkIn;
  const end = typeof checkOut === 'string' ? new Date(checkOut) : checkOut;
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Apply markup to a base price
 * @param price Base price from supplier
 * @param markupPercent Markup percentage (default 15%)
 * @returns Price with markup applied
 */
export function applyMarkup(price: number, markupPercent: number = 15): number {
  return price * (1 + markupPercent / 100);
}

/**
 * Calculate net profit after Stripe fees
 * Stripe charges 2.9% + $0.30 per transaction
 * @param totalPrice Total price charged to customer
 * @returns Net amount after Stripe fees
 */
export function calculateNetAfterStripeFees(totalPrice: number): number {
  // Stripe fee: 2.9% + $0.30
  const stripeFee = (totalPrice * 0.029) + 0.30;
  return totalPrice - stripeFee;
}

/**
 * Calculate actual profit margin after all fees
 * @param customerPrice Price charged to customer (with markup)
 * @param supplierCost Cost from supplier (before markup)
 * @returns Profit margin details
 */
export function calculateProfitMargin(customerPrice: number, supplierCost: number) {
  const netAfterStripe = calculateNetAfterStripeFees(customerPrice);
  const profit = netAfterStripe - supplierCost;
  const profitMarginPercent = (profit / supplierCost) * 100;
  
  return {
    customerPrice,
    supplierCost,
    stripeFees: customerPrice - netAfterStripe,
    netRevenue: netAfterStripe,
    profit,
    profitMarginPercent,
  };
}


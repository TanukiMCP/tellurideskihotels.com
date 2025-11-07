import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}
function formatCurrency(amount, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
}
function calculateNights(checkIn, checkOut) {
  const start = typeof checkIn === "string" ? new Date(checkIn) : checkIn;
  const end = typeof checkOut === "string" ? new Date(checkOut) : checkOut;
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
}
function calculateNetAfterStripeFees(totalPrice) {
  const stripeFee = totalPrice * 0.029 + 0.3;
  return totalPrice - stripeFee;
}

export { calculateNights as a, cn as b, calculateNetAfterStripeFees as c, formatCurrency as f };

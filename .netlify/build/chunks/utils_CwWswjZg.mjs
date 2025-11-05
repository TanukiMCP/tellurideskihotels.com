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
function applyMarkup(price, markupPercent = 15) {
  return price * (1 + markupPercent / 100);
}

export { cn as a, applyMarkup as b, calculateNights as c, formatCurrency as f };

import { jsx } from 'react/jsx-runtime';
import { b as cn } from './utils_Brf6JqFr.mjs';

function Badge({ children, variant = "default", className }) {
  const variants = {
    default: "bg-primary-600 text-white",
    secondary: "bg-neutral-200 text-neutral-800",
    destructive: "bg-red-500 text-white",
    outline: "border border-neutral-300 text-neutral-700 bg-white"
  };
  return /* @__PURE__ */ jsx(
    "span",
    {
      className: cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variants[variant],
        className
      ),
      children
    }
  );
}

function getHotelMainImage(hotel) {
  const mainImage = hotel.images?.find(
    (img) => (img.type === "main" || img.type === "featured") && img.url && img.url.trim() !== ""
  );
  if (mainImage?.url) {
    return mainImage.url;
  }
  const firstImage = hotel.images?.find((img) => img.url && img.url.trim() !== "");
  return firstImage?.url || null;
}
function getHotelImages(hotel) {
  if (!hotel.images || hotel.images.length === 0) {
    return [];
  }
  return hotel.images.map((img) => img.url).filter((url) => typeof url === "string" && url.trim() !== "");
}
function formatHotelAddress(hotel) {
  const addr = hotel.address;
  if (!addr) return "";
  const parts = [];
  if (addr.line1) parts.push(addr.line1);
  if (addr.city) parts.push(addr.city);
  if (addr.state) parts.push(addr.state);
  if (addr.postal_code) parts.push(addr.postal_code);
  return parts.join(", ");
}

export { Badge as B, getHotelMainImage as a, formatHotelAddress as f, getHotelImages as g };

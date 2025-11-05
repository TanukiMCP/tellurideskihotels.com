import { jsx, jsxs } from 'react/jsx-runtime';
import { a as cn } from './utils_CwWswjZg.mjs';
import { useState } from 'react';

function Badge({ children, variant = "default", className }) {
  const variants = {
    default: "bg-turquoise-500 text-white",
    secondary: "bg-gray-200 text-gray-800",
    destructive: "bg-red-500 text-white",
    outline: "border border-gray-300 text-gray-700 bg-white"
  };
  return /* @__PURE__ */ jsx(
    "span",
    {
      className: cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      ),
      children
    }
  );
}

function LoadingSpinner({ size = "md" }) {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };
  return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center", children: /* @__PURE__ */ jsxs(
    "svg",
    {
      className: `animate-spin ${sizes[size]} text-turquoise-500`,
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      children: [
        /* @__PURE__ */ jsx(
          "circle",
          {
            className: "opacity-25",
            cx: "12",
            cy: "12",
            r: "10",
            stroke: "currentColor",
            strokeWidth: "4"
          }
        ),
        /* @__PURE__ */ jsx(
          "path",
          {
            className: "opacity-75",
            fill: "currentColor",
            d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          }
        )
      ]
    }
  ) });
}

function ImageWithLoading({ src, alt, className, onError }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const handleLoad = () => {
    setLoading(false);
  };
  const handleError = () => {
    setLoading(false);
    setError(true);
    onError?.();
  };
  if (error) {
    return /* @__PURE__ */ jsx("div", { className: `flex items-center justify-center bg-gray-200 ${className}`, children: /* @__PURE__ */ jsx("span", { className: "text-gray-400 text-sm", children: "Image not available" }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: `relative ${className}`, children: [
    loading && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-gray-100", children: /* @__PURE__ */ jsx(LoadingSpinner, { size: "sm" }) }),
    /* @__PURE__ */ jsx(
      "img",
      {
        src,
        alt,
        className: `${className} ${loading ? "opacity-0" : "opacity-100"} transition-opacity`,
        onLoad: handleLoad,
        onError: handleError,
        loading: "lazy"
      }
    )
  ] });
}

function getHotelImage(hotel, index = 0) {
  if (!hotel.images || hotel.images.length === 0) {
    return null;
  }
  return hotel.images[index]?.url || null;
}
function getHotelMainImage(hotel) {
  const mainImage = hotel.images?.find((img) => img.type === "main" || img.type === "featured");
  return mainImage?.url || getHotelImage(hotel, 0);
}
function getHotelImages(hotel) {
  return hotel.images?.map((img) => img.url).filter((url) => Boolean(url)) || [];
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

export { Badge as B, ImageWithLoading as I, LoadingSpinner as L, getHotelMainImage as a, formatHotelAddress as f, getHotelImages as g };

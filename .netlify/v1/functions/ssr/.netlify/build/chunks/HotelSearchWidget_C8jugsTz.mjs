import { jsxs, jsx } from 'react/jsx-runtime';
import { a as getHotelMainImage, f as formatHotelAddress, I as ImageWithLoading, B as Badge } from './utils_DsTnJw_S.mjs';
import { g as getRatingColor, B as Button, I as Input } from './PageLayout_H5zbvr1p.mjs';
import { C as Card, c as CardContent } from './Card_CjEgi5uA.mjs';
import { Star, MapPin, Search } from 'lucide-react';
import { f as formatCurrency } from './utils_CwWswjZg.mjs';
import { useState } from 'react';
import { format, addDays } from 'date-fns';

function HotelCard({ hotel, minPrice, currency = "USD", nights = 1, onSelect }) {
  const imageUrl = getHotelMainImage(hotel) || "/images/placeholder-hotel.jpg";
  const address = formatHotelAddress(hotel);
  const rating = hotel.review_score || 0;
  const ratingColor = getRatingColor(rating);
  return /* @__PURE__ */ jsxs(Card, { className: "overflow-hidden hover:shadow-strong transition-all duration-300 cursor-pointer hover-lift group shadow-soft", children: [
    /* @__PURE__ */ jsxs("div", { className: "relative h-48 overflow-hidden", onClick: () => onSelect(hotel.hotel_id), children: [
      /* @__PURE__ */ jsx(
        ImageWithLoading,
        {
          src: imageUrl,
          alt: hotel.name || "Hotel",
          className: "w-full h-full object-cover transition-transform duration-500 group-hover:scale-110",
          onError: () => {
          }
        }
      ),
      hotel.star_rating && /* @__PURE__ */ jsx("div", { className: "absolute top-2 left-2", children: /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "bg-white/90 text-gray-800", children: [
        /* @__PURE__ */ jsx(Star, { className: "h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" }),
        hotel.star_rating
      ] }) }),
      rating > 0 && /* @__PURE__ */ jsx("div", { className: `absolute top-2 right-2 ${ratingColor.bg} ${ratingColor.text} ${ratingColor.border} border rounded-full px-2 py-1 text-xs font-semibold`, children: rating.toFixed(1) })
    ] }),
    /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-lg mb-1 line-clamp-1", children: hotel.name }),
      address && /* @__PURE__ */ jsxs("div", { className: "flex items-center text-sm text-gray-600 mb-2", children: [
        /* @__PURE__ */ jsx(MapPin, { className: "h-4 w-4 mr-1" }),
        /* @__PURE__ */ jsx("span", { className: "line-clamp-1", children: address })
      ] }),
      hotel.review_count && rating > 0 && /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-600 mb-3", children: [
        hotel.review_count,
        " review",
        hotel.review_count !== 1 ? "s" : ""
      ] }),
      minPrice !== void 0 && /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between mb-3", children: /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-gray-900", children: formatCurrency(minPrice, currency) }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-600", children: [
          "per ",
          nights,
          " night",
          nights !== 1 ? "s" : ""
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(
        Button,
        {
          onClick: () => onSelect(hotel.hotel_id),
          className: "w-full",
          children: "View Details"
        }
      )
    ] })
  ] });
}

function HotelSearchWidget({
  initialLocation = "Telluride",
  initialDates,
  initialGuests = { adults: 2, children: 0 }
}) {
  const [location, setLocation] = useState(initialLocation);
  const [checkIn, setCheckIn] = useState(
    initialDates?.checkIn ? format(initialDates.checkIn, "yyyy-MM-dd") : format(addDays(/* @__PURE__ */ new Date(), 7), "yyyy-MM-dd")
  );
  const [checkOut, setCheckOut] = useState(
    initialDates?.checkOut ? format(initialDates.checkOut, "yyyy-MM-dd") : format(addDays(/* @__PURE__ */ new Date(), 14), "yyyy-MM-dd")
  );
  const [adults, setAdults] = useState(initialGuests.adults.toString());
  const [children, setChildren] = useState(initialGuests.children.toString());
  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams({
      location,
      checkIn,
      checkOut,
      adults
    });
    if (parseInt(children) > 0) {
      params.append("children", children);
    }
    if (typeof window !== "undefined") {
      window.location.href = `/lodging?${params.toString()}`;
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl shadow-strong p-8 md:p-12 border border-gray-200", style: { boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }, children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-3xl md:text-4xl font-bold mb-3 text-gray-900", style: { fontSize: "32px", lineHeight: "1.3" }, children: "Find Your Perfect Stay" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600 text-lg", style: { fontSize: "18px", lineHeight: "1.6" }, children: "Discover the best ski hotels in Telluride" })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-semibold text-gray-700 mb-2", children: "Location" }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400", children: /* @__PURE__ */ jsxs("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: [
            /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" }),
            /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 11a3 3 0 11-6 0 3 3 0 016 0z" })
          ] }) }),
          /* @__PURE__ */ jsx(
            Input,
            {
              type: "text",
              value: location,
              onChange: (e) => setLocation(e.target.value),
              placeholder: "Telluride, Colorado",
              className: "pl-10",
              required: true
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-semibold text-gray-700 mb-2", children: "Check-in" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400", children: /* @__PURE__ */ jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" }) }) }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "date",
                value: checkIn,
                onChange: (e) => setCheckIn(e.target.value),
                min: format(/* @__PURE__ */ new Date(), "yyyy-MM-dd"),
                className: "pl-10",
                required: true
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-semibold text-gray-700 mb-2", children: "Check-out" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400", children: /* @__PURE__ */ jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" }) }) }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "date",
                value: checkOut,
                onChange: (e) => setCheckOut(e.target.value),
                min: checkIn,
                className: "pl-10",
                required: true
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-semibold text-gray-700 mb-2", children: "Adults" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400", children: /* @__PURE__ */ jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" }) }) }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "number",
                value: adults,
                onChange: (e) => setAdults(e.target.value),
                min: "1",
                max: "10",
                className: "pl-10",
                required: true
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-semibold text-gray-700 mb-2", children: "Children" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400", children: /* @__PURE__ */ jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" }) }) }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "number",
                value: children,
                onChange: (e) => setChildren(e.target.value),
                min: "0",
                max: "10",
                className: "pl-10"
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Button, { type: "submit", size: "lg", className: "w-full bg-primary-500 hover:bg-primary-600 shadow-medium hover:shadow-strong transition-all duration-300 text-white font-semibold", style: { height: "56px", fontWeight: "600" }, children: [
        /* @__PURE__ */ jsx(Search, { className: "mr-2 h-5 w-5" }),
        "Search Hotels"
      ] })
    ] })
  ] });
}

export { HotelCard as H, HotelSearchWidget as a };

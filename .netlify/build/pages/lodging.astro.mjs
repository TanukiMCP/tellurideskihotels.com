import { c as createAstro, a as createComponent, d as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_DIEPIpiA.mjs';
import 'kleur/colors';
import 'html-escaper';
import { D as DEFAULT_LOCATION, b as DEFAULT_COUNTRY_CODE, $ as $$PageLayout, a as $$Container } from '../chunks/PageLayout_DgHuiZBJ.mjs';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useState, useMemo } from 'react';
import { H as HotelCard, L as LodgingMap, a as HotelSearchWidget } from '../chunks/HotelSearchWidget_C93aOetc.mjs';
import { L as LoadingSpinner } from '../chunks/LoadingSpinner_DCr4c4zF.mjs';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { B as Button } from '../chunks/Button_Bs4Cal8d.mjs';
import { $ as $$Breadcrumbs } from '../chunks/Breadcrumbs_DBm_rmGH.mjs';
export { renderers } from '../renderers.mjs';

const ITEMS_PER_PAGE = 12;
function HotelGrid({
  hotels,
  loading = false,
  minPrices = {},
  currency = "USD",
  nights = 1,
  checkIn,
  checkOut,
  adults = 2,
  selectedHotelId,
  hoveredHotelId,
  onHotelHover
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("rating");
  const sortedHotels = useMemo(() => {
    const sorted = [...hotels];
    switch (sortBy) {
      case "name":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "price-low":
        return sorted.sort((a, b) => {
          const priceA = minPrices[a.hotel_id] || Infinity;
          const priceB = minPrices[b.hotel_id] || Infinity;
          return priceA - priceB;
        });
      case "price-high":
        return sorted.sort((a, b) => {
          const priceA = minPrices[a.hotel_id] || 0;
          const priceB = minPrices[b.hotel_id] || 0;
          return priceB - priceA;
        });
      case "rating":
      default:
        return sorted.sort((a, b) => (b.review_score || 0) - (a.review_score || 0));
    }
  }, [hotels, sortBy, minPrices]);
  const totalPages = Math.ceil(sortedHotels.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedHotels = sortedHotels.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "flex justify-center items-center py-12", children: /* @__PURE__ */ jsx(LoadingSpinner, { size: "lg" }) });
  }
  if (hotels.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: "text-center py-12", children: /* @__PURE__ */ jsx("p", { className: "text-gray-600 text-lg", children: "No hotels found. Try adjusting your search criteria." }) });
  }
  const handleSelect = (hotelId) => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams();
      const defaultCheckIn = /* @__PURE__ */ new Date();
      defaultCheckIn.setDate(defaultCheckIn.getDate() + 7);
      const defaultCheckOut = new Date(defaultCheckIn);
      defaultCheckOut.setDate(defaultCheckOut.getDate() + 7);
      const finalCheckIn = checkIn || defaultCheckIn.toISOString().split("T")[0];
      const finalCheckOut = checkOut || defaultCheckOut.toISOString().split("T")[0];
      params.append("checkIn", finalCheckIn);
      params.append("checkOut", finalCheckOut);
      params.append("adults", adults.toString());
      params.append("rooms", "1");
      window.location.href = `/lodging/${hotelId}?${params.toString()}`;
    }
  };
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6 pb-4 border-b border-neutral-200", children: [
      /* @__PURE__ */ jsxs("p", { className: "text-neutral-600", children: [
        "Showing ",
        startIndex + 1,
        "-",
        Math.min(startIndex + ITEMS_PER_PAGE, sortedHotels.length),
        " of ",
        sortedHotels.length,
        " hotels"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(ArrowUpDown, { className: "w-4 h-4 text-neutral-500" }),
        /* @__PURE__ */ jsxs(
          "select",
          {
            value: sortBy,
            onChange: (e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            },
            className: "px-4 py-2 rounded-lg border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500",
            children: [
              /* @__PURE__ */ jsx("option", { value: "rating", children: "Highest Rated" }),
              /* @__PURE__ */ jsx("option", { value: "price-low", children: "Price: Low to High" }),
              /* @__PURE__ */ jsx("option", { value: "price-high", children: "Price: High to Low" }),
              /* @__PURE__ */ jsx("option", { value: "name", children: "Name: A to Z" })
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 mb-8", children: paginatedHotels.map((hotel) => /* @__PURE__ */ jsx(
      HotelCard,
      {
        hotel,
        minPrice: minPrices[hotel.hotel_id],
        currency,
        nights,
        checkInDate: checkIn,
        onSelect: handleSelect,
        isSelected: hotel.hotel_id === selectedHotelId,
        isHovered: hotel.hotel_id === hoveredHotelId,
        onMouseEnter: () => onHotelHover?.(hotel.hotel_id),
        onMouseLeave: () => onHotelHover?.(null)
      },
      hotel.hotel_id
    )) }),
    totalPages > 1 && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2", children: [
      /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "outline",
          size: "sm",
          onClick: () => handlePageChange(currentPage - 1),
          disabled: currentPage === 1,
          className: "flex items-center gap-1",
          children: [
            /* @__PURE__ */ jsx(ChevronLeft, { className: "w-4 h-4" }),
            "Previous"
          ]
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1", children: Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
        if (page === 1 || page === totalPages || page >= currentPage - 1 && page <= currentPage + 1) {
          return /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handlePageChange(page),
              className: `px-3 py-2 rounded-lg font-medium transition-colors ${page === currentPage ? "bg-primary-600 text-white" : "bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-300"}`,
              children: page
            },
            page
          );
        } else if (page === currentPage - 2 || page === currentPage + 2) {
          return /* @__PURE__ */ jsx("span", { className: "px-2 text-neutral-400", children: "..." }, page);
        }
        return null;
      }) }),
      /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "outline",
          size: "sm",
          onClick: () => handlePageChange(currentPage + 1),
          disabled: currentPage === totalPages,
          className: "flex items-center gap-1",
          children: [
            "Next",
            /* @__PURE__ */ jsx(ChevronRight, { className: "w-4 h-4" })
          ]
        }
      )
    ] })
  ] });
}

function HotelGridWithMap({
  hotels,
  loading,
  minPrices,
  currency,
  nights,
  checkIn,
  checkOut,
  adults
}) {
  const [selectedHotelId, setSelectedHotelId] = useState(null);
  const [hoveredHotelId, setHoveredHotelId] = useState(null);
  const handleHotelClick = (hotelId) => {
    setSelectedHotelId(hotelId === selectedHotelId ? null : hotelId);
  };
  const handleViewDetails = (hotelId) => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams();
      if (checkIn) params.append("checkIn", checkIn);
      if (checkOut) params.append("checkOut", checkOut);
      if (adults) params.append("adults", adults.toString());
      window.location.href = `/lodging/${hotelId}?${params.toString()}`;
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "lg:flex lg:gap-6", children: [
    /* @__PURE__ */ jsx("div", { className: "lg:w-3/5 mb-8 lg:mb-0", children: /* @__PURE__ */ jsx(
      HotelGrid,
      {
        hotels,
        loading,
        minPrices,
        currency,
        nights,
        checkIn,
        checkOut,
        adults,
        selectedHotelId,
        hoveredHotelId,
        onHotelHover: setHoveredHotelId
      }
    ) }),
    /* @__PURE__ */ jsx("div", { className: "lg:w-2/5", children: /* @__PURE__ */ jsx("div", { className: "lg:sticky lg:top-24", children: /* @__PURE__ */ jsx(
      LodgingMap,
      {
        hotels,
        minPrices,
        currency,
        checkInDate: checkIn,
        height: "600px",
        selectedHotelId,
        hoveredHotelId,
        onHotelClick: handleHotelClick,
        onHotelHover: setHoveredHotelId,
        onViewDetails: handleViewDetails
      }
    ) }) })
  ] });
}

const $$Astro = createAstro("https://tellurideskihotels.com");
const prerender = false;
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const url = Astro2.url;
  const searchParams = url.searchParams;
  const location = searchParams.get("location") || DEFAULT_LOCATION;
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const adults = parseInt(searchParams.get("adults") || "2", 10);
  let hotels = [];
  let minPrices = {};
  let loading = false;
  if (!checkIn || !checkOut) {
    return Astro2.redirect("/?message=Please select check-in and check-out dates");
  }
  try {
    loading = true;
    console.log("[Lodging Page] Searching for hotels WITH availability:", {
      location,
      checkIn,
      checkOut,
      adults
    });
    const { searchHotelsWithRates } = await import('../chunks/rates_CzGC_MKG.mjs');
    const result = await searchHotelsWithRates({
      cityName: location,
      countryCode: DEFAULT_COUNTRY_CODE,
      checkIn,
      checkOut,
      adults,
      limit: 50
      // Reduced from 100 - most users won't scroll past 50 results
    });
    hotels = result.hotels || [];
    minPrices = result.minPrices || {};
    console.log("[Lodging Page] Search complete:", {
      hotelsFound: hotels.length,
      hotelsWithPrices: Object.keys(minPrices).length,
      sampleHotel: hotels[0]?.name,
      samplePrice: Object.values(minPrices)[0]
    });
  } catch (error) {
    console.error("[Lodging Page] Error searching hotels:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : void 0
    });
    hotels = [];
  } finally {
    loading = false;
    console.log("[Lodging Page] Load complete");
  }
  const nights = checkIn && checkOut ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1e3 * 60 * 60 * 24)) : 1;
  return renderTemplate`${renderComponent($$result, "PageLayout", $$PageLayout, { "title": `Ski Hotels in ${location} - Search & Compare Prices`, "description": `Search and book ski hotels in ${location}. Compare prices, read reviews, and book directly with instant confirmation.` }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "Container", $$Container, { "class": "py-12 lg:py-16" }, { "default": async ($$result3) => renderTemplate` ${renderComponent($$result3, "Breadcrumbs", $$Breadcrumbs, { "items": [
    { label: "Home", href: "/" },
    { label: "Hotels", href: "/lodging" }
  ] })} ${maybeRenderHead()}<div class="mb-12"> <h1 class="text-display-sm lg:text-display-md text-neutral-900 mb-2">Find Your Perfect Hotel</h1> <p class="text-xl text-neutral-600 mb-8">Search and compare hotels in ${location}</p> ${renderComponent($$result3, "HotelSearchWidget", HotelSearchWidget, { "client:load": true, "initialLocation": location, "initialDates": checkIn && checkOut ? {
    checkIn: new Date(checkIn),
    checkOut: new Date(checkOut)
  } : void 0, "initialGuests": { adults, children: 0 }, "client:component-hydration": "load", "client:component-path": "@/components/lodging/HotelSearchWidget", "client:component-export": "HotelSearchWidget" })} </div> <div class="mb-6"> <h2 class="text-2xl font-bold text-neutral-900 mb-2"> ${hotels.length > 0 ? `${hotels.length} Hotels in ${location}` : "Loading Hotels..."} </h2> ${checkIn && checkOut && renderTemplate`<p class="text-neutral-600"> ${new Date(checkIn).toLocaleDateString()} - ${new Date(checkOut).toLocaleDateString()} • ${nights} night${nights !== 1 ? "s" : ""} • ${adults} adult${adults !== 1 ? "s" : ""} </p>`} </div>  ${renderComponent($$result3, "HotelGridWithMap", HotelGridWithMap, { "client:idle": true, "hotels": hotels, "loading": loading, "minPrices": minPrices, "currency": "USD", "nights": nights, "checkIn": checkIn, "checkOut": checkOut, "adults": adults, "client:component-hydration": "idle", "client:component-path": "@/components/lodging/HotelGridWithMap", "client:component-export": "HotelGridWithMap" })} ` })} ` })}`;
}, "C:/Users/ididi/OneDrive/Desktop/tellurideskihotels.com/src/pages/lodging/index.astro", void 0);

const $$file = "C:/Users/ididi/OneDrive/Desktop/tellurideskihotels.com/src/pages/lodging/index.astro";
const $$url = "/lodging";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };

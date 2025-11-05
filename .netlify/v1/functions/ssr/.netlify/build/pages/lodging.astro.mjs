import { c as createAstro, a as createComponent, d as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_rnaPFH2-.mjs';
import 'kleur/colors';
import 'html-escaper';
import { D as DEFAULT_LOCATION, b as DEFAULT_COUNTRY_CODE, $ as $$PageLayout, a as $$Container } from '../chunks/PageLayout_H5zbvr1p.mjs';
import { jsx } from 'react/jsx-runtime';
import { H as HotelCard, a as HotelSearchWidget } from '../chunks/HotelSearchWidget_C8jugsTz.mjs';
import { L as LoadingSpinner } from '../chunks/utils_DsTnJw_S.mjs';
import { $ as $$Breadcrumbs } from '../chunks/Breadcrumbs_D3BEtb3b.mjs';
export { renderers } from '../renderers.mjs';

function HotelGrid({
  hotels,
  loading = false,
  minPrices = {},
  currency = "USD",
  nights = 1,
  onHotelSelect
}) {
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "flex justify-center items-center py-12", children: /* @__PURE__ */ jsx(LoadingSpinner, { size: "lg" }) });
  }
  if (hotels.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: "text-center py-12", children: /* @__PURE__ */ jsx("p", { className: "text-gray-600 text-lg", children: "No hotels found. Try adjusting your search criteria." }) });
  }
  const handleSelect = (hotelId) => {
    if (typeof window !== "undefined") {
      onHotelSelect(hotelId);
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: hotels.map((hotel) => /* @__PURE__ */ jsx(
    HotelCard,
    {
      hotel,
      minPrice: minPrices[hotel.hotel_id],
      currency,
      nights,
      onSelect: handleSelect
    },
    hotel.hotel_id
  )) });
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
  if (searchParams.has("location")) {
    try {
      loading = true;
      const { searchHotels } = await import('../chunks/hotels_C0FYiV_O.mjs');
      const hotelData = await searchHotels({
        cityName: location,
        countryCode: DEFAULT_COUNTRY_CODE,
        limit: 100
      });
      hotels = hotelData.data || [];
      if (checkIn && checkOut && hotels.length > 0) {
        try {
          const { searchRates } = await import('../chunks/rates_VMhhcuFS.mjs');
          const hotelIds = hotels.slice(0, 10).map((h) => h.hotel_id).join(",");
          const ratesData = await searchRates({
            hotelIds,
            checkIn,
            checkOut,
            adults
          });
          if (ratesData.data) {
            ratesData.data.forEach((hotel) => {
              const hotelMinPrice = hotel.rooms?.flatMap(
                (r) => r.rates?.map((rate) => rate.total?.amount || rate.net?.amount || Infinity)
              ).filter((p) => p !== Infinity);
              if (hotelMinPrice && hotelMinPrice.length > 0) {
                minPrices[hotel.hotel_id] = Math.min(...hotelMinPrice);
              }
            });
          }
        } catch (rateError) {
          console.error("Error fetching rates:", rateError);
        }
      }
    } catch (error) {
      console.error("Error fetching hotels:", error);
      hotels = [];
    } finally {
      loading = false;
    }
  }
  const nights = checkIn && checkOut ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1e3 * 60 * 60 * 24)) : 1;
  return renderTemplate`${renderComponent($$result, "PageLayout", $$PageLayout, { "title": `Ski Hotels in ${location} - Search & Compare Prices`, "description": `Search and book ski hotels in ${location}. Compare prices, read reviews, and book directly with instant confirmation.` }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "Container", $$Container, { "class": "py-8" }, { "default": async ($$result3) => renderTemplate` ${renderComponent($$result3, "Breadcrumbs", $$Breadcrumbs, { "items": [
    { label: "Home", href: "/" },
    { label: "Hotels", href: "/lodging" }
  ] })} ${maybeRenderHead()}<div class="mb-8"> ${renderComponent($$result3, "HotelSearchWidget", HotelSearchWidget, { "client:load": true, "initialLocation": location, "initialDates": checkIn && checkOut ? {
    checkIn: new Date(checkIn),
    checkOut: new Date(checkOut)
  } : void 0, "initialGuests": { adults, children: 0 }, "client:component-hydration": "load", "client:component-path": "@/components/lodging/HotelSearchWidget", "client:component-export": "HotelSearchWidget" })} </div> <div id="hotel-grid"> ${renderComponent($$result3, "HotelGrid", HotelGrid, { "client:load": true, "hotels": hotels, "loading": loading, "minPrices": minPrices, "currency": "USD", "nights": nights, "onHotelSelect": (hotelId) => {
    const params = new URLSearchParams({ hotelId });
    if (checkIn) params.append("checkIn", checkIn);
    if (checkOut) params.append("checkOut", checkOut);
    params.append("adults", adults.toString());
    if (typeof window !== "undefined") {
      window.location.href = `/lodging/${hotelId}?${params.toString()}`;
    }
  }, "client:component-hydration": "load", "client:component-path": "@/components/lodging/HotelGrid", "client:component-export": "HotelGrid" })} </div> ` })} ` })}`;
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

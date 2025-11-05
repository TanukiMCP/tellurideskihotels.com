import { c as createAstro, a as createComponent, d as renderComponent, r as renderTemplate } from '../../../chunks/astro/server_rnaPFH2-.mjs';
import 'kleur/colors';
import 'html-escaper';
import { B as Button, $ as $$PageLayout, a as $$Container } from '../../../chunks/PageLayout_H5zbvr1p.mjs';
import { jsx, jsxs } from 'react/jsx-runtime';
import { C as Card, a as CardHeader, b as CardTitle, c as CardContent } from '../../../chunks/Card_CjEgi5uA.mjs';
import { CheckCircle } from 'lucide-react';
import { $ as $$Breadcrumbs } from '../../../chunks/Breadcrumbs_D3BEtb3b.mjs';
export { renderers } from '../../../renderers.mjs';

function BookingConfirmation({
  bookingId,
  confirmationNumber,
  hotelName,
  checkIn,
  checkOut
}) {
  return /* @__PURE__ */ jsx("div", { className: "max-w-2xl mx-auto", children: /* @__PURE__ */ jsxs(Card, { className: "text-center", children: [
    /* @__PURE__ */ jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsx("div", { className: "flex justify-center mb-4", children: /* @__PURE__ */ jsx(CheckCircle, { className: "h-16 w-16 text-green-500" }) }),
      /* @__PURE__ */ jsx(CardTitle, { className: "text-3xl", children: "Booking Confirmed!" })
    ] }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
      confirmationNumber && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: "Confirmation Number" }),
        /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-turquoise-500", children: confirmationNumber })
      ] }),
      bookingId && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: "Booking ID" }),
        /* @__PURE__ */ jsx("p", { className: "text-lg font-mono", children: bookingId })
      ] }),
      hotelName && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: "Hotel" }),
        /* @__PURE__ */ jsx("p", { className: "text-lg font-semibold", children: hotelName })
      ] }),
      checkIn && checkOut && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: "Dates" }),
        /* @__PURE__ */ jsxs("p", { className: "text-lg", children: [
          new Date(checkIn).toLocaleDateString(),
          " - ",
          new Date(checkOut).toLocaleDateString()
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "pt-4", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mb-4", children: "A confirmation email has been sent to your email address." }),
        /* @__PURE__ */ jsx(
          Button,
          {
            onClick: () => {
              if (typeof window !== "undefined") {
                window.location.href = "/lodging";
              }
            },
            className: "w-full",
            children: "Search More Hotels"
          }
        )
      ] })
    ] })
  ] }) });
}

const $$Astro = createAstro("https://tellurideskihotels.com");
const prerender = false;
const $$bookingId = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$bookingId;
  const { bookingId } = Astro2.params;
  return renderTemplate`${renderComponent($$result, "PageLayout", $$PageLayout, { "title": "Booking Confirmation", "description": "Your booking has been confirmed", "noindex": true }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Container", $$Container, { "class": "py-12" }, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "Breadcrumbs", $$Breadcrumbs, { "items": [
    { label: "Home", href: "/" },
    { label: "Booking Confirmation", href: void 0 }
  ] })} ${renderComponent($$result3, "BookingConfirmation", BookingConfirmation, { "client:load": true, "bookingId": bookingId || "", "client:component-hydration": "load", "client:component-path": "@/components/checkout/BookingConfirmation", "client:component-export": "BookingConfirmation" })} ` })} ` })}`;
}, "C:/Users/ididi/OneDrive/Desktop/tellurideskihotels.com/src/pages/booking/confirmation/[bookingId].astro", void 0);

const $$file = "C:/Users/ididi/OneDrive/Desktop/tellurideskihotels.com/src/pages/booking/confirmation/[bookingId].astro";
const $$url = "/booking/confirmation/[bookingId]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$bookingId,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };

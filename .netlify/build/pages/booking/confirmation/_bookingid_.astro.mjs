import { c as createAstro, a as createComponent, d as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../../../chunks/astro/server_DIEPIpiA.mjs';
import 'kleur/colors';
import 'html-escaper';
import { $ as $$PageLayout, a as $$Container } from '../../../chunks/PageLayout_DgHuiZBJ.mjs';
import { jsx, jsxs } from 'react/jsx-runtime';
import { C as Card, a as CardHeader, b as CardTitle, c as CardContent } from '../../../chunks/Card_CsHJIv-j.mjs';
import { B as Button } from '../../../chunks/Button_Bs4Cal8d.mjs';
import { CheckCircle, FileText, Hotel, Calendar, Mail } from 'lucide-react';
import { $ as $$Breadcrumbs } from '../../../chunks/Breadcrumbs_DBm_rmGH.mjs';
import { g as getBooking } from '../../../chunks/booking_BbchjKJW.mjs';
export { renderers } from '../../../renderers.mjs';

function BookingConfirmation({
  bookingId,
  confirmationNumber,
  hotelName,
  checkIn,
  checkOut
}) {
  return /* @__PURE__ */ jsx("div", { className: "max-w-3xl mx-auto", children: /* @__PURE__ */ jsxs(Card, { className: "border-2 border-primary-200 shadow-elevated", children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "text-center bg-gradient-to-br from-primary-50 to-white border-b border-primary-100 pb-8", children: [
      /* @__PURE__ */ jsx("div", { className: "flex justify-center mb-6", children: /* @__PURE__ */ jsx("div", { className: "w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center shadow-card", children: /* @__PURE__ */ jsx(CheckCircle, { className: "h-12 w-12 text-white" }) }) }),
      /* @__PURE__ */ jsx(CardTitle, { className: "text-display-sm text-neutral-900 mb-2", children: "Booking Confirmed!" }),
      /* @__PURE__ */ jsx("p", { className: "text-lg text-neutral-600", children: "Your reservation has been successfully completed" })
    ] }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-6 p-8", children: [
      confirmationNumber && /* @__PURE__ */ jsxs("div", { className: "bg-neutral-50 rounded-xl p-6 border border-neutral-200", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
          /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5 text-primary-600" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-neutral-900", children: "Confirmation Number" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-3xl font-bold text-primary-600", children: confirmationNumber })
      ] }),
      bookingId && /* @__PURE__ */ jsxs("div", { className: "bg-neutral-50 rounded-xl p-6 border border-neutral-200", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-neutral-900 mb-2", children: "Booking ID" }),
        /* @__PURE__ */ jsx("p", { className: "text-xl font-mono text-neutral-700", children: bookingId })
      ] }),
      hotelName && /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4 p-6 bg-white rounded-xl border border-neutral-200", children: [
        /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsx(Hotel, { className: "w-6 h-6 text-primary-600" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-neutral-600 mb-1", children: "Hotel" }),
          /* @__PURE__ */ jsx("p", { className: "text-xl font-bold text-neutral-900", children: hotelName })
        ] })
      ] }),
      checkIn && checkOut && /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4 p-6 bg-white rounded-xl border border-neutral-200", children: [
        /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-xl bg-accent-100 flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsx(Calendar, { className: "w-6 h-6 text-accent-600" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-neutral-600 mb-1", children: "Dates" }),
          /* @__PURE__ */ jsxs("p", { className: "text-lg font-bold text-neutral-900", children: [
            new Date(checkIn).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            " - ",
            new Date(checkOut).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "bg-primary-50 rounded-xl p-6 border border-primary-200", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
        /* @__PURE__ */ jsx(Mail, { className: "w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-neutral-700 leading-relaxed", children: "A confirmation email has been sent to your email address with all booking details, check-in instructions, and hotel contact information." })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-4 pt-4", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            onClick: () => {
              if (typeof window !== "undefined") {
                window.print();
              }
            },
            variant: "outline",
            className: "flex-1",
            children: "Print Confirmation"
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            onClick: () => {
              if (typeof window !== "undefined") {
                window.location.href = "/lodging";
              }
            },
            className: "flex-1",
            children: "Search More Hotels"
          }
        )
      ] })
    ] })
  ] }) });
}

const $$Astro = createAstro("https://tellurideskihotels.com");
const prerender = false;
const $$bookingId = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$bookingId;
  const { bookingId } = Astro2.params;
  let bookingDetails = null;
  let error = null;
  if (bookingId) {
    try {
      bookingDetails = await getBooking(bookingId);
    } catch (err) {
      console.error("[Confirmation] Error fetching booking:", err);
      error = "Could not load booking details";
    }
  }
  return renderTemplate`${renderComponent($$result, "PageLayout", $$PageLayout, { "title": "Booking Confirmation", "description": "Your booking has been confirmed", "noindex": true }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "Container", $$Container, { "class": "py-16 lg:py-20" }, { "default": async ($$result3) => renderTemplate` ${renderComponent($$result3, "Breadcrumbs", $$Breadcrumbs, { "items": [
    { label: "Home", href: "/" },
    { label: "Booking Confirmation", href: void 0 }
  ] })} ${error ? renderTemplate`${maybeRenderHead()}<div class="max-w-2xl mx-auto text-center py-12"> <p class="text-red-600 mb-4">${error}</p> <a href="/lodging" class="text-primary-600 hover:text-primary-700 font-semibold">
Back to Hotel Search
</a> </div>` : renderTemplate`${renderComponent($$result3, "BookingConfirmation", BookingConfirmation, { "client:load": true, "bookingId": bookingId || "", "confirmationNumber": bookingDetails?.confirmation_number || bookingDetails?.booking_id, "hotelName": bookingDetails?.hotel_name, "checkIn": bookingDetails?.checkin, "checkOut": bookingDetails?.checkout, "client:component-hydration": "load", "client:component-path": "@/components/checkout/BookingConfirmation", "client:component-export": "BookingConfirmation" })}`}` })} ` })}`;
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

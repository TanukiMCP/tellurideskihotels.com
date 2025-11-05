import { c as createAstro, a as createComponent, m as maybeRenderHead, b as addAttribute, e as renderSlot, r as renderTemplate, d as renderComponent, f as renderHead } from './astro/server_rnaPFH2-.mjs';
import 'kleur/colors';
import 'html-escaper';
/* empty css                         */
import 'clsx';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { forwardRef, useState } from 'react';
import { Search } from 'lucide-react';
import { a as cn } from './utils_CwWswjZg.mjs';
import { format, addDays } from 'date-fns';

const SITE_NAME = "Telluride Ski Hotels";
const SITE_DESCRIPTION = "Search and book the best ski hotels in Telluride, Colorado. Compare prices, read reviews, and book directly.";
const DEFAULT_LOCATION = "Telluride";
const DEFAULT_COUNTRY_CODE = "US";
const RATING_COLORS = {
  excellent: { bg: "bg-green-100", text: "text-green-800", border: "border-green-300" },
  veryGood: { bg: "bg-turquoise-100", text: "text-turquoise-800", border: "border-turquoise-300" },
  good: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300" },
  average: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-300" },
  poor: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300" }
};
function getRatingColor(rating) {
  if (rating >= 9) return RATING_COLORS.excellent;
  if (rating >= 8) return RATING_COLORS.veryGood;
  if (rating >= 7) return RATING_COLORS.good;
  if (rating >= 6) return RATING_COLORS.average;
  return RATING_COLORS.poor;
}

const $$Astro$2 = createAstro("https://tellurideskihotels.com");
const $$Container = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$Container;
  const { class: className = "" } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div${addAttribute(`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`, "class")}> ${renderSlot($$result, $$slots["default"])} </div>`;
}, "C:/Users/ididi/OneDrive/Desktop/tellurideskihotels.com/src/components/layout/Container.astro", void 0);

const Button = forwardRef(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700",
      secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 active:bg-gray-400",
      outline: "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50",
      ghost: "text-gray-700 hover:bg-gray-100"
    };
    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg"
    };
    return /* @__PURE__ */ jsx(
      "button",
      {
        ref,
        className: cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-turquoise-500 focus:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variants[variant],
          sizes[size],
          className
        ),
        disabled: disabled || isLoading,
        ...props,
        children: isLoading ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs(
            "svg",
            {
              className: "mr-2 h-4 w-4 animate-spin",
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
          ),
          "Loading..."
        ] }) : children
      }
    );
  }
);
Button.displayName = "Button";

const Input = forwardRef(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substring(2, 11)}`;
    return /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
      label && /* @__PURE__ */ jsx("label", { htmlFor: inputId, className: "block text-sm font-medium text-gray-700 mb-1", children: label }),
      /* @__PURE__ */ jsx(
        "input",
        {
          ref,
          id: inputId,
          className: cn(
            "flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm",
            "ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-gray-400",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-turquoise-500 focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus-visible:ring-red-500",
            className
          ),
          ...props
        }
      ),
      error && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-600", children: error })
    ] });
  }
);
Input.displayName = "Input";

function HotelSearchBar() {
  const [location, setLocation] = useState("Telluride");
  const [checkIn, setCheckIn] = useState(format(addDays(/* @__PURE__ */ new Date(), 7), "yyyy-MM-dd"));
  const [checkOut, setCheckOut] = useState(format(addDays(/* @__PURE__ */ new Date(), 14), "yyyy-MM-dd"));
  const [adults, setAdults] = useState("2");
  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams({
      location,
      checkIn,
      checkOut,
      adults
    });
    if (typeof window !== "undefined") {
      window.location.href = `/lodging?${params.toString()}`;
    }
  };
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "flex flex-col sm:flex-row gap-2", children: [
    /* @__PURE__ */ jsx(
      Input,
      {
        type: "text",
        value: location,
        onChange: (e) => setLocation(e.target.value),
        placeholder: "Location",
        className: "flex-1"
      }
    ),
    /* @__PURE__ */ jsx(
      Input,
      {
        type: "date",
        value: checkIn,
        onChange: (e) => setCheckIn(e.target.value),
        label: "Check-in",
        min: format(/* @__PURE__ */ new Date(), "yyyy-MM-dd")
      }
    ),
    /* @__PURE__ */ jsx(
      Input,
      {
        type: "date",
        value: checkOut,
        onChange: (e) => setCheckOut(e.target.value),
        label: "Check-out",
        min: checkIn
      }
    ),
    /* @__PURE__ */ jsx(
      Input,
      {
        type: "number",
        value: adults,
        onChange: (e) => setAdults(e.target.value),
        label: "Adults",
        min: "1",
        max: "10",
        className: "w-24"
      }
    ),
    /* @__PURE__ */ jsxs(Button, { type: "submit", className: "sm:mt-6", children: [
      /* @__PURE__ */ jsx(Search, { className: "mr-2 h-4 w-4" }),
      "Search"
    ] })
  ] });
}

const $$Header = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<header class="sticky top-0 z-50 glass-effect border-b border-white/20 shadow-soft"> ${renderComponent($$result, "Container", $$Container, {}, { "default": ($$result2) => renderTemplate` <div class="flex items-center justify-between h-20"> <a href="/" class="flex items-center space-x-3 group"> <div class="w-10 h-10 rounded-lg bg-gradient-accent flex items-center justify-center shadow-medium group-hover:shadow-strong transition-all duration-300 group-hover:scale-105"> <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path> </svg> </div> <h1 class="text-2xl font-bold bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent font-display">${SITE_NAME}</h1> </a> <nav class="hidden md:flex items-center space-x-8"> <a href="/lodging" class="text-gray-700 hover:text-primary-600 font-medium relative transition-colors duration-200 group">
Hotels
<span class="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-600 group-hover:w-full transition-all duration-300"></span> </a> <a href="/about" class="text-gray-700 hover:text-primary-600 font-medium relative transition-colors duration-200 group">
About
<span class="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-600 group-hover:w-full transition-all duration-300"></span> </a> </nav> </div> <div class="pb-6 pt-4"> ${renderComponent($$result2, "HotelSearchBar", HotelSearchBar, { "client:load": true, "client:component-hydration": "load", "client:component-path": "@/components/lodging/HotelSearchBar", "client:component-export": "HotelSearchBar" })} </div> ` })} </header>`;
}, "C:/Users/ididi/OneDrive/Desktop/tellurideskihotels.com/src/components/layout/Header.astro", void 0);

const $$Footer = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<footer class="bg-gray-900 text-gray-300 mt-auto"> <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12"> <div class="grid grid-cols-1 md:grid-cols-4 gap-8"> <div> <h3 class="text-white font-semibold mb-4">${SITE_NAME}</h3> <p class="text-sm">Find and book the best ski hotels in Telluride, Colorado.</p> </div> <div> <h4 class="text-white font-semibold mb-4">Quick Links</h4> <ul class="space-y-2 text-sm"> <li><a href="/lodging" class="hover:text-turquoise-400 transition-colors">Search Hotels</a></li> <li><a href="/about" class="hover:text-turquoise-400 transition-colors">About Us</a></li> </ul> </div> <div> <h4 class="text-white font-semibold mb-4">Support</h4> <ul class="space-y-2 text-sm"> <li><a href="/contact" class="hover:text-turquoise-400 transition-colors">Contact</a></li> <li><a href="/faq" class="hover:text-turquoise-400 transition-colors">FAQ</a></li> </ul> </div> <div> <h4 class="text-white font-semibold mb-4">Legal</h4> <ul class="space-y-2 text-sm"> <li><a href="/privacy" class="hover:text-turquoise-400 transition-colors">Privacy Policy</a></li> <li><a href="/terms" class="hover:text-turquoise-400 transition-colors">Terms of Service</a></li> </ul> </div> </div> <div class="mt-8 pt-8 border-t border-gray-800 text-center text-sm"> <p>&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} ${SITE_NAME}. All rights reserved.</p> </div> </div> </footer>`;
}, "C:/Users/ididi/OneDrive/Desktop/tellurideskihotels.com/src/components/layout/Footer.astro", void 0);

const $$Astro$1 = createAstro("https://tellurideskihotels.com");
const $$SEOHead = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$SEOHead;
  const {
    title,
    description = SITE_DESCRIPTION,
    image,
    noindex = false
  } = Astro2.props;
  const PUBLIC_SITE_URL = "https://tellurideskihotels.com";
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const canonicalUrl = new URL(Astro2.url.pathname, PUBLIC_SITE_URL).toString();
  const ogImage = image || `${PUBLIC_SITE_URL}/og-image.jpg`;
  return renderTemplate`<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${fullTitle}</title><meta name="description"${addAttribute(description, "content")}><link rel="canonical"${addAttribute(canonicalUrl, "href")}>${noindex && renderTemplate`<meta name="robots" content="noindex, nofollow">`}<!-- Open Graph --><meta property="og:title"${addAttribute(fullTitle, "content")}><meta property="og:description"${addAttribute(description, "content")}><meta property="og:image"${addAttribute(ogImage, "content")}><meta property="og:url"${addAttribute(canonicalUrl, "content")}><meta property="og:type" content="website"><meta property="og:site_name"${addAttribute(SITE_NAME, "content")}><!-- Twitter --><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title"${addAttribute(fullTitle, "content")}><meta name="twitter:description"${addAttribute(description, "content")}><meta name="twitter:image"${addAttribute(ogImage, "content")}><!-- Favicons --><link rel="icon" type="image/x-icon" href="/favicon.ico"><link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"><link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"><link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png"><link rel="manifest" href="/site.webmanifest">`;
}, "C:/Users/ididi/OneDrive/Desktop/tellurideskihotels.com/src/components/seo/SEOHead.astro", void 0);

const $$Astro = createAstro("https://tellurideskihotels.com");
const $$PageLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$PageLayout;
  const {
    title,
    description,
    image,
    noindex = false
  } = Astro2.props;
  return renderTemplate`<html lang="en"> <head>${renderComponent($$result, "SEOHead", $$SEOHead, { "title": title, "description": description, "image": image, "noindex": noindex })}<meta name="viewport" content="width=device-width, initial-scale=1.0">${renderHead()}</head> <body class="min-h-screen flex flex-col"> ${renderComponent($$result, "Header", $$Header, {})} <main class="flex-1"> ${renderSlot($$result, $$slots["default"])} </main> ${renderComponent($$result, "Footer", $$Footer, {})} </body></html>`;
}, "C:/Users/ididi/OneDrive/Desktop/tellurideskihotels.com/src/components/layout/PageLayout.astro", void 0);

export { $$PageLayout as $, Button as B, DEFAULT_LOCATION as D, Input as I, SITE_DESCRIPTION as S, $$Container as a, DEFAULT_COUNTRY_CODE as b, getRatingColor as g };

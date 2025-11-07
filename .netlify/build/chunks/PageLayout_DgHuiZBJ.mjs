import { c as createAstro, a as createComponent, m as maybeRenderHead, b as addAttribute, e as renderSlot, r as renderTemplate, d as renderComponent, f as renderHead } from './astro/server_DIEPIpiA.mjs';
import 'kleur/colors';
import 'html-escaper';
/* empty css                         */
import 'clsx';

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

const $$Header = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<header class="sticky top-0 z-50 glass-effect border-b border-neutral-200 shadow-card"> ${renderComponent($$result, "Container", $$Container, {}, { "default": ($$result2) => renderTemplate` <div class="flex items-center justify-between h-20"> <a href="/" class="flex items-center space-x-3 group"> <div class="w-11 h-11 rounded-xl bg-gradient-primary flex items-center justify-center shadow-card group-hover:shadow-card-hover transition-all duration-300 group-hover:scale-105"> <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path> </svg> </div> <h1 class="text-2xl font-bold text-neutral-900 font-display">${SITE_NAME}</h1> </a> <nav class="flex items-center space-x-8"> <a href="/lodging" class="text-neutral-700 hover:text-primary-600 font-semibold relative transition-colors duration-200 group">
Hotels
<span class="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span> </a> <a href="/about" class="text-neutral-700 hover:text-primary-600 font-semibold relative transition-colors duration-200 group">
About
<span class="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span> </a> </nav> </div> ` })} </header>`;
}, "C:/Users/ididi/OneDrive/Desktop/tellurideskihotels.com/src/components/layout/Header.astro", void 0);

const $$Footer = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<footer class="bg-neutral-900 text-neutral-300 mt-auto border-t border-neutral-800"> <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-20"> <div class="grid grid-cols-1 md:grid-cols-4 gap-12"> <div> <div class="flex items-center space-x-3 mb-4"> <div class="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center"> <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path> </svg> </div> <h3 class="text-white font-bold text-lg">${SITE_NAME}</h3> </div> <p class="text-sm text-neutral-400 leading-relaxed">Find and book the best ski hotels in Telluride, Colorado with real-time availability and instant confirmation.</p> </div> <div> <h4 class="text-white font-bold mb-4">Quick Links</h4> <ul class="space-y-3 text-sm"> <li><a href="/lodging" class="text-neutral-400 hover:text-primary-400 transition-colors">Search Hotels</a></li> <li><a href="/about" class="text-neutral-400 hover:text-primary-400 transition-colors">About Us</a></li> </ul> </div> <div> <h4 class="text-white font-bold mb-4">Support</h4> <ul class="space-y-3 text-sm"> <li><a href="/contact" class="text-neutral-400 hover:text-primary-400 transition-colors">Contact</a></li> <li><a href="/faq" class="text-neutral-400 hover:text-primary-400 transition-colors">FAQ</a></li> </ul> </div> <div> <h4 class="text-white font-bold mb-4">Legal</h4> <ul class="space-y-3 text-sm"> <li><a href="/privacy" class="text-neutral-400 hover:text-primary-400 transition-colors">Privacy Policy</a></li> <li><a href="/terms" class="text-neutral-400 hover:text-primary-400 transition-colors">Terms of Service</a></li> </ul> </div> </div> <div class="mt-12 pt-8 border-t border-neutral-800 text-center text-sm text-neutral-400"> <p>&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} ${SITE_NAME}. All rights reserved.</p> </div> </div> </footer>`;
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

export { $$PageLayout as $, DEFAULT_LOCATION as D, SITE_DESCRIPTION as S, $$Container as a, DEFAULT_COUNTRY_CODE as b, getRatingColor as g };

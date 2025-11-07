import { c as createAstro, a as createComponent, m as maybeRenderHead, d as renderComponent, F as Fragment, r as renderTemplate, b as addAttribute } from './astro/server_DIEPIpiA.mjs';
import 'kleur/colors';
import 'html-escaper';

const $$Astro = createAstro("https://tellurideskihotels.com");
const $$Breadcrumbs = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Breadcrumbs;
  const { items } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<nav class="flex items-center space-x-2 text-sm mb-8" aria-label="Breadcrumb"> <a href="/" class="text-neutral-600 hover:text-primary-600 transition-colors font-medium"> <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path> </svg> </a> ${items.map((item) => renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result2) => renderTemplate` <svg class="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path> </svg> ${item.href ? renderTemplate`<a${addAttribute(item.href, "href")} class="text-neutral-600 hover:text-primary-600 transition-colors font-medium"> ${item.label} </a>` : renderTemplate`<span class="text-neutral-900 font-semibold"> ${item.label} </span>`}` })}`)} </nav>`;
}, "C:/Users/ididi/OneDrive/Desktop/tellurideskihotels.com/src/components/seo/Breadcrumbs.astro", void 0);

export { $$Breadcrumbs as $ };

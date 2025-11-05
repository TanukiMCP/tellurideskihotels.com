import { c as createAstro, a as createComponent, m as maybeRenderHead, r as renderTemplate, b as addAttribute } from './astro/server_rnaPFH2-.mjs';
import 'kleur/colors';
import 'html-escaper';
import 'clsx';

const $$Astro = createAstro("https://tellurideskihotels.com");
const $$Breadcrumbs = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Breadcrumbs;
  const { items } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<nav aria-label="Breadcrumb" class="mb-6"> <ol class="flex items-center space-x-2 text-sm text-gray-600"> ${items.map((item, index) => renderTemplate`<li class="flex items-center"> ${index > 0 && renderTemplate`<span class="mx-2">/</span>`} ${item.href ? renderTemplate`<a${addAttribute(item.href, "href")} class="hover:text-turquoise-500 transition-colors"> ${item.label} </a>` : renderTemplate`<span class="text-gray-900 font-medium">${item.label}</span>`} </li>`)} </ol> </nav>`;
}, "C:/Users/ididi/OneDrive/Desktop/tellurideskihotels.com/src/components/seo/Breadcrumbs.astro", void 0);

export { $$Breadcrumbs as $ };

import { renderers } from './renderers.mjs';
import { s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_CvSoi7hX.mjs';
import { manifest } from './manifest_BPm0Q5o9.mjs';
import { createExports } from '@astrojs/netlify/ssr-function.js';

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/about.astro.mjs');
const _page2 = () => import('./pages/admin/bookings.astro.mjs');
const _page3 = () => import('./pages/admin/login.astro.mjs');
const _page4 = () => import('./pages/admin.astro.mjs');
const _page5 = () => import('./pages/api/admin/bookings/_bookingid_/cancel.astro.mjs');
const _page6 = () => import('./pages/api/admin/bookings.astro.mjs');
const _page7 = () => import('./pages/api/admin/stats.astro.mjs');
const _page8 = () => import('./pages/api/auth/_---all_.astro.mjs');
const _page9 = () => import('./pages/api/booking/confirm.astro.mjs');
const _page10 = () => import('./pages/api/booking/prebook.astro.mjs');
const _page11 = () => import('./pages/api/checkout/create-payment-intent.astro.mjs');
const _page12 = () => import('./pages/api/hotels/addons.astro.mjs');
const _page13 = () => import('./pages/api/hotels/details.astro.mjs');
const _page14 = () => import('./pages/api/hotels/rates.astro.mjs');
const _page15 = () => import('./pages/api/hotels/reviews.astro.mjs');
const _page16 = () => import('./pages/api/hotels/search.astro.mjs');
const _page17 = () => import('./pages/booking/confirmation/_bookingid_.astro.mjs');
const _page18 = () => import('./pages/lodging/_hotelid_.astro.mjs');
const _page19 = () => import('./pages/lodging.astro.mjs');
const _page20 = () => import('./pages/index.astro.mjs');

const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/about/index.astro", _page1],
    ["src/pages/admin/bookings.astro", _page2],
    ["src/pages/admin/login.astro", _page3],
    ["src/pages/admin/index.astro", _page4],
    ["src/pages/api/admin/bookings/[bookingId]/cancel.ts", _page5],
    ["src/pages/api/admin/bookings.ts", _page6],
    ["src/pages/api/admin/stats.ts", _page7],
    ["src/pages/api/auth/[...all].ts", _page8],
    ["src/pages/api/booking/confirm.ts", _page9],
    ["src/pages/api/booking/prebook.ts", _page10],
    ["src/pages/api/checkout/create-payment-intent.ts", _page11],
    ["src/pages/api/hotels/addons.ts", _page12],
    ["src/pages/api/hotels/details.ts", _page13],
    ["src/pages/api/hotels/rates.ts", _page14],
    ["src/pages/api/hotels/reviews.ts", _page15],
    ["src/pages/api/hotels/search.ts", _page16],
    ["src/pages/booking/confirmation/[bookingId].astro", _page17],
    ["src/pages/lodging/[hotelId].astro", _page18],
    ["src/pages/lodging/index.astro", _page19],
    ["src/pages/index.astro", _page20]
]);
const serverIslandMap = new Map();
const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    middleware: () => import('./_astro-internal_middleware.mjs')
});
const _args = {
    "middlewareSecret": "643de947-a425-4021-9253-94ab9e5a28ef"
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (_start in serverEntrypointModule) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { __astrojsSsrVirtualEntry as default, pageMap };

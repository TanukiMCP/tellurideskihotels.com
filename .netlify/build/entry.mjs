import { renderers } from './renderers.mjs';
import { s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_CvSoi7hX.mjs';
import { manifest } from './manifest_gQ-1ZMnC.mjs';
import { createExports } from '@astrojs/netlify/ssr-function.js';

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/about.astro.mjs');
const _page2 = () => import('./pages/api/booking/confirm.astro.mjs');
const _page3 = () => import('./pages/api/booking/prebook.astro.mjs');
const _page4 = () => import('./pages/api/checkout/create-payment-intent.astro.mjs');
const _page5 = () => import('./pages/api/hotels/addons.astro.mjs');
const _page6 = () => import('./pages/api/hotels/details.astro.mjs');
const _page7 = () => import('./pages/api/hotels/rates.astro.mjs');
const _page8 = () => import('./pages/api/hotels/search.astro.mjs');
const _page9 = () => import('./pages/booking/confirmation/_bookingid_.astro.mjs');
const _page10 = () => import('./pages/lodging/_hotelid_.astro.mjs');
const _page11 = () => import('./pages/lodging.astro.mjs');
const _page12 = () => import('./pages/index.astro.mjs');

const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/about/index.astro", _page1],
    ["src/pages/api/booking/confirm.ts", _page2],
    ["src/pages/api/booking/prebook.ts", _page3],
    ["src/pages/api/checkout/create-payment-intent.ts", _page4],
    ["src/pages/api/hotels/addons.ts", _page5],
    ["src/pages/api/hotels/details.ts", _page6],
    ["src/pages/api/hotels/rates.ts", _page7],
    ["src/pages/api/hotels/search.ts", _page8],
    ["src/pages/booking/confirmation/[bookingId].astro", _page9],
    ["src/pages/lodging/[hotelId].astro", _page10],
    ["src/pages/lodging/index.astro", _page11],
    ["src/pages/index.astro", _page12]
]);
const serverIslandMap = new Map();
const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "f67dd5c0-e684-4a9f-9811-157f49a2b1b5"
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (_start in serverEntrypointModule) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { __astrojsSsrVirtualEntry as default, pageMap };

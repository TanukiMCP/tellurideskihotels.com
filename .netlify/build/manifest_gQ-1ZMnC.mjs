import '@astrojs/internal-helpers/path';
import 'cookie';
import 'kleur/colors';
import 'es-module-lexer';
import 'html-escaper';
import 'clsx';
import { N as NOOP_MIDDLEWARE_HEADER, g as decodeKey } from './chunks/astro/server_rnaPFH2-.mjs';

const NOOP_MIDDLEWARE_FN = async (_ctx, next) => {
  const response = await next();
  response.headers.set(NOOP_MIDDLEWARE_HEADER, "true");
  return response;
};

const codeToStatusMap = {
  // Implemented from tRPC error code table
  // https://trpc.io/docs/server/error-handling#error-codes
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TIMEOUT: 405,
  CONFLICT: 409,
  PRECONDITION_FAILED: 412,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  UNPROCESSABLE_CONTENT: 422,
  TOO_MANY_REQUESTS: 429,
  CLIENT_CLOSED_REQUEST: 499,
  INTERNAL_SERVER_ERROR: 500
};
Object.entries(codeToStatusMap).reduce(
  // reverse the key-value pairs
  (acc, [key, value]) => ({ ...acc, [value]: key }),
  {}
);

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///C:/Users/ididi/OneDrive/Desktop/tellurideskihotels.com/","adapterName":"@astrojs/netlify","routes":[{"file":"about/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/about","isIndex":true,"type":"page","pattern":"^\\/about\\/?$","segments":[[{"content":"about","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/about/index.astro","pathname":"/about","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"api/booking/confirm","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/booking/confirm","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/booking\\/confirm\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"booking","dynamic":false,"spread":false}],[{"content":"confirm","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/booking/confirm.ts","pathname":"/api/booking/confirm","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"api/booking/prebook","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/booking/prebook","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/booking\\/prebook\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"booking","dynamic":false,"spread":false}],[{"content":"prebook","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/booking/prebook.ts","pathname":"/api/booking/prebook","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"api/checkout/create-payment-intent","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/checkout/create-payment-intent","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/checkout\\/create-payment-intent\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"checkout","dynamic":false,"spread":false}],[{"content":"create-payment-intent","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/checkout/create-payment-intent.ts","pathname":"/api/checkout/create-payment-intent","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"api/hotels/addons","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/hotels/addons","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/hotels\\/addons\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"hotels","dynamic":false,"spread":false}],[{"content":"addons","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/hotels/addons.ts","pathname":"/api/hotels/addons","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"api/hotels/details","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/hotels/details","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/hotels\\/details\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"hotels","dynamic":false,"spread":false}],[{"content":"details","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/hotels/details.ts","pathname":"/api/hotels/details","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"api/hotels/rates","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/hotels/rates","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/hotels\\/rates\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"hotels","dynamic":false,"spread":false}],[{"content":"rates","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/hotels/rates.ts","pathname":"/api/hotels/rates","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"api/hotels/search","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/hotels/search","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/hotels\\/search\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"hotels","dynamic":false,"spread":false}],[{"content":"search","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/hotels/search.ts","pathname":"/api/hotels/search","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image","pattern":"^\\/_image$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/astro/dist/assets/endpoint/generic.js","pathname":"/_image","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/index.XR5rBR3y.css"}],"routeData":{"route":"/booking/confirmation/[bookingid]","isIndex":false,"type":"page","pattern":"^\\/booking\\/confirmation\\/([^/]+?)\\/?$","segments":[[{"content":"booking","dynamic":false,"spread":false}],[{"content":"confirmation","dynamic":false,"spread":false}],[{"content":"bookingId","dynamic":true,"spread":false}]],"params":["bookingId"],"component":"src/pages/booking/confirmation/[bookingId].astro","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/index.XR5rBR3y.css"}],"routeData":{"route":"/lodging/[hotelid]","isIndex":false,"type":"page","pattern":"^\\/lodging\\/([^/]+?)\\/?$","segments":[[{"content":"lodging","dynamic":false,"spread":false}],[{"content":"hotelId","dynamic":true,"spread":false}]],"params":["hotelId"],"component":"src/pages/lodging/[hotelId].astro","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/index.XR5rBR3y.css"}],"routeData":{"route":"/lodging","isIndex":true,"type":"page","pattern":"^\\/lodging\\/?$","segments":[[{"content":"lodging","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/lodging/index.astro","pathname":"/lodging","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}}],"site":"https://tellurideskihotels.com","base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["C:/Users/ididi/OneDrive/Desktop/tellurideskihotels.com/src/pages/about/index.astro",{"propagation":"none","containsHead":true}],["C:/Users/ididi/OneDrive/Desktop/tellurideskihotels.com/src/pages/booking/confirmation/[bookingId].astro",{"propagation":"none","containsHead":true}],["C:/Users/ididi/OneDrive/Desktop/tellurideskihotels.com/src/pages/index.astro",{"propagation":"none","containsHead":true}],["C:/Users/ididi/OneDrive/Desktop/tellurideskihotels.com/src/pages/lodging/[hotelId].astro",{"propagation":"none","containsHead":true}],["C:/Users/ididi/OneDrive/Desktop/tellurideskihotels.com/src/pages/lodging/index.astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(o,t)=>{let i=async()=>{await(await o())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var s=(i,t)=>{let a=async()=>{await(await i())()};if(t.value){let e=matchMedia(t.value);e.matches?a():e.addEventListener(\"change\",a,{once:!0})}};(self.Astro||(self.Astro={})).media=s;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var l=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let a of e)if(a.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=l;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000noop-middleware":"_noop-middleware.mjs","\u0000@astro-page:node_modules/astro/dist/assets/endpoint/generic@_@js":"pages/_image.astro.mjs","\u0000@astro-page:src/pages/about/index@_@astro":"pages/about.astro.mjs","\u0000@astro-page:src/pages/api/booking/confirm@_@ts":"pages/api/booking/confirm.astro.mjs","\u0000@astro-page:src/pages/api/booking/prebook@_@ts":"pages/api/booking/prebook.astro.mjs","\u0000@astro-page:src/pages/api/checkout/create-payment-intent@_@ts":"pages/api/checkout/create-payment-intent.astro.mjs","\u0000@astro-page:src/pages/api/hotels/addons@_@ts":"pages/api/hotels/addons.astro.mjs","\u0000@astro-page:src/pages/api/hotels/details@_@ts":"pages/api/hotels/details.astro.mjs","\u0000@astro-page:src/pages/api/hotels/rates@_@ts":"pages/api/hotels/rates.astro.mjs","\u0000@astro-page:src/pages/api/hotels/search@_@ts":"pages/api/hotels/search.astro.mjs","\u0000@astro-page:src/pages/booking/confirmation/[bookingId]@_@astro":"pages/booking/confirmation/_bookingid_.astro.mjs","\u0000@astro-page:src/pages/lodging/[hotelId]@_@astro":"pages/lodging/_hotelid_.astro.mjs","\u0000@astro-page:src/pages/lodging/index@_@astro":"pages/lodging.astro.mjs","\u0000@astro-page:src/pages/index@_@astro":"pages/index.astro.mjs","\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000@astrojs-ssr-adapter":"_@astrojs-ssr-adapter.mjs","\u0000@astrojs-manifest":"manifest_gQ-1ZMnC.mjs","C:/Users/ididi/OneDrive/Desktop/tellurideskihotels.com/src/lib/liteapi/hotels.ts":"chunks/hotels_C0FYiV_O.mjs","C:/Users/ididi/OneDrive/Desktop/tellurideskihotels.com/src/lib/liteapi/rates.ts":"chunks/rates_VMhhcuFS.mjs","@/components/checkout/BookingConfirmation":"_astro/BookingConfirmation.Cm3PcN6K.js","@/components/lodging/HotelDetailView":"_astro/HotelDetailView.BGuhXJev.js","@/components/lodging/HotelSearchWidget":"_astro/HotelSearchWidget.DRFf7mc7.js","@/components/lodging/HotelGrid":"_astro/HotelGrid.t_S7Md-2.js","@/components/lodging/FeaturedHotels":"_astro/FeaturedHotels.Cfk42jkY.js","@/components/lodging/HotelSearchBar":"_astro/HotelSearchBar.BeFzFN6e.js","@astrojs/react/client.js":"_astro/client.Hk-DGNJf.js","C:/Users/ididi/OneDrive/Desktop/tellurideskihotels.com/node_modules/@stripe/stripe-js/lib/index.mjs":"_astro/index.BHcaG5bQ.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[],"assets":["/_astro/index.XR5rBR3y.css","/robots.txt","/site.webmanifest","/images/image-library.json","/images/placeholder-hotel.jpg","/_astro/BookingConfirmation.Cm3PcN6K.js","/_astro/Card.bvXEUR69.js","/_astro/client.Hk-DGNJf.js","/_astro/createLucideIcon.DpU1ZAOW.js","/_astro/FeaturedHotels.Cfk42jkY.js","/_astro/format.UtslkhBc.js","/_astro/HotelCard.CpiogBj4.js","/_astro/HotelDetailView.BGuhXJev.js","/_astro/HotelGrid.t_S7Md-2.js","/_astro/HotelSearchBar.BeFzFN6e.js","/_astro/HotelSearchWidget.DRFf7mc7.js","/_astro/index.BHcaG5bQ.js","/_astro/index.CZlPm10g.js","/_astro/Input.gg-tBUki.js","/_astro/utils.BXblbDr7.js","/about/index.html","/api/booking/confirm","/api/booking/prebook","/api/checkout/create-payment-intent","/api/hotels/addons","/api/hotels/details","/api/hotels/rates","/api/hotels/search","/index.html"],"buildFormat":"directory","checkOrigin":false,"serverIslandNameMap":[],"key":"O4Q3cpIPTEJ0a8j9Tyr9Snw1u51FTNndciJizlUNbrQ=","experimentalEnvGetSecretEnabled":false});

export { manifest };

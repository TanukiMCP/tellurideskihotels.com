import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { a as getHotelMainImage, f as formatHotelAddress, B as Badge } from './utils_DFxkETgf.mjs';
import { B as Button } from './Button_Bs4Cal8d.mjs';
import { C as Card, c as CardContent } from './Card_CsHJIv-j.mjs';
import { Star, MapPin, Calendar, Users, Search } from 'lucide-react';
import { f as formatCurrency } from './utils_Brf6JqFr.mjs';
import { g as getRatingColor } from './PageLayout_DgHuiZBJ.mjs';
import { format, addDays } from 'date-fns';
import { useRef, useState, useEffect, useCallback } from 'react';
import Map, { NavigationControl, Marker, Popup } from 'react-map-gl/mapbox';
import { f as formatMapPrice, T as TELLURIDE_CENTER, c as calculateBounds, M as MAX_BOUNDS_ZOOM, a as MAP_PADDING, g as getHotelMarkerColor, b as getMarkerSize, d as getIconSize, e as MAPBOX_TOKEN } from './mapbox-utils_CzCgfd-A.mjs';
/* empty css                         */
import { I as Input } from './Input_AH10ORng.mjs';

function HotelCard({
  hotel,
  minPrice,
  currency = "USD",
  nights: _nights = 1,
  checkInDate,
  onSelect,
  isSelected = false,
  isHovered = false,
  onMouseEnter,
  onMouseLeave
}) {
  const imageUrl = getHotelMainImage(hotel);
  const address = formatHotelAddress(hotel);
  const rating = hotel.review_score || 0;
  const ratingColor = getRatingColor(rating);
  return /* @__PURE__ */ jsxs(
    Card,
    {
      className: `overflow-hidden hover:shadow-card-hover transition-all duration-300 group ${isSelected ? "ring-2 ring-primary-600 shadow-card-hover" : ""} ${isHovered ? "shadow-card-hover" : ""}`,
      onMouseEnter,
      onMouseLeave,
      children: [
        /* @__PURE__ */ jsxs(
          "div",
          {
            className: "relative h-56 overflow-hidden cursor-pointer",
            onClick: () => onSelect(hotel.hotel_id),
            children: [
              imageUrl ? /* @__PURE__ */ jsx(
                "img",
                {
                  src: imageUrl,
                  alt: hotel.name || "Hotel",
                  className: "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",
                  loading: "lazy"
                }
              ) : /* @__PURE__ */ jsx("div", { className: "w-full h-full bg-gray-100 flex items-center justify-center", children: /* @__PURE__ */ jsx("p", { className: "text-gray-500 text-sm font-medium", children: "This hotel has no images provided" }) }),
              hotel.star_rating && /* @__PURE__ */ jsx("div", { className: "absolute top-3 left-3", children: /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "bg-white/95 backdrop-blur-sm text-neutral-800 border-0 shadow-sm", children: [
                /* @__PURE__ */ jsx(Star, { className: "h-3 w-3 mr-1 fill-accent-500 text-accent-500" }),
                /* @__PURE__ */ jsx("span", { className: "font-semibold", children: hotel.star_rating })
              ] }) }),
              rating > 0 && /* @__PURE__ */ jsx("div", { className: `absolute top-3 right-3 ${ratingColor.bg} ${ratingColor.text} backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm font-bold shadow-sm`, children: rating.toFixed(1) })
            ]
          }
        ),
        /* @__PURE__ */ jsxs(CardContent, { className: "p-5", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-xl mb-2 line-clamp-1 text-neutral-900", children: hotel.name }),
          address && /* @__PURE__ */ jsxs("div", { className: "flex items-start text-sm text-neutral-600 mb-3", children: [
            /* @__PURE__ */ jsx(MapPin, { className: "h-4 w-4 mr-1.5 flex-shrink-0 mt-0.5" }),
            /* @__PURE__ */ jsx("span", { className: "line-clamp-2", children: address })
          ] }),
          hotel.review_count && rating > 0 && /* @__PURE__ */ jsxs("p", { className: "text-sm text-neutral-600 mb-4", children: [
            /* @__PURE__ */ jsx("span", { className: "font-semibold", children: hotel.review_count.toLocaleString() }),
            " review",
            hotel.review_count !== 1 ? "s" : ""
          ] }),
          minPrice !== void 0 && minPrice > 0 ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("div", { className: "mb-4 pb-4 border-b border-neutral-200", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
              checkInDate && /* @__PURE__ */ jsxs("span", { className: "text-xs text-neutral-500 mb-1", children: [
                "Next available: ",
                format(new Date(checkInDate), "MMM d")
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-xs text-neutral-500 uppercase tracking-wide mb-1", children: "From" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-1", children: [
                /* @__PURE__ */ jsx("span", { className: "text-2xl font-bold text-primary-600", children: formatCurrency(minPrice, currency) }),
                /* @__PURE__ */ jsx("span", { className: "text-sm text-neutral-600", children: "/ night" })
              ] })
            ] }) }),
            /* @__PURE__ */ jsx(
              Button,
              {
                onClick: (e) => {
                  e.stopPropagation();
                  onSelect(hotel.hotel_id);
                },
                className: "w-full",
                variant: "primary",
                children: "View Details & Book"
              }
            )
          ] }) : /* @__PURE__ */ jsx(
            Button,
            {
              onClick: (e) => {
                e.stopPropagation();
                onSelect(hotel.hotel_id);
              },
              className: "w-full",
              variant: "primary",
              children: "View Details & Check Rates"
            }
          )
        ] })
      ]
    }
  );
}

function HotelMapPopup({
  hotel,
  minPrice = 0,
  currency = "USD",
  checkInDate,
  onViewDetails
}) {
  const primaryImage = hotel.images?.[0]?.url;
  if (!primaryImage) {
    return /* @__PURE__ */ jsxs("div", { className: "min-w-[200px] p-3", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-neutral-900 mb-2", children: hotel.name }),
      formatHotelAddress(hotel) && /* @__PURE__ */ jsx("p", { className: "text-sm text-neutral-600 mb-3", children: formatHotelAddress(hotel) }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: onViewDetails,
          className: "w-full bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors",
          children: "View Details"
        }
      )
    ] });
  }
  const priceDisplay = minPrice > 0 ? formatMapPrice(minPrice, currency) : "View Rates";
  return /* @__PURE__ */ jsxs("div", { className: "min-w-[280px] max-w-[320px]", children: [
    /* @__PURE__ */ jsxs("div", { className: "relative w-full h-[160px] -mx-5 -mt-3 mb-3 overflow-hidden", children: [
      /* @__PURE__ */ jsx(
        "img",
        {
          src: primaryImage,
          alt: hotel.name,
          className: "w-full h-full object-cover",
          loading: "lazy"
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "absolute top-2 right-2 bg-white px-2.5 py-1.5 rounded-md shadow-md", children: [
        checkInDate && minPrice > 0 && /* @__PURE__ */ jsxs("div", { className: "text-[10px] text-gray-600 mb-0.5", children: [
          "Next: ",
          new Date(checkInDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "font-semibold text-sm text-primary-600", children: priceDisplay })
      ] }),
      hotel.star_rating && hotel.star_rating > 0 && /* @__PURE__ */ jsx("div", { className: "absolute top-2 left-2 bg-white px-2 py-1 rounded-md shadow-md", children: /* @__PURE__ */ jsx("div", { className: "flex gap-0.5", children: Array.from({ length: 5 }).map((_, i) => /* @__PURE__ */ jsx(
        "span",
        {
          className: i < hotel.star_rating ? "text-accent-500" : "text-gray-300",
          style: { fontSize: "12px" },
          children: "★"
        },
        i
      )) }) })
    ] }),
    /* @__PURE__ */ jsx("h3", { className: "text-base font-semibold text-neutral-900 mb-2 line-clamp-2", children: hotel.name }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-1.5 mb-2", children: [
      /* @__PURE__ */ jsxs("svg", { className: "w-3.5 h-3.5 text-gray-500 mt-0.5 flex-shrink-0", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: [
        /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" }),
        /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 11a3 3 0 11-6 0 3 3 0 016 0z" })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-600 line-clamp-1", children: hotel.address?.city || hotel.address?.line1 || "Telluride, CO" })
    ] }),
    hotel.review_score && hotel.review_score > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 mb-3", children: [
      /* @__PURE__ */ jsx("span", { className: "bg-primary-600 text-white px-1.5 py-0.5 rounded text-xs font-semibold", children: hotel.review_score.toFixed(1) }),
      /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-600", children: hotel.review_count ? `${hotel.review_count} reviews` : "Guest rating" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "pt-3 border-t border-gray-200", children: /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: onViewDetails,
        className: "w-full inline-flex items-center justify-center gap-1.5 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors",
        children: [
          "View Hotel Details",
          /* @__PURE__ */ jsx("svg", { className: "w-3.5 h-3.5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" }) })
        ]
      }
    ) })
  ] });
}

const MAP_STYLES = {
  streets: "mapbox://styles/mapbox/streets-v12",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  terrain: "mapbox://styles/mapbox/outdoors-v12",
  ski: "mapbox://styles/mapbox/outdoors-v12"
  // Outdoors style has ski trails built-in
};
function LodgingMap({
  hotels,
  height = "100%",
  selectedHotelId = null,
  hoveredHotelId = null,
  onHotelClick,
  onHotelHover,
  onViewDetails,
  className = "",
  minPrices = {},
  currency = "USD",
  checkInDate
}) {
  const mapRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMapActive, setIsMapActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [popupHotel, setPopupHotel] = useState(null);
  const [showSkiTrails, setShowSkiTrails] = useState(false);
  const [trailOpacity, setTrailOpacity] = useState(0.8);
  const [viewState, setViewState] = useState({
    longitude: TELLURIDE_CENTER[0],
    latitude: TELLURIDE_CENTER[1],
    zoom: 13
  });
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  useEffect(() => {
    if (!mapRef.current || hotels.length === 0 || isLoading) return;
    const coordinates = hotels.filter(
      (h) => h.location?.latitude !== void 0 && h.location?.longitude !== void 0
    ).map((h) => ({ lng: h.location.longitude, lat: h.location.latitude }));
    if (coordinates.length === 0) return;
    const bounds = calculateBounds(coordinates);
    if (!bounds) return;
    setTimeout(() => {
      if (coordinates.length === 1) {
        mapRef.current?.flyTo({
          center: [coordinates[0].lng, coordinates[0].lat],
          zoom: 13,
          duration: 1e3
        });
      } else {
        mapRef.current?.fitBounds(bounds, {
          padding: MAP_PADDING,
          maxZoom: MAX_BOUNDS_ZOOM,
          duration: 1e3
        });
      }
    }, 100);
  }, [hotels, isLoading]);
  useEffect(() => {
    if (!selectedHotelId || !mapRef.current) {
      setPopupHotel(null);
      return;
    }
    const hotel = hotels.find((h) => h.hotel_id === selectedHotelId);
    if (hotel && hotel.location?.latitude && hotel.location?.longitude) {
      setPopupHotel(hotel);
      mapRef.current.flyTo({
        center: [hotel.location.longitude, hotel.location.latitude],
        zoom: Math.max(mapRef.current.getZoom(), 13),
        duration: 800
      });
    }
  }, [selectedHotelId, hotels]);
  const handleMarkerClick = useCallback((hotel) => {
    if (onHotelClick) {
      onHotelClick(hotel.hotel_id);
    }
    setPopupHotel(hotel);
  }, [onHotelClick]);
  const handleMarkerMouseEnter = useCallback((hotelId) => {
    if (onHotelHover) {
      onHotelHover(hotelId);
    }
  }, [onHotelHover]);
  const handleMarkerMouseLeave = useCallback(() => {
    if (onHotelHover) {
      onHotelHover(null);
    }
  }, [onHotelHover]);
  const handlePopupClose = useCallback(() => {
    setPopupHotel(null);
    if (onHotelClick) {
      onHotelClick("");
    }
  }, [onHotelClick]);
  const handleViewDetails = useCallback(() => {
    if (popupHotel) {
      if (onViewDetails) {
        onViewDetails(popupHotel.hotel_id);
      } else if (onHotelClick) {
        onHotelClick(popupHotel.hotel_id);
      }
    }
  }, [popupHotel, onViewDetails, onHotelClick]);
  const handleMapClick = useCallback(() => {
    if (isMobile && !isMapActive) {
      setIsMapActive(true);
    }
  }, [isMobile, isMapActive]);
  const handleDeactivate = useCallback(() => {
    if (isMobile && isMapActive) {
      setIsMapActive(false);
    }
  }, [isMobile, isMapActive]);
  const handleMapLoad = useCallback(() => {
    setIsLoading(false);
  }, []);
  useEffect(() => {
    if (!mapRef.current || isLoading) return;
    const map = mapRef.current.getMap();
    if (showSkiTrails) {
      try {
        const style = map.getStyle();
        if (!style || !style.layers) return;
        const pisteLayerIds = style.layers.filter(
          (layer) => layer.id.includes("piste") || layer.id.includes("aerialway") || layer.source === "composite" && layer["source-layer"] === "landuse"
        ).map((layer) => layer.id);
        console.log("Found piste layers:", pisteLayerIds);
        pisteLayerIds.forEach((layerId) => {
          if (layerId.includes("piste")) {
            try {
              if (map.getLayer(layerId)) {
                map.setPaintProperty(layerId, "line-width", [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  12,
                  2,
                  16,
                  6
                ]);
                map.setPaintProperty(layerId, "line-opacity", trailOpacity);
                const currentColor = map.getPaintProperty(layerId, "line-color");
                if (!currentColor || currentColor === "#808080") {
                  map.setPaintProperty(layerId, "line-color", [
                    "match",
                    ["get", "piste:difficulty"],
                    "novice",
                    "#22c55e",
                    "easy",
                    "#22c55e",
                    "intermediate",
                    "#3b82f6",
                    "advanced",
                    "#000000",
                    "expert",
                    "#dc2626",
                    "freeride",
                    "#dc2626",
                    "#3b82f6"
                    // default blue
                  ]);
                }
              }
            } catch (e) {
              console.log("Could not style layer:", layerId, e);
            }
          }
          if (layerId.includes("aerialway")) {
            try {
              if (map.getLayer(layerId)) {
                map.setPaintProperty(layerId, "line-width", 2.5);
                map.setPaintProperty(layerId, "line-color", "#f59e0b");
                map.setPaintProperty(layerId, "line-opacity", trailOpacity);
              }
            } catch (e) {
              console.log("Could not style aerialway:", layerId, e);
            }
          }
        });
      } catch (error) {
        console.error("Failed to enhance ski trail layers:", error);
      }
    } else {
      try {
        const style = map.getStyle();
        if (!style || !style.layers) return;
        style.layers.forEach((layer) => {
          if (layer.id.includes("piste") || layer.id.includes("aerialway")) {
            try {
              if (map.getLayer(layer.id)) {
                if (layer.id.includes("piste")) {
                  map.setPaintProperty(layer.id, "line-opacity", 0.3);
                  map.setPaintProperty(layer.id, "line-width", 1);
                }
                if (layer.id.includes("aerialway")) {
                  map.setPaintProperty(layer.id, "line-opacity", 0.3);
                }
              }
            } catch (e) {
            }
          }
        });
      } catch (error) {
        console.error("Failed to reset trail layers:", error);
      }
    }
  }, [showSkiTrails, isLoading, trailOpacity]);
  if (hotels.length === 0) {
    return /* @__PURE__ */ jsx(
      "div",
      {
        className: `rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center ${className}`,
        style: { height },
        children: /* @__PURE__ */ jsxs("div", { className: "text-center p-6", children: [
          /* @__PURE__ */ jsx("svg", { className: "w-12 h-12 text-gray-400 mx-auto mb-3", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" }) }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-900", children: "No hotels to display" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Search for hotels to see them on the map" })
        ] })
      }
    );
  }
  try {
    return /* @__PURE__ */ jsxs("div", { className: `relative ${className}`, style: { height }, children: [
      isLoading && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center z-[999]", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-3" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: "Loading map..." })
      ] }) }),
      isMobile && !isMapActive && !isLoading && /* @__PURE__ */ jsx(
        "div",
        {
          className: "absolute inset-0 bg-black/5 backdrop-blur-[2px] rounded-lg z-[998] flex items-center justify-center cursor-pointer",
          onClick: handleMapClick,
          children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-xl px-6 py-4 flex items-center gap-3 max-w-[280px] mx-4", children: [
            /* @__PURE__ */ jsx("svg", { className: "w-6 h-6 text-primary-600 flex-shrink-0", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" }) }),
            /* @__PURE__ */ jsxs("div", { className: "text-left", children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-gray-900", children: "Tap to Activate Map" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-600", children: "Pinch to zoom, drag to explore" })
            ] })
          ] })
        }
      ),
      /* @__PURE__ */ jsxs(
        Map,
        {
          ref: mapRef,
          ...viewState,
          onMove: (evt) => setViewState(evt.viewState),
          mapboxAccessToken: MAPBOX_TOKEN,
          mapStyle: showSkiTrails ? MAP_STYLES.terrain : MAP_STYLES.streets,
          style: { width: "100%", height: "100%", borderRadius: "0.75rem" },
          onLoad: handleMapLoad,
          scrollZoom: !isMobile || isMapActive,
          dragPan: !isMobile || isMapActive,
          dragRotate: false,
          pitchWithRotate: false,
          touchZoomRotate: isMobile && isMapActive,
          doubleClickZoom: true,
          children: [
            /* @__PURE__ */ jsx(NavigationControl, { position: "top-right", showCompass: false }),
            /* @__PURE__ */ jsxs("div", { className: "absolute top-2 left-2 z-[500] flex flex-col gap-2", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setShowSkiTrails(!showSkiTrails),
                  className: `bg-white hover:bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 shadow-lg flex items-center gap-2 transition-all ${showSkiTrails ? "ring-2 ring-primary-500 bg-primary-50" : ""}`,
                  title: showSkiTrails ? "Hide ski trails" : "Show ski trails",
                  children: [
                    /* @__PURE__ */ jsx("svg", { className: "w-4 h-4 flex-shrink-0", style: { color: showSkiTrails ? "#4A7C59" : "#6b7280" }, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" }) }),
                    /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold whitespace-nowrap", style: { color: showSkiTrails ? "#4A7C59" : "#374151" }, children: showSkiTrails ? "Ski Trails ON" : "Show Ski Trails" })
                  ]
                }
              ),
              showSkiTrails && /* @__PURE__ */ jsx("div", { className: "bg-white border border-gray-300 rounded-lg p-2.5 shadow-lg", children: /* @__PURE__ */ jsxs("label", { className: "block", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-1.5", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-gray-700 uppercase tracking-wide", children: "Trail Visibility" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-primary-600 font-bold", children: [
                    Math.round(trailOpacity * 100),
                    "%"
                  ] })
                ] }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "range",
                    min: "0.3",
                    max: "1",
                    step: "0.1",
                    value: trailOpacity,
                    onChange: (e) => setTrailOpacity(parseFloat(e.target.value)),
                    className: "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600",
                    style: { width: "160px" }
                  }
                )
              ] }) })
            ] }),
            hotels.map((hotel) => {
              if (!hotel.location?.latitude || !hotel.location?.longitude) return null;
              const isSelected = hotel.hotel_id === selectedHotelId;
              const isHovered = hotel.hotel_id === hoveredHotelId;
              const state = isSelected ? "selected" : isHovered ? "hover" : "default";
              const color = getHotelMarkerColor(state);
              const size = getMarkerSize(state);
              return /* @__PURE__ */ jsx(
                Marker,
                {
                  longitude: hotel.location.longitude,
                  latitude: hotel.location.latitude,
                  anchor: "center",
                  children: /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: "cursor-pointer transition-all duration-200",
                      onClick: () => handleMarkerClick(hotel),
                      onMouseEnter: () => handleMarkerMouseEnter(hotel.hotel_id),
                      onMouseLeave: handleMarkerMouseLeave,
                      style: {
                        backgroundColor: color,
                        width: `${size}px`,
                        height: `${size}px`,
                        borderRadius: "50%",
                        border: "2px solid white",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: isSelected ? 1e3 : isHovered ? 900 : 500
                      },
                      children: /* @__PURE__ */ jsx(
                        "svg",
                        {
                          style: { width: `${getIconSize(size)}px`, height: `${getIconSize(size)}px`, color: "white" },
                          fill: "none",
                          viewBox: "0 0 24 24",
                          stroke: "currentColor",
                          strokeWidth: 2.5,
                          children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" })
                        }
                      )
                    }
                  )
                },
                hotel.hotel_id
              );
            }),
            popupHotel && popupHotel.location?.latitude && popupHotel.location?.longitude && /* @__PURE__ */ jsx(
              Popup,
              {
                longitude: popupHotel.location.longitude,
                latitude: popupHotel.location.latitude,
                anchor: "left",
                onClose: handlePopupClose,
                closeButton: true,
                closeOnClick: false,
                maxWidth: "320px",
                offset: 20,
                className: "hotel-map-popup",
                children: /* @__PURE__ */ jsx(
                  HotelMapPopup,
                  {
                    hotel: popupHotel,
                    minPrice: minPrices[popupHotel.hotel_id],
                    currency,
                    checkInDate,
                    onViewDetails: handleViewDetails
                  }
                )
              }
            )
          ]
        }
      ),
      !isLoading && hotels.length > 0 && /* @__PURE__ */ jsx("div", { className: "absolute top-2 right-14 bg-white rounded-lg shadow-md px-2.5 py-1.5 z-[500] pointer-events-none", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx("svg", { className: "w-3.5 h-3.5 text-primary-600", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" }) }),
        /* @__PURE__ */ jsxs("span", { className: "text-xs font-semibold text-gray-900", children: [
          hotels.length,
          " ",
          hotels.length === 1 ? "Hotel" : "Hotels"
        ] })
      ] }) }),
      isMobile && isMapActive && /* @__PURE__ */ jsx("div", { className: "absolute top-4 right-4 z-[1000]", children: /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: handleDeactivate,
          className: "bg-primary-600 text-white px-4 py-2 rounded-lg shadow-lg font-semibold text-sm hover:bg-primary-700 transition-colors flex items-center gap-2",
          children: [
            /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }),
            "Done"
          ]
        }
      ) }),
      /* @__PURE__ */ jsx("style", { children: `
        .hotel-map-popup .mapboxgl-popup-content {
          padding: 12px 20px;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }
        .hotel-map-popup .mapboxgl-popup-close-button {
          font-size: 20px;
          padding: 8px;
          color: #64748b;
          right: 8px;
          top: 8px;
        }
        .hotel-map-popup .mapboxgl-popup-close-button:hover {
          background-color: #f1f5f9;
          border-radius: 4px;
        }
        .hotel-map-popup .mapboxgl-popup-tip {
          border-top-color: white;
        }
      ` })
    ] });
  } catch (error) {
    console.error("LodgingMap component error:", error);
    return /* @__PURE__ */ jsx(
      "div",
      {
        className: `rounded-lg border-2 border-red-200 bg-red-50 flex items-center justify-center ${className}`,
        style: { height },
        children: /* @__PURE__ */ jsxs("div", { className: "text-center p-6", children: [
          /* @__PURE__ */ jsx("svg", { className: "w-12 h-12 text-red-400 mx-auto mb-3", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" }) }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-red-900", children: "Map temporarily unavailable" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-red-600 mt-1", children: "Please refresh the page to try again" })
        ] })
      }
    );
  }
}

function HotelSearchWidget({
  initialLocation = "Telluride",
  initialDates,
  initialGuests = { adults: 2, children: 0 }
}) {
  const [checkIn, setCheckIn] = useState(
    initialDates?.checkIn ? format(initialDates.checkIn, "yyyy-MM-dd") : format(addDays(/* @__PURE__ */ new Date(), 7), "yyyy-MM-dd")
  );
  const [checkOut, setCheckOut] = useState(
    initialDates?.checkOut ? format(initialDates.checkOut, "yyyy-MM-dd") : format(addDays(/* @__PURE__ */ new Date(), 14), "yyyy-MM-dd")
  );
  const [adults, setAdults] = useState(initialGuests.adults.toString());
  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams({
      location: initialLocation,
      checkIn,
      checkOut,
      adults
    });
    if (typeof window !== "undefined") {
      window.location.href = `/lodging?${params.toString()}`;
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "bg-white rounded-2xl shadow-elevated p-6 lg:p-8", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "checkIn", className: "block text-sm font-medium text-neutral-700 mb-2", children: "Check-in" }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(Calendar, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "checkIn",
              type: "date",
              value: checkIn,
              onChange: (e) => setCheckIn(e.target.value),
              min: format(/* @__PURE__ */ new Date(), "yyyy-MM-dd"),
              className: "pl-11 h-12",
              required: true
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "checkOut", className: "block text-sm font-medium text-neutral-700 mb-2", children: "Check-out" }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(Calendar, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "checkOut",
              type: "date",
              value: checkOut,
              onChange: (e) => setCheckOut(e.target.value),
              min: checkIn,
              className: "pl-11 h-12",
              required: true
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "adults", className: "block text-sm font-medium text-neutral-700 mb-2", children: "Guests" }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(Users, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "adults",
              type: "number",
              value: adults,
              onChange: (e) => setAdults(e.target.value),
              min: "1",
              max: "10",
              className: "pl-11 h-12",
              required: true
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(
      Button,
      {
        type: "submit",
        size: "lg",
        className: "w-full",
        children: [
          /* @__PURE__ */ jsx(Search, { className: "mr-2 h-5 w-5" }),
          "Search Hotels"
        ]
      }
    )
  ] }) });
}

export { HotelCard as H, LodgingMap as L, HotelSearchWidget as a };

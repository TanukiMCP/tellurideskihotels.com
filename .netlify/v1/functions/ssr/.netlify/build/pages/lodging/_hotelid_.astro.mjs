import { c as createAstro, a as createComponent, d as renderComponent, r as renderTemplate, m as maybeRenderHead, F as Fragment$1 } from '../../chunks/astro/server_DIEPIpiA.mjs';
import 'kleur/colors';
import 'html-escaper';
import { g as getRatingColor, $ as $$PageLayout, a as $$Container } from '../../chunks/PageLayout_DgHuiZBJ.mjs';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { useState, useEffect, useMemo } from 'react';
import { C as Card, a as CardHeader, b as CardTitle, c as CardContent } from '../../chunks/Card_CsHJIv-j.mjs';
import { B as Badge, g as getHotelImages, f as formatHotelAddress } from '../../chunks/utils_DFxkETgf.mjs';
import { L as LoadingSpinner } from '../../chunks/LoadingSpinner_DCr4c4zF.mjs';
import * as LucideIcons from 'lucide-react';
import { Calendar, Users, AlertCircle, Bed, Check, Star, User, ThumbsUp, ThumbsDown, MapPin } from 'lucide-react';
import { B as Button } from '../../chunks/Button_Bs4Cal8d.mjs';
import { a as calculateNights, f as formatCurrency } from '../../chunks/utils_Brf6JqFr.mjs';
import { format } from 'date-fns';
import { I as Input } from '../../chunks/Input_AH10ORng.mjs';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { $ as $$Breadcrumbs } from '../../chunks/Breadcrumbs_DBm_rmGH.mjs';
import { g as getHotelDetails } from '../../chunks/hotels_Bo4Pfpjr.mjs';
export { renderers } from '../../renderers.mjs';

function ImageWithLoading({ src, alt, className, onError }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [src]);
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn(`[ImageWithLoading] Image failed to load within timeout: ${src}`);
        setLoading(false);
        setError(true);
        onError?.();
      }
    }, 1e4);
    return () => clearTimeout(timeout);
  }, [loading, src, onError]);
  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };
  const handleError = () => {
    console.error(`[ImageWithLoading] Image failed to load: ${src}`);
    setLoading(false);
    setError(true);
    onError?.();
  };
  if (!src || src.trim() === "") {
    return /* @__PURE__ */ jsx("div", { className: `flex flex-col items-center justify-center bg-gray-100 ${className}`, children: /* @__PURE__ */ jsx("p", { className: "text-gray-500 text-sm font-medium", children: "This hotel has no images provided" }) });
  }
  if (error) {
    return /* @__PURE__ */ jsx("div", { className: `flex flex-col items-center justify-center bg-gray-100 ${className}`, children: /* @__PURE__ */ jsx("p", { className: "text-gray-500 text-sm font-medium", children: "This hotel has no images provided" }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: `relative ${className}`, children: [
    loading && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-gray-100", children: /* @__PURE__ */ jsx(LoadingSpinner, { size: "sm" }) }),
    /* @__PURE__ */ jsx(
      "img",
      {
        src,
        alt,
        className: `${className} ${loading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`,
        onLoad: handleLoad,
        onError: handleError,
        loading: "lazy"
      }
    )
  ] });
}

function RoomSelectorCard({
  hotelId,
  initialCheckIn,
  initialCheckOut,
  initialAdults,
  initialChildren = 0,
  initialRooms = 1,
  onBookingReady
}) {
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [adults, setAdults] = useState(initialAdults);
  const [children, setChildren] = useState(initialChildren);
  const [roomCount, setRoomCount] = useState(initialRooms);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [selectedRateId, setSelectedRateId] = useState("");
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const nights = calculateNights(checkIn, checkOut);
  useEffect(() => {
    if (!hotelId || !checkIn || !checkOut) {
      console.warn("[RoomSelector] Missing required params:", {
        hotelId: !!hotelId,
        checkIn: !!checkIn,
        checkOut: !!checkOut
      });
      setLoading(false);
      setError("Missing required booking information");
      return;
    }
    async function fetchRates() {
      setLoading(true);
      setError(null);
      setNeedsRefresh(false);
      try {
        const params = new URLSearchParams({
          hotelId,
          checkIn,
          checkOut,
          adults: adults.toString(),
          children: children.toString(),
          rooms: roomCount.toString()
        });
        console.log("[RoomSelector] Fetching rates from:", `/api/hotels/rates?${params.toString()}`);
        console.log("[RoomSelector] Request params:", { hotelId, checkIn, checkOut, adults, children });
        const response = await fetch(`/api/hotels/rates?${params.toString()}`);
        console.log("[RoomSelector] Response status:", response.status, response.statusText);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("[RoomSelector] Error response:", errorData);
          throw new Error(errorData.error || "Failed to fetch rates");
        }
        const data = await response.json();
        console.log("[RoomSelector] Rate response:");
        console.log("  - hasRates:", !!data.rates);
        console.log("  - ratesCount:", data.rates?.length || 0);
        console.log("  - sampleRate:", JSON.stringify(data.rates?.[0], null, 2));
        console.log("  - fullData:", JSON.stringify(data, null, 2));
        const rates = data.rates || [];
        const roomMap = /* @__PURE__ */ new Map();
        const roomNameCounts = /* @__PURE__ */ new Map();
        const seenRoomIds = /* @__PURE__ */ new Set();
        rates.forEach((rate) => {
          const roomId = rate.room_id;
          if (!seenRoomIds.has(roomId)) {
            seenRoomIds.add(roomId);
            const baseRoomName = rate.room_name || "Standard Room";
            roomNameCounts.set(baseRoomName, (roomNameCounts.get(baseRoomName) || 0) + 1);
          }
        });
        const roomNameUsage = /* @__PURE__ */ new Map();
        rates.forEach((rate) => {
          const roomId = rate.room_id;
          if (!roomMap.has(roomId)) {
            const baseRoomName = rate.room_name || "Standard Room";
            const totalCount = roomNameCounts.get(baseRoomName) || 1;
            const currentUsage = roomNameUsage.get(baseRoomName) || 0;
            roomNameUsage.set(baseRoomName, currentUsage + 1);
            const uniqueRoomName = totalCount > 1 ? `${baseRoomName} (${currentUsage + 1})` : baseRoomName;
            roomMap.set(roomId, {
              roomId,
              roomName: uniqueRoomName,
              rates: []
            });
          }
          roomMap.get(roomId).rates.push(rate);
        });
        const roomOptions2 = Array.from(roomMap.values());
        console.log("[RoomSelector] Processed rooms:", {
          totalRooms: roomOptions2.length,
          sampleRoom: roomOptions2[0]
        });
        setRooms(roomOptions2);
        if (roomOptions2.length > 0) {
          setSelectedRoomId(roomOptions2[0].roomId);
          if (roomOptions2[0].rates.length > 0) {
            setSelectedRateId(roomOptions2[0].rates[0].rate_id);
          }
        }
      } catch (err) {
        console.error("[RoomSelector] Error fetching rates:", err);
        setError(err instanceof Error ? err.message : "Unable to load room availability");
      } finally {
        setLoading(false);
      }
    }
    if (hotelId && checkIn && checkOut) {
      fetchRates();
    }
  }, [hotelId, checkIn, checkOut, adults, children, roomCount]);
  const roomOptions = useMemo(() => {
    return rooms.map((room) => ({
      value: room.roomId,
      label: room.roomName
    }));
  }, [rooms]);
  const rateOptions = useMemo(() => {
    const selectedRoom = rooms.find((r) => r.roomId === selectedRoomId);
    if (!selectedRoom) return [];
    return selectedRoom.rates.map((rate) => ({
      value: rate.rate_id,
      label: rate.board_type || "Room Only",
      rate
    }));
  }, [rooms, selectedRoomId]);
  const selectedRate = useMemo(() => {
    const rateOption = rateOptions.find((r) => r.value === selectedRateId);
    return rateOption?.rate;
  }, [rateOptions, selectedRateId]);
  const hasChanges = useMemo(() => {
    return checkIn !== initialCheckIn || checkOut !== initialCheckOut || adults !== initialAdults || children !== initialChildren;
  }, [checkIn, checkOut, adults, children, initialCheckIn, initialCheckOut, initialAdults, initialChildren]);
  const handleSearch = () => {
    setNeedsRefresh(true);
  };
  const handleBookNow = () => {
    if (!selectedRate || !selectedRoomId) return;
    const selectedRoom = rooms.find((r) => r.roomId === selectedRoomId);
    if (!selectedRoom) return;
    onBookingReady({
      rateId: selectedRateId,
      roomData: selectedRate,
      checkIn,
      checkOut,
      adults,
      children
    });
  };
  const totalPrice = selectedRate?.total?.amount || 0;
  const currency = selectedRate?.total?.currency || "USD";
  const pricePerNight = nights > 0 ? totalPrice / nights : totalPrice;
  return /* @__PURE__ */ jsxs(Card, { className: "shadow-elevated", children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "bg-gradient-to-br from-primary-50 to-white border-b border-primary-100", children: [
      /* @__PURE__ */ jsx(CardTitle, { className: "text-2xl", children: "Select Your Stay" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-neutral-600 mt-1", children: "Customize your dates, guests, and room preferences" })
    ] }),
    /* @__PURE__ */ jsxs(CardContent, { className: "p-6 space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("label", { className: "block text-sm font-semibold text-neutral-700 mb-2", children: [
            /* @__PURE__ */ jsx(Calendar, { className: "inline w-4 h-4 mr-1" }),
            "Check-in"
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "date",
              value: checkIn,
              onChange: (e) => {
                setCheckIn(e.target.value);
                setNeedsRefresh(true);
              },
              min: format(/* @__PURE__ */ new Date(), "yyyy-MM-dd"),
              className: "w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("label", { className: "block text-sm font-semibold text-neutral-700 mb-2", children: [
            /* @__PURE__ */ jsx(Calendar, { className: "inline w-4 h-4 mr-1" }),
            "Check-out"
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "date",
              value: checkOut,
              onChange: (e) => {
                setCheckOut(e.target.value);
                setNeedsRefresh(true);
              },
              min: checkIn,
              className: "w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("label", { className: "block text-sm font-semibold text-neutral-700 mb-2", children: [
            /* @__PURE__ */ jsx(Users, { className: "inline w-4 h-4 mr-1" }),
            "Adults"
          ] }),
          /* @__PURE__ */ jsx(
            "select",
            {
              value: adults,
              onChange: (e) => {
                setAdults(parseInt(e.target.value));
                setNeedsRefresh(true);
              },
              className: "w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white",
              children: [1, 2, 3, 4, 5, 6, 7, 8].map((num) => /* @__PURE__ */ jsxs("option", { value: num, children: [
                num,
                " ",
                num === 1 ? "Adult" : "Adults"
              ] }, num))
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("label", { className: "block text-sm font-semibold text-neutral-700 mb-2", children: [
            /* @__PURE__ */ jsx(Users, { className: "inline w-4 h-4 mr-1" }),
            "Children"
          ] }),
          /* @__PURE__ */ jsx(
            "select",
            {
              value: children,
              onChange: (e) => {
                setChildren(parseInt(e.target.value));
                setNeedsRefresh(true);
              },
              className: "w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white",
              children: [0, 1, 2, 3, 4].map((num) => /* @__PURE__ */ jsxs("option", { value: num, children: [
                num,
                " ",
                num === 1 ? "Child" : "Children"
              ] }, num))
            }
          )
        ] })
      ] }),
      hasChanges && needsRefresh && /* @__PURE__ */ jsx("div", { className: "bg-amber-50 border border-amber-200 rounded-lg p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-amber-800", children: [
          /* @__PURE__ */ jsx(AlertCircle, { className: "w-5 h-5" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: "Your selections have changed" })
        ] }),
        /* @__PURE__ */ jsx(Button, { onClick: handleSearch, size: "sm", variant: "primary", children: "Update Availability" })
      ] }) }),
      loading ? /* @__PURE__ */ jsx("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsx(LoadingSpinner, { size: "lg" }) }) : error ? /* @__PURE__ */ jsxs("div", { className: "text-center py-8 bg-red-50 rounded-lg border border-red-200", children: [
        /* @__PURE__ */ jsx(AlertCircle, { className: "w-12 h-12 text-red-500 mx-auto mb-3" }),
        /* @__PURE__ */ jsx("p", { className: "text-red-700 font-medium", children: error }),
        /* @__PURE__ */ jsx(Button, { onClick: handleSearch, variant: "outline", size: "sm", className: "mt-4", children: "Try Again" })
      ] }) : rooms.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-12 bg-neutral-50 rounded-lg border border-neutral-200", children: [
        /* @__PURE__ */ jsx(Bed, { className: "w-12 h-12 text-neutral-400 mx-auto mb-3" }),
        /* @__PURE__ */ jsx("p", { className: "text-neutral-600 font-medium mb-2", children: "No rooms available" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-neutral-500 mb-4", children: "This hotel doesn't have availability for the selected dates and guest count. Try adjusting your dates or number of guests above, or search for other hotels." }),
        /* @__PURE__ */ jsx(
          Button,
          {
            onClick: () => {
              if (typeof window !== "undefined") {
                window.location.href = `/lodging?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}`;
              }
            },
            variant: "outline",
            size: "sm",
            children: "← Back to Search Results"
          }
        )
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-sm font-semibold text-neutral-700 mb-2", children: [
              /* @__PURE__ */ jsx(Bed, { className: "inline w-4 h-4 mr-1" }),
              "Room Type"
            ] }),
            /* @__PURE__ */ jsx(
              "select",
              {
                value: selectedRoomId,
                onChange: (e) => {
                  setSelectedRoomId(e.target.value);
                  const room = rooms.find((r) => r.roomId === e.target.value);
                  if (room && room.rates.length > 0) {
                    setSelectedRateId(room.rates[0].rate_id);
                  }
                },
                className: "w-full px-4 py-3 border-2 border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-base font-medium",
                children: roomOptions.map((option) => /* @__PURE__ */ jsx("option", { value: option.value, children: option.label }, option.value))
              }
            )
          ] }),
          rateOptions.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-semibold text-neutral-700 mb-2", children: "Rate Options" }),
            /* @__PURE__ */ jsx("div", { className: "space-y-2", children: rateOptions.map((option) => {
              const rateTotal = option.rate.total?.amount || 0;
              return /* @__PURE__ */ jsxs(
                "label",
                {
                  className: `flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedRateId === option.value ? "border-primary-600 bg-primary-50" : "border-neutral-200 hover:border-primary-300 bg-white"}`,
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "radio",
                          name: "rate",
                          value: option.value,
                          checked: selectedRateId === option.value,
                          onChange: (e) => setSelectedRateId(e.target.value),
                          className: "w-5 h-5 text-primary-600 focus:ring-primary-500"
                        }
                      ),
                      /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsx("div", { className: "font-semibold text-neutral-900", children: option.label }),
                        option.rate.cancellation_policies && option.rate.cancellation_policies.length > 0 && /* @__PURE__ */ jsx("div", { className: "text-sm text-neutral-600 mt-1", children: option.rate.cancellation_policies[0].type === "FREE_CANCELLATION" ? /* @__PURE__ */ jsx("span", { className: "text-green-600 font-medium", children: "Free cancellation" }) : /* @__PURE__ */ jsx("span", { children: "Cancellation policy applies" }) })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                      /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-primary-600", children: formatCurrency(rateTotal, currency) }),
                      /* @__PURE__ */ jsxs("div", { className: "text-sm text-neutral-600", children: [
                        formatCurrency(rateTotal / nights, currency),
                        " / night"
                      ] })
                    ] })
                  ]
                },
                option.value
              );
            }) })
          ] }),
          selectedRate && /* @__PURE__ */ jsxs("div", { className: "bg-neutral-50 rounded-lg p-4 border border-neutral-200", children: [
            /* @__PURE__ */ jsx("h4", { className: "font-semibold text-neutral-900 mb-3", children: "Room Details" }),
            ((selectedRate.bed_types?.length ?? 0) > 0 || selectedRate.max_occupancy) && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3", children: [
              selectedRate.bed_types && selectedRate.bed_types.length > 0 && /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "bg-white", children: [
                /* @__PURE__ */ jsx(Bed, { className: "h-3 w-3 mr-1" }),
                selectedRate.bed_types.map((b) => `${b.count || 1} ${b.type || "bed"}`).join(", ")
              ] }) }),
              selectedRate.max_occupancy && /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "bg-white", children: [
                /* @__PURE__ */ jsx(Users, { className: "h-3 w-3 mr-1" }),
                "Max ",
                selectedRate.max_occupancy,
                " guests"
              ] }) })
            ] }),
            selectedRate.amenities && selectedRate.amenities.length > 0 && /* @__PURE__ */ jsx("div", { className: "mt-3 pt-3 border-t border-neutral-200", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
              selectedRate.amenities.slice(0, 6).map((amenity, idx) => /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center text-xs bg-white px-2 py-1 rounded border border-neutral-200", children: [
                /* @__PURE__ */ jsx(Check, { className: "w-3 h-3 text-green-600 mr-1" }),
                amenity.name || amenity.code
              ] }, idx)),
              selectedRate.amenities.length > 6 && /* @__PURE__ */ jsxs("span", { className: "text-xs text-neutral-500", children: [
                "+",
                selectedRate.amenities.length - 6,
                " more"
              ] })
            ] }) }),
            !selectedRate.bed_types?.length && !selectedRate.max_occupancy && !selectedRate.amenities?.length && /* @__PURE__ */ jsx("p", { className: "text-sm text-neutral-600", children: "Room details will be confirmed upon booking." })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-6 text-white", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { className: "text-sm opacity-90 mb-1", children: [
                "Total for ",
                nights,
                " night",
                nights !== 1 ? "s" : ""
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-4xl font-bold", children: formatCurrency(totalPrice, currency) }),
              /* @__PURE__ */ jsxs("div", { className: "text-sm opacity-90 mt-1", children: [
                formatCurrency(pricePerNight, currency),
                " per night"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-sm opacity-90 mb-1", children: [
                adults,
                " ",
                adults === 1 ? "Adult" : "Adults",
                children > 0 && `, ${children} ${children === 1 ? "Child" : "Children"}`
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-sm opacity-90", children: [
                format(/* @__PURE__ */ new Date(checkIn + "T00:00:00"), "MMM d"),
                " - ",
                format(/* @__PURE__ */ new Date(checkOut + "T00:00:00"), "MMM d, yyyy")
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
            /* @__PURE__ */ jsx(
              Button,
              {
                onClick: handleBookNow,
                disabled: !selectedRate || !selectedRoomId,
                size: "lg",
                className: "w-full bg-white text-primary-700 hover:bg-neutral-50 disabled:bg-neutral-300 disabled:text-neutral-500 font-bold text-lg py-6 shadow-lg transition-all",
                children: !selectedRate || !selectedRoomId ? "Please select a room" : "Continue to Checkout"
              }
            ),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-center mt-3 opacity-75", children: "You won't be charged yet. Review your booking on the next page." })
          ] })
        ] })
      ] })
    ] })
  ] });
}

function HotelReviewsList({ hotelId, averageRating = 0, reviewCount = 0 }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  useEffect(() => {
    async function fetchReviews() {
      try {
        const response = await fetch(`/api/hotels/reviews?hotelId=${hotelId}&limit=20`);
        if (response.ok) {
          const data = await response.json();
          setReviews(data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, [hotelId]);
  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);
  return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-neutral-900", children: "Guest Reviews" }),
        reviewCount > 0 && /* @__PURE__ */ jsxs("p", { className: "text-neutral-600 mt-1", children: [
          reviewCount.toLocaleString(),
          " review",
          reviewCount !== 1 ? "s" : ""
        ] })
      ] }),
      averageRating > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 bg-primary-50 px-6 py-3 rounded-xl border border-primary-200", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs text-neutral-600 mb-1", children: "Average Rating" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-3xl font-bold text-primary-600", children: averageRating.toFixed(1) }),
            /* @__PURE__ */ jsx("span", { className: "text-neutral-500", children: "/ 10" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-col", children: Array.from({ length: 5 }).map((_, i) => /* @__PURE__ */ jsx(
          Star,
          {
            className: `w-4 h-4 ${i < Math.round(averageRating / 2) ? "fill-accent-500 text-accent-500" : "text-neutral-300"}`
          },
          i
        )) })
      ] })
    ] }),
    loading ? /* @__PURE__ */ jsx("div", { className: "flex justify-center py-8", children: /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" }) }) : reviews.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-12 bg-neutral-50 rounded-lg border border-neutral-200", children: [
      /* @__PURE__ */ jsx(User, { className: "w-12 h-12 text-neutral-400 mx-auto mb-3" }),
      /* @__PURE__ */ jsx("p", { className: "text-neutral-600", children: "No reviews available yet" })
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("div", { className: "space-y-4", children: displayedReviews.map((review, index) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "bg-neutral-50 rounded-lg p-5 border border-neutral-200 hover:border-primary-300 transition-colors",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "bg-primary-600 text-white px-3 py-1 rounded-lg font-bold text-sm", children: [
                  review.rating,
                  "/10"
                ] }),
                review.author && /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-neutral-700", children: review.author })
              ] }),
              review.date && /* @__PURE__ */ jsx("span", { className: "text-xs text-neutral-500", children: new Date(review.date).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric"
              }) })
            ] }),
            review.title && /* @__PURE__ */ jsx("h4", { className: "font-semibold text-neutral-900 mb-2", children: review.title }),
            review.text && /* @__PURE__ */ jsx("p", { className: "text-neutral-700 leading-relaxed mb-3", children: review.text }),
            (review.pros || review.cons) && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-neutral-200", children: [
              review.pros && /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
                  /* @__PURE__ */ jsx(ThumbsUp, { className: "w-4 h-4 text-green-600" }),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-neutral-900", children: "Pros" })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-neutral-700 leading-relaxed", children: review.pros })
              ] }),
              review.cons && /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
                  /* @__PURE__ */ jsx(ThumbsDown, { className: "w-4 h-4 text-red-600" }),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-neutral-900", children: "Cons" })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-neutral-700 leading-relaxed", children: review.cons })
              ] })
            ] })
          ]
        },
        index
      )) }),
      reviews.length > 3 && /* @__PURE__ */ jsx("div", { className: "text-center mt-6", children: /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setShowAll(!showAll),
          className: "px-6 py-2 border-2 border-primary-600 text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors",
          children: showAll ? "Show Less" : `Show All ${reviews.length} Reviews`
        }
      ) })
    ] })
  ] }) });
}

const STRIPE_PUBLISHABLE_KEY = "pk_live_51RexLDDXQIqudS6QM9uvvqT67xXZO08pEKYPiMwJvvtttyo52q9ccjbS6zOrsIaMdnupxy4GQbKG7whB6pRTkN0C00C5Fe9aaZ";
async function loadStripe() {
  if (typeof window === "undefined") return null;
  const { loadStripe: loadStripeLib } = await import('@stripe/stripe-js');
  return loadStripeLib(STRIPE_PUBLISHABLE_KEY);
}

function PaymentForm({ amount, currency, onComplete }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  useEffect(() => {
    async function createPaymentIntent() {
      try {
        const response = await fetch("/api/checkout/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount, currency })
        });
        if (!response.ok) {
          throw new Error("Failed to create payment intent");
        }
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error("Error creating payment intent:", error);
        alert("Failed to initialize payment. Please try again.");
      }
    }
    createPaymentIntent();
  }, [amount, currency]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) {
      return;
    }
    setLoading(true);
    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw submitError;
      }
      const returnUrl = typeof window !== "undefined" ? `${window.location.origin}/booking/confirmation` : "/booking/confirmation";
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: returnUrl
        },
        redirect: "if_required"
      });
      if (error) {
        throw error;
      }
      if (paymentIntent && paymentIntent.status === "succeeded") {
        onComplete(paymentIntent.id);
      }
    } catch (err) {
      alert(err.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  if (!clientSecret) {
    return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "py-8", children: /* @__PURE__ */ jsx("p", { className: "text-center text-gray-600", children: "Loading payment form..." }) }) });
  }
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Payment" }) }),
    /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
      /* @__PURE__ */ jsx(PaymentElement, {}),
      /* @__PURE__ */ jsxs(Button, { type: "submit", className: "w-full", size: "lg", isLoading: loading, disabled: !stripe, children: [
        "Pay ",
        new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount)
      ] })
    ] }) })
  ] });
}
function CheckoutPayment(props) {
  const [stripePromise, setStripePromise] = useState(null);
  useEffect(() => {
    loadStripe().then(setStripePromise);
  }, []);
  if (!stripePromise) {
    return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "py-8", children: /* @__PURE__ */ jsx("p", { className: "text-center text-gray-600", children: "Loading payment system..." }) }) });
  }
  return /* @__PURE__ */ jsx(Elements, { stripe: stripePromise, children: /* @__PURE__ */ jsx(PaymentForm, { ...props }) });
}

function CheckoutFlow({ hotelId, hotelName, room, addons = [], onComplete }) {
  const [step, setStep] = useState(1);
  const [guestInfo, setGuestInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    specialRequests: ""
  });
  const nights = calculateNights(room.checkIn, room.checkOut);
  const addonsTotal = addons.reduce((sum, addon) => sum + addon.price, 0);
  const total = room.price + addonsTotal;
  const handleGuestInfoSubmit = (e) => {
    e.preventDefault();
    setStep(2);
  };
  const [isProcessing, setIsProcessing] = useState(false);
  const handlePaymentComplete = async (paymentIntentId) => {
    setIsProcessing(true);
    try {
      const prebookResponse = await fetch("/api/booking/prebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotel_id: hotelId,
          rate_id: room.rateId,
          checkin: room.checkIn,
          checkout: room.checkOut,
          adults: room.adults,
          children: room.children || 0,
          guest_info: {
            first_name: guestInfo.firstName,
            last_name: guestInfo.lastName,
            email: guestInfo.email,
            phone: guestInfo.phone
          },
          addons: addons.map((a) => ({
            addon_id: a.addonId,
            quantity: a.quantity
          }))
        })
      });
      if (!prebookResponse.ok) {
        const errorData = await prebookResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to reserve room. Please try again.");
      }
      const prebookData = await prebookResponse.json();
      const confirmResponse = await fetch("/api/booking/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prebook_id: prebookData.prebook_id,
          payment: {
            method: "stripe",
            transaction_id: paymentIntentId
          },
          // Pass guest info for email confirmation
          guest_email: guestInfo.email,
          guest_first_name: guestInfo.firstName,
          guest_last_name: guestInfo.lastName,
          hotel_name: hotelName,
          room_name: room.roomName,
          checkin: room.checkIn,
          checkout: room.checkOut,
          adults: room.adults,
          children: room.children,
          total_price: total,
          currency: room.currency
        })
      });
      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to confirm booking. Please contact support with your payment confirmation.");
      }
      const bookingData = await confirmResponse.json();
      onComplete(bookingData.booking_id);
    } catch (error) {
      console.error("Booking error:", error);
      alert(error instanceof Error ? error.message : "Booking failed. Please try again.");
      setIsProcessing(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto", children: [
    isProcessing && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl", children: [
      /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto mb-4" }),
      /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-neutral-900 mb-2", children: "Processing Your Booking" }),
      /* @__PURE__ */ jsx("p", { className: "text-neutral-600", children: "Please wait while we confirm your reservation..." })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: `flex items-center ${step >= 1 ? "text-primary-600" : "text-gray-400"}`, children: [
        /* @__PURE__ */ jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? "bg-primary-600 text-white" : "bg-gray-200"}`, children: "1" }),
        /* @__PURE__ */ jsx("span", { className: "ml-2 font-medium", children: "Guest Information" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 h-0.5 bg-gray-200 mx-4" }),
      /* @__PURE__ */ jsxs("div", { className: `flex items-center ${step >= 2 ? "text-primary-600" : "text-gray-400"}`, children: [
        /* @__PURE__ */ jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? "bg-primary-600 text-white" : "bg-gray-200"}`, children: "2" }),
        /* @__PURE__ */ jsx("span", { className: "ml-2 font-medium", children: "Payment" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2", children: [
        step === 1 && /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Guest Information" }) }),
          /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("form", { onSubmit: handleGuestInfoSubmit, className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsx(
                Input,
                {
                  label: "First Name",
                  value: guestInfo.firstName,
                  onChange: (e) => setGuestInfo({ ...guestInfo, firstName: e.target.value }),
                  required: true
                }
              ),
              /* @__PURE__ */ jsx(
                Input,
                {
                  label: "Last Name",
                  value: guestInfo.lastName,
                  onChange: (e) => setGuestInfo({ ...guestInfo, lastName: e.target.value }),
                  required: true
                }
              )
            ] }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "email",
                label: "Email",
                value: guestInfo.email,
                onChange: (e) => setGuestInfo({ ...guestInfo, email: e.target.value }),
                required: true
              }
            ),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "tel",
                label: "Phone",
                value: guestInfo.phone,
                onChange: (e) => setGuestInfo({ ...guestInfo, phone: e.target.value })
              }
            ),
            /* @__PURE__ */ jsx(
              Input,
              {
                label: "Special Requests",
                value: guestInfo.specialRequests,
                onChange: (e) => setGuestInfo({ ...guestInfo, specialRequests: e.target.value }),
                placeholder: "Optional"
              }
            ),
            /* @__PURE__ */ jsx(Button, { type: "submit", className: "w-full", size: "lg", children: "Continue to Payment" })
          ] }) })
        ] }),
        step === 2 && /* @__PURE__ */ jsx(
          CheckoutPayment,
          {
            amount: total,
            currency: room.currency,
            onComplete: handlePaymentComplete
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs(Card, { className: "sticky top-4", children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Booking Summary" }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h4", { className: "font-semibold mb-2", children: hotelName }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-600", children: [
              room.checkIn,
              " - ",
              room.checkOut
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-600", children: [
              nights,
              " night",
              nights !== 1 ? "s" : "",
              " • ",
              room.adults,
              " guest",
              room.adults !== 1 ? "s" : ""
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "border-t pt-4 space-y-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "text-gray-600", children: "Room" }),
              /* @__PURE__ */ jsx("span", { className: "font-medium", children: formatCurrency(room.price, room.currency) })
            ] }),
            addons.length > 0 && /* @__PURE__ */ jsx("div", { className: "space-y-1", children: addons.map((addon) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-gray-600", children: [
                addon.name,
                " (x",
                addon.quantity,
                ")"
              ] }),
              /* @__PURE__ */ jsx("span", { children: formatCurrency(addon.price, addon.currency) })
            ] }, addon.addonId)) }),
            /* @__PURE__ */ jsxs("div", { className: "border-t pt-2 flex justify-between font-semibold text-lg", children: [
              /* @__PURE__ */ jsx("span", { children: "Total" }),
              /* @__PURE__ */ jsx("span", { children: formatCurrency(total, room.currency) })
            ] })
          ] })
        ] })
      ] }) })
    ] })
  ] });
}

const amenityIconMap = {
  // Parking
  "parking": { icon: "ParkingCircle", color: "text-blue-600" },
  "free parking": { icon: "ParkingCircle", color: "text-green-600" },
  "valet parking": { icon: "Car", color: "text-blue-600" },
  // Wi-Fi / Internet
  "wifi": { icon: "Wifi", color: "text-blue-600" },
  "free wifi": { icon: "Wifi", color: "text-green-600" },
  "internet": { icon: "Wifi", color: "text-blue-600" },
  "free wired internet": { icon: "Cable", color: "text-green-600" },
  // Pool / Spa
  "pool": { icon: "Waves", color: "text-cyan-600" },
  "indoor pool": { icon: "Waves", color: "text-cyan-600" },
  "outdoor pool": { icon: "Waves", color: "text-sky-600" },
  "hot tub": { icon: "Droplet", color: "text-orange-600" },
  "jacuzzi": { icon: "Droplet", color: "text-orange-600" },
  "spa": { icon: "Sparkles", color: "text-purple-600" },
  "sauna": { icon: "Flame", color: "text-orange-600" },
  // Fitness
  "gym": { icon: "Dumbbell", color: "text-red-600" },
  "fitness": { icon: "Dumbbell", color: "text-red-600" },
  "fitness center": { icon: "Dumbbell", color: "text-red-600" },
  // Food & Beverage
  "restaurant": { icon: "UtensilsCrossed", color: "text-amber-600" },
  "breakfast": { icon: "Coffee", color: "text-amber-600" },
  "bar": { icon: "Wine", color: "text-purple-600" },
  "room service": { icon: "ConciergeBell", color: "text-amber-600" },
  "kitchen": { icon: "ChefHat", color: "text-amber-600" },
  "refrigerator": { icon: "Refrigerator", color: "text-blue-600" },
  // Services
  "concierge": { icon: "Headset", color: "text-blue-600" },
  "reception": { icon: "Hotel", color: "text-blue-600" },
  "24-hour front desk": { icon: "Clock", color: "text-blue-600" },
  "luggage storage": { icon: "Briefcase", color: "text-gray-600" },
  "laundry": { icon: "Shirt", color: "text-blue-600" },
  // Family
  "family rooms": { icon: "Users", color: "text-green-600" },
  "cribs": { icon: "Baby", color: "text-pink-600" },
  "playground": { icon: "TreePine", color: "text-green-600" },
  // Safety & Accessibility
  "wheelchair accessible": { icon: "Accessibility", color: "text-blue-600" },
  "elevator": { icon: "MoveVertical", color: "text-gray-600" },
  "smoke alarms": { icon: "BellRing", color: "text-red-600" },
  "fire extinguisher": { icon: "Flame", color: "text-red-600" },
  "safety deposit box": { icon: "Lock", color: "text-gray-600" },
  // Room Features
  "air conditioning": { icon: "Wind", color: "text-sky-600" },
  "heating": { icon: "Thermometer", color: "text-orange-600" },
  "tv": { icon: "Tv", color: "text-gray-600" },
  "balcony": { icon: "Home", color: "text-green-600" },
  "terrace": { icon: "Palmtree", color: "text-green-600" },
  "fireplace": { icon: "Flame", color: "text-orange-600" },
  // Pets
  "pets allowed": { icon: "Dog", color: "text-amber-600" },
  // Business
  "business center": { icon: "Briefcase", color: "text-gray-600" },
  "meeting rooms": { icon: "Presentation", color: "text-blue-600" },
  // Default
  "default": { icon: "Check", color: "text-primary-600" }
};
function getAmenityIcon(amenityName) {
  const normalized = amenityName.toLowerCase().trim();
  if (amenityIconMap[normalized]) {
    return amenityIconMap[normalized];
  }
  for (const [key, value] of Object.entries(amenityIconMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }
  return amenityIconMap["default"];
}

function HotelDetailView({ hotel, checkIn, checkOut, adults, children = 0, rooms = 1 }) {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const rating = hotel.review_score || 0;
  const ratingColor = getRatingColor(rating);
  const allImages = getHotelImages(hotel);
  const hasImages = allImages.length > 0;
  const handleBookingReady = (bookingData) => {
    const price = bookingData.roomData.total?.amount || bookingData.roomData.net?.amount || 0;
    const currency = bookingData.roomData.total?.currency || bookingData.roomData.net?.currency || "USD";
    setSelectedRoom({
      rateId: bookingData.rateId,
      roomId: bookingData.roomData.room_id,
      roomName: bookingData.roomData.room_name,
      checkIn: bookingData.checkIn,
      checkOut: bookingData.checkOut,
      adults: bookingData.adults,
      children: bookingData.children,
      price,
      currency
    });
    setShowCheckout(true);
  };
  const handleBookingComplete = (bookingId) => {
    setShowCheckout(false);
    if (typeof window !== "undefined") {
      window.location.href = `/booking/confirmation/${bookingId}`;
    }
  };
  if (showCheckout && selectedRoom) {
    return /* @__PURE__ */ jsx(
      CheckoutFlow,
      {
        hotelId: hotel.hotel_id,
        hotelName: hotel.name || "",
        room: selectedRoom,
        addons: [],
        onComplete: handleBookingComplete
      }
    );
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("div", { className: "flex items-start justify-between mb-4", children: /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold mb-2", children: hotel.name }),
      formatHotelAddress(hotel) && /* @__PURE__ */ jsxs("div", { className: "flex items-center text-gray-600 mb-2", children: [
        /* @__PURE__ */ jsx(MapPin, { className: "h-4 w-4 mr-1" }),
        /* @__PURE__ */ jsx("span", { children: formatHotelAddress(hotel) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        hotel.star_rating && /* @__PURE__ */ jsxs(Badge, { variant: "secondary", children: [
          /* @__PURE__ */ jsx(Star, { className: "h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" }),
          hotel.star_rating,
          " Stars"
        ] }),
        rating > 0 && /* @__PURE__ */ jsxs("div", { className: `${ratingColor.bg} ${ratingColor.text} ${ratingColor.border} border rounded-full px-3 py-1 text-sm font-semibold`, children: [
          rating.toFixed(1),
          " / 10"
        ] })
      ] })
    ] }) }) }),
    hasImages ? allImages.length === 1 ? (
      // Single image - full width hero
      /* @__PURE__ */ jsx("div", { className: "w-full", children: /* @__PURE__ */ jsx(
        ImageWithLoading,
        {
          src: allImages[0],
          alt: hotel.name || "Hotel",
          className: "w-full h-[500px] object-cover rounded-xl shadow-lg"
        }
      ) })
    ) : (
      // Multiple images - grid layout
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: allImages.length === 2 ? "md:col-span-1" : "md:col-span-2", children: /* @__PURE__ */ jsx(
          ImageWithLoading,
          {
            src: allImages[0],
            alt: hotel.name || "Hotel",
            className: "w-full h-96 object-cover rounded-lg shadow-md"
          }
        ) }),
        allImages.slice(1, 5).map((imgUrl, index) => /* @__PURE__ */ jsx(
          ImageWithLoading,
          {
            src: imgUrl,
            alt: `${hotel.name} - Image ${index + 2}`,
            className: "w-full h-48 object-cover rounded-lg shadow-md"
          },
          index
        ))
      ] })
    ) : (
      // No images - show placeholder
      /* @__PURE__ */ jsx("div", { className: "w-full h-96 bg-gradient-to-br from-primary-50 to-neutral-100 rounded-xl flex items-center justify-center shadow-md", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "w-24 h-24 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsx("svg", { className: "w-12 h-12 text-primary-600", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" }) }) }),
        /* @__PURE__ */ jsx("p", { className: "text-lg font-semibold text-neutral-700", children: hotel.name }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-neutral-500 mt-1", children: "Photos coming soon" })
      ] }) })
    ),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
      hotel.star_rating && /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 text-center", children: [
        /* @__PURE__ */ jsx(Star, { className: "h-8 w-8 mx-auto mb-2 text-accent-500 fill-accent-500" }),
        /* @__PURE__ */ jsxs("div", { className: "text-2xl font-bold text-neutral-900", children: [
          hotel.star_rating,
          " Stars"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-sm text-neutral-600", children: "Hotel Rating" })
      ] }) }),
      rating > 0 && /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 text-center", children: [
        /* @__PURE__ */ jsx("div", { className: `inline-flex items-center justify-center w-16 h-16 rounded-full ${ratingColor.bg} mb-2`, children: /* @__PURE__ */ jsx("span", { className: `text-2xl font-bold ${ratingColor.text}`, children: rating.toFixed(1) }) }),
        /* @__PURE__ */ jsx("div", { className: "text-sm text-neutral-600", children: hotel.review_count ? `${hotel.review_count.toLocaleString()} reviews` : "Guest Rating" })
      ] }) }),
      hotel.location && /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 text-center", children: [
        /* @__PURE__ */ jsx(MapPin, { className: "h-8 w-8 mx-auto mb-2 text-primary-600" }),
        /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold text-neutral-900", children: "Prime Location" }),
        /* @__PURE__ */ jsx("div", { className: "text-xs text-neutral-600", children: "Telluride, Colorado" })
      ] }) })
    ] }),
    hotel.description?.text && /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold mb-4 text-neutral-900", children: "About This Hotel" }),
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "text-neutral-700 leading-relaxed prose prose-sm max-w-none",
          dangerouslySetInnerHTML: { __html: hotel.description.text.replace(/\n/g, "<br/>") }
        }
      )
    ] }) }),
    hotel.amenities && hotel.amenities.length > 0 && /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold mb-6 text-neutral-900", children: "Hotel Amenities" }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3", children: hotel.amenities.map((amenity, index) => {
        const amenityName = amenity.name || amenity.code || "";
        const { icon: iconName, color } = getAmenityIcon(amenityName);
        const IconComponent = LucideIcons[iconName] || LucideIcons.Check;
        return /* @__PURE__ */ jsxs("div", { className: "flex items-center text-sm bg-neutral-50 rounded-lg p-3 border border-neutral-200 hover:border-primary-300 hover:bg-primary-50/50 transition-all", children: [
          /* @__PURE__ */ jsx("div", { className: `mr-3 flex-shrink-0 ${color}`, children: /* @__PURE__ */ jsx(IconComponent, { className: "w-5 h-5" }) }),
          /* @__PURE__ */ jsx("span", { className: "text-neutral-700 font-medium", children: amenityName })
        ] }, index);
      }) })
    ] }) }),
    /* @__PURE__ */ jsx(
      RoomSelectorCard,
      {
        hotelId: hotel.hotel_id,
        initialCheckIn: checkIn,
        initialCheckOut: checkOut,
        initialAdults: adults,
        initialChildren: children,
        initialRooms: rooms,
        onBookingReady: handleBookingReady
      }
    ),
    /* @__PURE__ */ jsx(
      HotelReviewsList,
      {
        hotelId: hotel.hotel_id,
        averageRating: rating,
        reviewCount: hotel.review_count
      }
    )
  ] });
}

const $$Astro = createAstro("https://tellurideskihotels.com");
const prerender = false;
const $$hotelId = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$hotelId;
  const { hotelId } = Astro2.params;
  const url = Astro2.url;
  const searchParams = url.searchParams;
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");
  const adults = parseInt(searchParams.get("adults") || "2", 10);
  const children = parseInt(searchParams.get("children") || "0", 10);
  const rooms = parseInt(searchParams.get("rooms") || "1", 10);
  if (!checkIn || !checkOut) {
    return Astro2.redirect(`/lodging?location=Telluride&adults=${adults}`);
  }
  let hotel = null;
  let error = null;
  if (hotelId) {
    try {
      hotel = await getHotelDetails(hotelId);
    } catch (err) {
      console.error("[Hotel Detail] Error fetching hotel:", err);
      error = "Failed to load hotel details";
    }
  }
  if (!hotel && !error) {
    error = "Hotel not found";
  }
  return renderTemplate`${renderComponent($$result, "PageLayout", $$PageLayout, { "title": hotel ? `${hotel.name} - Telluride Ski Hotel | Book Now` : "Hotel Not Found", "description": hotel ? `Book ${hotel.name} in Telluride. ${hotel.star_rating ? `${hotel.star_rating} stars, ` : ""}${hotel.review_score ? `${hotel.review_score}/10 guest rating. ` : ""}Best rates, instant confirmation.` : "Hotel not found" }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "Container", $$Container, { "class": "py-12 lg:py-16" }, { "default": async ($$result3) => renderTemplate`${error ? renderTemplate`${maybeRenderHead()}<div class="max-w-2xl mx-auto text-center py-20"> <div class="bg-white rounded-2xl shadow-card p-12 border border-neutral-200"> <div class="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6"> <svg class="w-10 h-10 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path> </svg> </div> <h1 class="text-display-sm text-neutral-900 mb-4">Hotel Not Found</h1> <p class="text-lg text-neutral-600 mb-8">${error}</p> <a href="/lodging" class="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-card hover:shadow-card-hover hover:bg-primary-700 transition-all duration-300"> <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path> </svg>
Search Hotels
</a> </div> </div>` : hotel ? renderTemplate`${renderComponent($$result3, "Fragment", Fragment$1, {}, { "default": async ($$result4) => renderTemplate` ${renderComponent($$result4, "Breadcrumbs", $$Breadcrumbs, { "items": [
    { label: "Home", href: "/" },
    { label: "Hotels", href: "/lodging" },
    { label: hotel.name || "Hotel", href: void 0 }
  ] })} ${renderComponent($$result4, "HotelDetailView", HotelDetailView, { "client:load": true, "hotel": hotel, "checkIn": checkIn, "checkOut": checkOut, "adults": adults, "children": children, "rooms": rooms, "client:component-hydration": "load", "client:component-path": "@/components/lodging/HotelDetailView", "client:component-export": "HotelDetailView" })} ` })}` : null}` })} ` })}`;
}, "C:/Users/ididi/OneDrive/Desktop/tellurideskihotels.com/src/pages/lodging/[hotelId].astro", void 0);

const $$file = "C:/Users/ididi/OneDrive/Desktop/tellurideskihotels.com/src/pages/lodging/[hotelId].astro";
const $$url = "/lodging/[hotelId]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$hotelId,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };

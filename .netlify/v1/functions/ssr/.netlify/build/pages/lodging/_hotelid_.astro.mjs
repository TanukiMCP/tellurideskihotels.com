import { c as createAstro, a as createComponent, d as renderComponent, r as renderTemplate, m as maybeRenderHead, F as Fragment } from '../../chunks/astro/server_rnaPFH2-.mjs';
import 'kleur/colors';
import 'html-escaper';
import { B as Button, I as Input, g as getRatingColor, $ as $$PageLayout, a as $$Container } from '../../chunks/PageLayout_H5zbvr1p.mjs';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { C as Card, a as CardHeader, b as CardTitle, c as CardContent } from '../../chunks/Card_CjEgi5uA.mjs';
import { L as LoadingSpinner, B as Badge, g as getHotelImages, f as formatHotelAddress, I as ImageWithLoading } from '../../chunks/utils_DsTnJw_S.mjs';
import { Bed, Users, Star, MapPin } from 'lucide-react';
import { c as calculateNights, f as formatCurrency } from '../../chunks/utils_CwWswjZg.mjs';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { $ as $$Breadcrumbs } from '../../chunks/Breadcrumbs_D3BEtb3b.mjs';
export { renderers } from '../../renderers.mjs';

function RoomSelector({
  hotelId,
  checkIn,
  checkOut,
  adults,
  children = 0,
  onRoomSelect
}) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const nights = calculateNights(checkIn, checkOut);
  useEffect(() => {
    async function fetchRates() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          hotelId,
          checkIn,
          checkOut,
          adults: adults.toString()
        });
        if (children > 0) {
          params.append("children", children.toString());
        }
        const response = await fetch(`/api/hotels/rates?${params.toString()}`);
        if (!response.ok) {
          throw new Error("Failed to fetch rates");
        }
        const data = await response.json();
        const allRates = [];
        if (data.data && data.data.length > 0) {
          data.data.forEach((hotel) => {
            hotel.rooms?.forEach((room) => {
              room.rates?.forEach((rate) => {
                allRates.push(rate);
              });
            });
          });
        }
        setRooms(allRates);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    if (hotelId && checkIn && checkOut) {
      fetchRates();
    }
  }, [hotelId, checkIn, checkOut, adults, children]);
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "flex justify-center py-8", children: /* @__PURE__ */ jsx(LoadingSpinner, { size: "lg" }) });
  }
  if (error) {
    return /* @__PURE__ */ jsx("div", { className: "text-center py-8", children: /* @__PURE__ */ jsx("p", { className: "text-red-600", children: error }) });
  }
  if (rooms.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: "text-center py-8", children: /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "No rooms available for the selected dates." }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-4", children: "Available Rooms" }),
    rooms.map((rate) => {
      const price = rate.total?.amount || rate.net?.amount || 0;
      const currency = rate.total?.currency || rate.net?.currency || "USD";
      const pricePerNight = nights > 0 ? price / nights : price;
      return /* @__PURE__ */ jsxs(Card, { className: "hover:shadow-md transition-shadow", children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: rate.room_name }),
            rate.room_description && /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mt-1", children: rate.room_description })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-right ml-4", children: [
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold", children: formatCurrency(price, currency) }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-600", children: [
              formatCurrency(pricePerNight, currency),
              " per night"
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 mb-4", children: [
            rate.bed_types && rate.bed_types.length > 0 && /* @__PURE__ */ jsxs(Badge, { variant: "outline", children: [
              /* @__PURE__ */ jsx(Bed, { className: "h-3 w-3 mr-1" }),
              rate.bed_types.map((b) => `${b.count || 1} ${b.type || "bed"}`).join(", ")
            ] }),
            rate.max_occupancy && /* @__PURE__ */ jsxs(Badge, { variant: "outline", children: [
              /* @__PURE__ */ jsx(Users, { className: "h-3 w-3 mr-1" }),
              "Up to ",
              rate.max_occupancy,
              " guests"
            ] })
          ] }),
          rate.cancellation_policies && rate.cancellation_policies.length > 0 && /* @__PURE__ */ jsx("div", { className: "mb-4", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: rate.cancellation_policies[0].type === "FREE_CANCELLATION" ? "Free cancellation available" : "Cancellation policy applies" }) }),
          /* @__PURE__ */ jsx(
            Button,
            {
              onClick: () => onRoomSelect(rate.rate_id, rate),
              className: "w-full",
              children: "Select Room"
            }
          )
        ] })
      ] }, rate.rate_id);
    })
  ] });
}

function AddonsSection({
  hotelId,
  nights,
  adults,
  children = 0,
  onAddonSelect
}) {
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState({});
  useEffect(() => {
    async function fetchAddons() {
      setLoading(true);
      try {
        const response = await fetch(`/api/hotels/addons?hotelId=${hotelId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch add-ons");
        }
        const data = await response.json();
        setAddons(data.data || []);
      } catch (err) {
        console.error("Error fetching add-ons:", err);
      } finally {
        setLoading(false);
      }
    }
    if (hotelId) {
      fetchAddons();
    }
  }, [hotelId]);
  const handleQuantityChange = (addonId, quantity) => {
    setSelected((prev) => ({
      ...prev,
      [addonId]: quantity
    }));
  };
  const calculateAddonPrice = (addon, quantity) => {
    if (!addon.price?.amount || quantity === 0) return 0;
    const basePrice = addon.price.amount;
    const priceType = addon.price.type || "per_stay";
    switch (priceType) {
      case "per_stay":
        return basePrice * quantity;
      case "per_night":
        return basePrice * nights * quantity;
      case "per_person":
        return basePrice * (adults + children) * quantity;
      case "per_person_per_night":
        return basePrice * (adults + children) * nights * quantity;
      default:
        return basePrice * quantity;
    }
  };
  const handleConfirm = () => {
    const selectedAddons = Object.entries(selected).filter(([_, quantity]) => quantity > 0).map(([addonId, quantity]) => {
      const addon = addons.find((a) => a.addon_id === addonId);
      if (!addon) return null;
      return {
        addonId,
        name: addon.name || "",
        quantity,
        price: calculateAddonPrice(addon, quantity),
        currency: addon.price?.currency || "USD",
        priceType: addon.price?.type || "per_stay"
      };
    }).filter((a) => a !== null);
    onAddonSelect(selectedAddons);
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "flex justify-center py-8", children: /* @__PURE__ */ jsx(LoadingSpinner, { size: "lg" }) });
  }
  if (addons.length === 0) {
    return null;
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold", children: "Add-ons & Extras" }),
    addons.map((addon) => {
      const quantity = selected[addon.addon_id] || 0;
      const totalPrice = calculateAddonPrice(addon, quantity);
      const currency = addon.price?.currency || "USD";
      return /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: addon.name }),
            addon.description && /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mt-1", children: addon.description })
          ] }),
          addon.price?.amount && /* @__PURE__ */ jsx("div", { className: "text-right ml-4", children: /* @__PURE__ */ jsxs("p", { className: "font-semibold", children: [
            formatCurrency(addon.price.amount, currency),
            addon.price.type === "per_night" && " / night",
            addon.price.type === "per_person" && " / person",
            addon.price.type === "per_person_per_night" && " / person / night"
          ] }) })
        ] }) }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx(
            Input,
            {
              type: "number",
              min: "0",
              value: quantity.toString(),
              onChange: (e) => handleQuantityChange(addon.addon_id, parseInt(e.target.value) || 0),
              className: "w-24",
              label: "Quantity"
            }
          ),
          quantity > 0 && /* @__PURE__ */ jsx("div", { className: "text-right", children: /* @__PURE__ */ jsxs("p", { className: "text-lg font-semibold", children: [
            "Total: ",
            formatCurrency(totalPrice, currency)
          ] }) })
        ] }) })
      ] }, addon.addon_id);
    }),
    /* @__PURE__ */ jsx(Button, { onClick: handleConfirm, className: "w-full", size: "lg", children: "Confirm Add-ons" })
  ] });
}

function HotelReviews({ reviews, averageRating, reviewCount }) {
  if (!averageRating && (!reviews || reviews.length === 0)) {
    return null;
  }
  const ratingColor = averageRating ? getRatingColor(averageRating) : null;
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    averageRating && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: `${ratingColor?.bg} ${ratingColor?.text} ${ratingColor?.border} border rounded-lg px-4 py-2`, children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Star, { className: "h-5 w-5 fill-current" }),
        /* @__PURE__ */ jsx("span", { className: "text-2xl font-bold", children: averageRating.toFixed(1) })
      ] }) }),
      reviewCount && /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("p", { className: "text-lg font-semibold", children: [
        reviewCount,
        " Review",
        reviewCount !== 1 ? "s" : ""
      ] }) })
    ] }),
    reviews && reviews.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold", children: "Guest Reviews" }),
      reviews.map((review, index) => /* @__PURE__ */ jsxs("div", { className: "border border-gray-200 rounded-lg p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
          review.rating && /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
            [...Array(5)].map((_, i) => /* @__PURE__ */ jsx(
              Star,
              {
                className: `h-4 w-4 ${i < Math.round(review.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`
              },
              i
            )),
            /* @__PURE__ */ jsx("span", { className: "ml-2 font-medium", children: review.rating })
          ] }),
          review.author && /* @__PURE__ */ jsxs("span", { className: "text-sm text-gray-600", children: [
            "by ",
            review.author
          ] }),
          review.date && /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-500", children: review.date })
        ] }),
        review.comment && /* @__PURE__ */ jsx("p", { className: "text-gray-700", children: review.comment })
      ] }, index))
    ] })
  ] });
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
  const handlePaymentComplete = async (paymentIntentId) => {
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
        throw new Error("Prebook failed");
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
          }
        })
      });
      if (!confirmResponse.ok) {
        throw new Error("Booking confirmation failed");
      }
      const bookingData = await confirmResponse.json();
      onComplete(bookingData.booking_id);
    } catch (error) {
      console.error("Booking error:", error);
      alert("Booking failed. Please try again.");
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto", children: [
    /* @__PURE__ */ jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: `flex items-center ${step >= 1 ? "text-turquoise-500" : "text-gray-400"}`, children: [
        /* @__PURE__ */ jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? "bg-turquoise-500 text-white" : "bg-gray-200"}`, children: "1" }),
        /* @__PURE__ */ jsx("span", { className: "ml-2 font-medium", children: "Guest Information" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 h-0.5 bg-gray-200 mx-4" }),
      /* @__PURE__ */ jsxs("div", { className: `flex items-center ${step >= 2 ? "text-turquoise-500" : "text-gray-400"}`, children: [
        /* @__PURE__ */ jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? "bg-turquoise-500 text-white" : "bg-gray-200"}`, children: "2" }),
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

function HotelDetailView({ hotel, checkIn, checkOut, adults, children = 0 }) {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const nights = calculateNights(checkIn, checkOut);
  const rating = hotel.review_score || 0;
  const ratingColor = getRatingColor(rating);
  const allImages = getHotelImages(hotel);
  const mainImage = allImages[0] || "/images/placeholder-hotel.jpg";
  const galleryImages = allImages.slice(1, 5);
  const handleRoomSelect = (rateId, roomData) => {
    const price = roomData.total?.amount || roomData.net?.amount || 0;
    const currency = roomData.total?.currency || roomData.net?.currency || "USD";
    setSelectedRoom({
      rateId,
      roomId: roomData.room_id,
      roomName: roomData.room_name,
      checkIn,
      checkOut,
      adults,
      children,
      price,
      currency
    });
  };
  const handleBookNow = () => {
    if (selectedRoom) {
      setShowCheckout(true);
    }
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
        addons: selectedAddons,
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
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: "md:col-span-2", children: /* @__PURE__ */ jsx(
        ImageWithLoading,
        {
          src: mainImage,
          alt: hotel.name || "Hotel",
          className: "w-full h-96 object-cover rounded-lg"
        }
      ) }),
      galleryImages.map((imgUrl, index) => /* @__PURE__ */ jsx(
        ImageWithLoading,
        {
          src: imgUrl,
          alt: `${hotel.name} - Image ${index + 2}`,
          className: "w-full h-48 object-cover rounded-lg"
        },
        index
      ))
    ] }),
    hotel.description?.text && /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold mb-4", children: "About" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-700 whitespace-pre-line", children: hotel.description.text })
    ] }) }),
    hotel.amenities && hotel.amenities.length > 0 && /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold mb-4", children: "Amenities" }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-2", children: hotel.amenities.map((amenity, index) => /* @__PURE__ */ jsxs("div", { className: "flex items-center text-sm", children: [
        /* @__PURE__ */ jsx("span", { className: "mr-2", children: "✓" }),
        /* @__PURE__ */ jsx("span", { children: amenity.name || amenity.code })
      ] }, index)) })
    ] }) }),
    /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsx(
      RoomSelector,
      {
        hotelId: hotel.hotel_id,
        checkIn,
        checkOut,
        adults,
        children,
        onRoomSelect: handleRoomSelect
      }
    ) }) }),
    selectedRoom && /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsx(
      AddonsSection,
      {
        hotelId: hotel.hotel_id,
        nights,
        adults,
        children,
        onAddonSelect: setSelectedAddons
      }
    ) }) }),
    selectedRoom && /* @__PURE__ */ jsx("div", { className: "sticky bottom-0 bg-white border-t border-gray-200 p-4 shadow-lg", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-600", children: [
          "Total for ",
          nights,
          " night",
          nights !== 1 ? "s" : ""
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold", children: formatCurrency(selectedRoom.price + selectedAddons.reduce((sum, a) => sum + a.price, 0), selectedRoom.currency) })
      ] }),
      /* @__PURE__ */ jsx(Button, { onClick: handleBookNow, size: "lg", children: "Book Now" })
    ] }) }),
    /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsx(
      HotelReviews,
      {
        averageRating: rating,
        reviewCount: hotel.review_count
      }
    ) }) })
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
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const adults = parseInt(searchParams.get("adults") || "2", 10);
  const children = parseInt(searchParams.get("children") || "0", 10);
  let hotel = null;
  let error = null;
  if (hotelId) {
    try {
      const response = await fetch(`${url.origin}/api/hotels/details?hotelId=${hotelId}`);
      if (response.ok) {
        hotel = await response.json();
      } else {
        error = "Hotel not found";
      }
    } catch (err) {
      error = "Failed to load hotel details";
    }
  }
  if (!hotel && !error) {
    error = "Hotel not found";
  }
  if (!checkIn || !checkOut) {
    return Astro2.redirect("/lodging");
  }
  return renderTemplate`${renderComponent($$result, "PageLayout", $$PageLayout, { "title": hotel ? `${hotel.name} - Telluride Ski Hotel | Book Now` : "Hotel Not Found", "description": hotel ? `Book ${hotel.name} in Telluride. ${hotel.star_rating ? `${hotel.star_rating} stars, ` : ""}${hotel.review_score ? `${hotel.review_score}/10 guest rating. ` : ""}Best rates, instant confirmation.` : "Hotel not found" }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "Container", $$Container, { "class": "py-8" }, { "default": async ($$result3) => renderTemplate`${error ? renderTemplate`${maybeRenderHead()}<div class="text-center py-12"> <h1 class="text-2xl font-bold mb-4">Hotel Not Found</h1> <p class="text-gray-600 mb-6">${error}</p> <a href="/lodging" class="inline-block bg-turquoise-500 text-white px-6 py-2 rounded-lg hover:bg-turquoise-600">
Search Hotels
</a> </div>` : hotel ? renderTemplate`${renderComponent($$result3, "Fragment", Fragment, {}, { "default": async ($$result4) => renderTemplate` ${renderComponent($$result4, "Breadcrumbs", $$Breadcrumbs, { "items": [
    { label: "Home", href: "/" },
    { label: "Hotels", href: "/lodging" },
    { label: hotel.name || "Hotel", href: void 0 }
  ] })} ${renderComponent($$result4, "HotelDetailView", HotelDetailView, { "client:load": true, "hotel": hotel, "checkIn": checkIn, "checkOut": checkOut, "adults": adults, "children": children, "client:component-hydration": "load", "client:component-path": "@/components/lodging/HotelDetailView", "client:component-export": "HotelDetailView" })} ` })}` : null}` })} ` })}`;
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

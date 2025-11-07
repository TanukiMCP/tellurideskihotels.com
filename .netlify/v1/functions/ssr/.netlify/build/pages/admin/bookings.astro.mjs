import { c as createAstro, a as createComponent, d as renderComponent, r as renderTemplate } from '../../chunks/astro/server_DIEPIpiA.mjs';
import 'kleur/colors';
import 'html-escaper';
import { $ as $$PageLayout } from '../../chunks/PageLayout_DgHuiZBJ.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { Card } from '@tremor/react';
import { B as Button } from '../../chunks/Button_Bs4Cal8d.mjs';
import { I as Input } from '../../chunks/Input_AH10ORng.mjs';
import { Hotel, LogOut, Download, Search, X, Mail, DollarSign } from 'lucide-react';
import { a as authClient } from '../../chunks/auth-client_CpbRk6Ze.mjs';
import { f as formatCurrency } from '../../chunks/utils_Brf6JqFr.mjs';
export { renderers } from '../../renderers.mjs';

function AdminBookings({ user }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  useEffect(() => {
    fetchBookings();
  }, []);
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/bookings");
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleCancelBooking = async (bookingId) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/cancel`, {
        method: "POST"
      });
      if (response.ok) {
        alert("Booking cancelled successfully");
        fetchBookings();
        setSelectedBooking(null);
      } else {
        alert("Failed to cancel booking");
      }
    } catch (error) {
      alert("Error cancelling booking");
    }
  };
  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = "/admin/login";
  };
  const filteredBookings = bookings.filter((booking) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return booking.booking_id.toLowerCase().includes(query) || booking.confirmation_number?.toLowerCase().includes(query) || booking.hotel_name?.toLowerCase().includes(query) || booking.guest_email?.toLowerCase().includes(query) || `${booking.guest_first_name} ${booking.guest_last_name}`.toLowerCase().includes(query);
  });
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-neutral-50", children: [
    /* @__PURE__ */ jsx("header", { className: "bg-white border-b border-neutral-200 sticky top-0 z-40", children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center h-16", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6", children: [
        /* @__PURE__ */ jsxs("a", { href: "/admin", className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-lg bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center", children: /* @__PURE__ */ jsx(Hotel, { className: "w-6 h-6 text-white" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold text-neutral-900", children: "Telluride Ski Hotels" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-500", children: "Booking Management" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("nav", { className: "flex gap-4", children: [
          /* @__PURE__ */ jsx("a", { href: "/admin", className: "text-sm text-neutral-600 hover:text-neutral-900 font-medium", children: "Dashboard" }),
          /* @__PURE__ */ jsx("a", { href: "/admin/bookings", className: "text-sm text-primary-600 font-semibold border-b-2 border-primary-600", children: "Bookings" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-neutral-900", children: user?.email }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-500", children: "Administrator" })
        ] }),
        /* @__PURE__ */ jsxs(Button, { onClick: handleSignOut, variant: "outline", size: "sm", children: [
          /* @__PURE__ */ jsx(LogOut, { className: "w-4 h-4 mr-2" }),
          "Sign Out"
        ] })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsxs("main", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-neutral-900", children: "All Bookings" }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsx(Button, { onClick: fetchBookings, variant: "outline", size: "sm", children: "Refresh" }),
          /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", children: [
            /* @__PURE__ */ jsx(Download, { className: "w-4 h-4 mr-2" }),
            "Export CSV"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsxs("div", { className: "relative max-w-md", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            type: "text",
            placeholder: "Search by booking ID, guest name, email, or hotel...",
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value),
            className: "pl-10"
          }
        )
      ] }) }),
      loading ? /* @__PURE__ */ jsx("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" }) }) : /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-neutral-50 border-b border-neutral-200", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider", children: "Booking" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider", children: "Guest" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider", children: "Hotel" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider", children: "Dates" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider", children: "Amount" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "bg-white divide-y divide-neutral-200", children: filteredBookings.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 7, className: "px-4 py-12 text-center text-neutral-500", children: searchQuery ? "No bookings match your search" : "No bookings yet" }) }) : filteredBookings.map((booking) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-neutral-50 transition-colors", children: [
          /* @__PURE__ */ jsxs("td", { className: "px-4 py-4 whitespace-nowrap", children: [
            /* @__PURE__ */ jsxs("div", { className: "text-sm font-mono font-semibold text-neutral-900", children: [
              "#",
              booking.confirmation_number || booking.booking_id.slice(0, 8)
            ] }),
            booking.created_at && /* @__PURE__ */ jsx("div", { className: "text-xs text-neutral-500", children: new Date(booking.created_at).toLocaleDateString() })
          ] }),
          /* @__PURE__ */ jsxs("td", { className: "px-4 py-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "text-sm font-medium text-neutral-900", children: [
              booking.guest_first_name,
              " ",
              booking.guest_last_name
            ] }),
            booking.guest_email && /* @__PURE__ */ jsx("div", { className: "text-xs text-neutral-500", children: booking.guest_email })
          ] }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-4", children: /* @__PURE__ */ jsx("div", { className: "text-sm text-neutral-900", children: booking.hotel_name || "N/A" }) }),
          /* @__PURE__ */ jsxs("td", { className: "px-4 py-4 whitespace-nowrap", children: [
            /* @__PURE__ */ jsxs("div", { className: "text-sm text-neutral-900", children: [
              new Date(booking.checkin).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              " - ",
              new Date(booking.checkout).toLocaleDateString("en-US", { month: "short", day: "numeric" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-neutral-500", children: [
              booking.adults,
              " ",
              booking.adults === 1 ? "adult" : "adults",
              booking.children ? `, ${booking.children} ${booking.children === 1 ? "child" : "children"}` : ""
            ] })
          ] }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-4 whitespace-nowrap", children: /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold text-neutral-900", children: formatCurrency(booking.total?.amount || 0, booking.total?.currency || "USD") }) }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-4 whitespace-nowrap", children: /* @__PURE__ */ jsx("span", { className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${booking.status === "confirmed" ? "bg-green-100 text-green-800" : booking.status === "cancelled" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`, children: booking.status }) }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-4 whitespace-nowrap", children: /* @__PURE__ */ jsx(
            Button,
            {
              onClick: () => setSelectedBooking(booking),
              variant: "outline",
              size: "sm",
              children: "View"
            }
          ) })
        ] }, booking.booking_id)) })
      ] }) }) })
    ] }),
    selectedBooking && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl", children: [
      /* @__PURE__ */ jsxs("div", { className: "sticky top-0 bg-white border-b border-neutral-200 p-6 flex justify-between items-start", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold text-neutral-900", children: "Booking Details" }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-neutral-500 mt-1", children: [
            "#",
            selectedBooking.confirmation_number || selectedBooking.booking_id
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setSelectedBooking(null),
            className: "text-neutral-400 hover:text-neutral-600 transition-colors",
            children: /* @__PURE__ */ jsx(X, { className: "w-6 h-6" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h4", { className: "font-semibold text-neutral-900 mb-3 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Mail, { className: "w-5 h-5 text-primary-600" }),
            "Guest Information"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "bg-neutral-50 rounded-lg p-4 space-y-2", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-500", children: "Name" }),
              /* @__PURE__ */ jsxs("p", { className: "font-medium text-neutral-900", children: [
                selectedBooking.guest_first_name,
                " ",
                selectedBooking.guest_last_name
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-500", children: "Email" }),
              /* @__PURE__ */ jsx("p", { className: "font-medium text-neutral-900", children: selectedBooking.guest_email })
            ] }),
            selectedBooking.guest_phone && /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-500", children: "Phone" }),
              /* @__PURE__ */ jsx("p", { className: "font-medium text-neutral-900", children: selectedBooking.guest_phone })
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h4", { className: "font-semibold text-neutral-900 mb-3 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Hotel, { className: "w-5 h-5 text-primary-600" }),
            "Reservation Details"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-neutral-50 rounded-lg p-4 space-y-3", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-500", children: "Hotel" }),
              /* @__PURE__ */ jsx("p", { className: "font-medium text-neutral-900", children: selectedBooking.hotel_name })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-500", children: "Check-in" }),
                /* @__PURE__ */ jsx("p", { className: "font-medium text-neutral-900", children: new Date(selectedBooking.checkin).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-500", children: "Check-out" }),
                /* @__PURE__ */ jsx("p", { className: "font-medium text-neutral-900", children: new Date(selectedBooking.checkout).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-500", children: "Adults" }),
                /* @__PURE__ */ jsx("p", { className: "font-medium text-neutral-900", children: selectedBooking.adults })
              ] }),
              selectedBooking.children !== void 0 && selectedBooking.children > 0 && /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-500", children: "Children" }),
                /* @__PURE__ */ jsx("p", { className: "font-medium text-neutral-900", children: selectedBooking.children })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h4", { className: "font-semibold text-neutral-900 mb-3 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(DollarSign, { className: "w-5 h-5 text-primary-600" }),
            "Payment"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-neutral-50 rounded-lg p-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
              /* @__PURE__ */ jsx("span", { className: "text-neutral-600", children: "Total Amount" }),
              /* @__PURE__ */ jsx("span", { className: "text-2xl font-bold text-neutral-900", children: formatCurrency(selectedBooking.total?.amount || 0, selectedBooking.total?.currency || "USD") })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-3 pt-3 border-t border-neutral-200", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
              /* @__PURE__ */ jsx("span", { className: "text-sm text-neutral-600", children: "Status" }),
              /* @__PURE__ */ jsx("span", { className: `inline-flex px-3 py-1 text-xs font-semibold rounded-full ${selectedBooking.status === "confirmed" ? "bg-green-100 text-green-800" : selectedBooking.status === "cancelled" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`, children: selectedBooking.status.toUpperCase() })
            ] }) })
          ] })
        ] }),
        selectedBooking.status === "confirmed" && /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              onClick: () => handleCancelBooking(selectedBooking.booking_id),
              variant: "outline",
              className: "flex-1 border-red-300 text-red-700 hover:bg-red-50",
              children: "Cancel Booking"
            }
          ),
          /* @__PURE__ */ jsx(Button, { variant: "outline", className: "flex-1", children: "Contact Guest" })
        ] })
      ] })
    ] }) })
  ] });
}

const $$Astro = createAstro("https://tellurideskihotels.com");
const prerender = false;
const $$Bookings = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Bookings;
  const user = Astro2.locals.user;
  return renderTemplate`${renderComponent($$result, "PageLayout", $$PageLayout, { "title": "Manage Bookings - Admin Dashboard", "description": "View and manage all bookings", "noindex": true }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "AdminBookings", AdminBookings, { "client:load": true, "user": user, "client:component-hydration": "load", "client:component-path": "@/components/admin/AdminBookings", "client:component-export": "AdminBookings" })} ` })}`;
}, "C:/Users/ididi/OneDrive/Desktop/tellurideskihotels.com/src/pages/admin/bookings.astro", void 0);

const $$file = "C:/Users/ididi/OneDrive/Desktop/tellurideskihotels.com/src/pages/admin/bookings.astro";
const $$url = "/admin/bookings";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Bookings,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };

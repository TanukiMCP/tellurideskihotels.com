import { c as createAstro, a as createComponent, d as renderComponent, r as renderTemplate } from '../chunks/astro/server_DIEPIpiA.mjs';
import 'kleur/colors';
import 'html-escaper';
import { $ as $$PageLayout } from '../chunks/PageLayout_DgHuiZBJ.mjs';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { Card, AreaChart, BarChart } from '@tremor/react';
import { B as Button } from '../chunks/Button_Bs4Cal8d.mjs';
import { Hotel, LogOut, DollarSign, Calendar, TrendingUp, Users } from 'lucide-react';
import { a as authClient } from '../chunks/auth-client_CpbRk6Ze.mjs';
import { f as formatCurrency } from '../chunks/utils_Brf6JqFr.mjs';
export { renderers } from '../renderers.mjs';

function AdminDashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");
  useEffect(() => {
    fetchDashboardStats();
  }, [timeRange]);
  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/stats?range=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = "/admin/login";
  };
  if (loading && !stats) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-neutral-50 flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-neutral-50", children: [
    /* @__PURE__ */ jsx("header", { className: "bg-white border-b border-neutral-200 sticky top-0 z-40", children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center h-16", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6", children: [
        /* @__PURE__ */ jsxs("a", { href: "/admin", className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-lg bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center", children: /* @__PURE__ */ jsx(Hotel, { className: "w-6 h-6 text-white" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold text-neutral-900", children: "Telluride Ski Hotels" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-500", children: "Admin Dashboard" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("nav", { className: "flex gap-4", children: [
          /* @__PURE__ */ jsx("a", { href: "/admin", className: "text-sm text-primary-600 font-semibold border-b-2 border-primary-600", children: "Dashboard" }),
          /* @__PURE__ */ jsx("a", { href: "/admin/bookings", className: "text-sm text-neutral-600 hover:text-neutral-900 font-medium", children: "Bookings" })
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
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-neutral-900", children: "Analytics Overview" }),
        /* @__PURE__ */ jsx("div", { className: "flex gap-2", children: ["7d", "30d", "90d"].map((range) => /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setTimeRange(range),
            className: `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${timeRange === range ? "bg-primary-600 text-white" : "bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-300"}`,
            children: [
              range === "7d" && "Last 7 Days",
              range === "30d" && "Last 30 Days",
              range === "90d" && "Last 90 Days"
            ]
          },
          range
        )) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8", children: [
        /* @__PURE__ */ jsx(Card, { decoration: "top", decorationColor: "emerald", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-neutral-600", children: "Total Revenue" }),
            /* @__PURE__ */ jsx("p", { className: "text-3xl font-bold text-neutral-900 mt-2", children: formatCurrency(stats?.totalRevenue || 0, "USD") })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center", children: /* @__PURE__ */ jsx(DollarSign, { className: "w-6 h-6 text-emerald-600" }) })
        ] }) }),
        /* @__PURE__ */ jsx(Card, { decoration: "top", decorationColor: "blue", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-neutral-600", children: "Total Bookings" }),
            /* @__PURE__ */ jsx("p", { className: "text-3xl font-bold text-neutral-900 mt-2", children: stats?.totalBookings || 0 })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center", children: /* @__PURE__ */ jsx(Calendar, { className: "w-6 h-6 text-blue-600" }) })
        ] }) }),
        /* @__PURE__ */ jsx(Card, { decoration: "top", decorationColor: "violet", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-neutral-600", children: "Avg Booking Value" }),
            /* @__PURE__ */ jsx("p", { className: "text-3xl font-bold text-neutral-900 mt-2", children: formatCurrency(stats?.averageBookingValue || 0, "USD") })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center", children: /* @__PURE__ */ jsx(TrendingUp, { className: "w-6 h-6 text-violet-600" }) })
        ] }) }),
        /* @__PURE__ */ jsx(Card, { decoration: "top", decorationColor: "amber", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-neutral-600", children: "Active Guests" }),
            /* @__PURE__ */ jsx("p", { className: "text-3xl font-bold text-neutral-900 mt-2", children: stats?.recentBookings?.length || 0 })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center", children: /* @__PURE__ */ jsx(Users, { className: "w-6 h-6 text-amber-600" }) })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8", children: [
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-neutral-900 mb-4", children: "Revenue Trend" }),
          stats?.weeklyRevenue && stats.weeklyRevenue.length > 0 ? /* @__PURE__ */ jsx(
            AreaChart,
            {
              className: "h-72",
              data: stats.weeklyRevenue,
              index: "date",
              categories: ["revenue"],
              colors: ["emerald"],
              valueFormatter: (value) => formatCurrency(value, "USD"),
              showLegend: false,
              showGridLines: true,
              showAnimation: true
            }
          ) : /* @__PURE__ */ jsx("div", { className: "h-72 flex items-center justify-center text-neutral-500", children: "No data available" })
        ] }),
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-neutral-900 mb-4", children: "Top Performing Hotels" }),
          stats?.topHotels && stats.topHotels.length > 0 ? /* @__PURE__ */ jsx(
            BarChart,
            {
              className: "h-72",
              data: stats.topHotels,
              index: "name",
              categories: ["revenue"],
              colors: ["blue"],
              valueFormatter: (value) => formatCurrency(value, "USD"),
              showLegend: false,
              layout: "vertical",
              showAnimation: true
            }
          ) : /* @__PURE__ */ jsx("div", { className: "h-72 flex items-center justify-center text-neutral-500", children: "No data available" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-neutral-900", children: "Recent Bookings" }),
          /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", onClick: fetchDashboardStats, children: "Refresh" })
        ] }),
        stats?.recentBookings && stats.recentBookings.length > 0 ? /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-neutral-50 border-y border-neutral-200", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider", children: "Booking ID" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider", children: "Guest" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider", children: "Hotel" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider", children: "Check-in" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider", children: "Amount" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider", children: "Status" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "bg-white divide-y divide-neutral-200", children: stats.recentBookings.map((booking) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-neutral-50 transition-colors", children: [
            /* @__PURE__ */ jsxs("td", { className: "px-4 py-4 whitespace-nowrap text-sm font-mono text-neutral-900", children: [
              booking.id.slice(0, 8),
              "..."
            ] }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-4 whitespace-nowrap text-sm text-neutral-900", children: booking.guestName }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-4 text-sm text-neutral-900", children: booking.hotelName }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-4 whitespace-nowrap text-sm text-neutral-700", children: new Date(booking.checkIn).toLocaleDateString() }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-4 whitespace-nowrap text-sm font-semibold text-neutral-900", children: formatCurrency(booking.amount, "USD") }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-4 whitespace-nowrap", children: /* @__PURE__ */ jsx("span", { className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${booking.status === "confirmed" ? "bg-green-100 text-green-800" : booking.status === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`, children: booking.status }) })
          ] }, booking.id)) })
        ] }) }) : /* @__PURE__ */ jsx("div", { className: "text-center py-12 text-neutral-500", children: "No bookings yet" })
      ] })
    ] })
  ] });
}

const $$Astro = createAstro("https://tellurideskihotels.com");
const prerender = false;
const $$Index = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const user = Astro2.locals.user;
  return renderTemplate`${renderComponent($$result, "PageLayout", $$PageLayout, { "title": "Admin Dashboard - Telluride Ski Hotels", "description": "Admin dashboard", "noindex": true }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "AdminDashboard", AdminDashboard, { "client:load": true, "user": user, "client:component-hydration": "load", "client:component-path": "@/components/admin/AdminDashboard", "client:component-export": "AdminDashboard" })} ` })}`;
}, "C:/Users/ididi/OneDrive/Desktop/tellurideskihotels.com/src/pages/admin/index.astro", void 0);

const $$file = "C:/Users/ididi/OneDrive/Desktop/tellurideskihotels.com/src/pages/admin/index.astro";
const $$url = "/admin";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };

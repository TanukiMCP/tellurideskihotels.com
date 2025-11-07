import { a as createComponent, d as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_DIEPIpiA.mjs';
import 'kleur/colors';
import 'html-escaper';
import { $ as $$PageLayout } from '../../chunks/PageLayout_DgHuiZBJ.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState } from 'react';
import { C as Card, a as CardHeader, b as CardTitle, c as CardContent } from '../../chunks/Card_CsHJIv-j.mjs';
import { B as Button } from '../../chunks/Button_Bs4Cal8d.mjs';
import { I as Input } from '../../chunks/Input_AH10ORng.mjs';
import { a as authClient } from '../../chunks/auth-client_CpbRk6Ze.mjs';
export { renderers } from '../../renderers.mjs';

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await authClient.signIn.email({
        email,
        password
      });
      if (result.error) {
        throw new Error(result.error.message);
      }
      window.location.href = "/admin";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs(Card, { className: "w-full max-w-md shadow-2xl", children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "space-y-1 bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-t-xl", children: [
      /* @__PURE__ */ jsx(CardTitle, { className: "text-2xl font-bold", children: "Admin Dashboard" }),
      /* @__PURE__ */ jsx("p", { className: "text-primary-100 text-sm", children: "Sign in to access your dashboard" })
    ] }),
    /* @__PURE__ */ jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
      error && /* @__PURE__ */ jsx("div", { className: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm", children: error }),
      /* @__PURE__ */ jsx(
        Input,
        {
          label: "Email",
          type: "email",
          value: email,
          onChange: (e) => setEmail(e.target.value),
          placeholder: "admin@tellurideskihotels.com",
          required: true,
          autoComplete: "email"
        }
      ),
      /* @__PURE__ */ jsx(
        Input,
        {
          label: "Password",
          type: "password",
          value: password,
          onChange: (e) => setPassword(e.target.value),
          placeholder: "••••••••",
          required: true,
          autoComplete: "current-password"
        }
      ),
      /* @__PURE__ */ jsx(
        Button,
        {
          type: "submit",
          className: "w-full",
          size: "lg",
          isLoading: loading,
          children: "Sign In"
        }
      )
    ] }) })
  ] });
}

const prerender = false;
const $$Login = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "PageLayout", $$PageLayout, { "title": "Admin Login - Telluride Ski Hotels", "description": "Admin dashboard login", "noindex": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center p-4"> ${renderComponent($$result2, "AdminLogin", AdminLogin, { "client:load": true, "client:component-hydration": "load", "client:component-path": "@/components/admin/AdminLogin", "client:component-export": "AdminLogin" })} </div> ` })}`;
}, "C:/Users/ididi/OneDrive/Desktop/tellurideskihotels.com/src/pages/admin/login.astro", void 0);

const $$file = "C:/Users/ididi/OneDrive/Desktop/tellurideskihotels.com/src/pages/admin/login.astro";
const $$url = "/admin/login";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Login,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };

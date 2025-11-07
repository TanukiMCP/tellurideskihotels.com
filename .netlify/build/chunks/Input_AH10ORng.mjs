import { jsxs, jsx } from 'react/jsx-runtime';
import { b as cn } from './utils_Brf6JqFr.mjs';
import { forwardRef } from 'react';

const Input = forwardRef(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substring(2, 11)}`;
    return /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
      label && /* @__PURE__ */ jsx("label", { htmlFor: inputId, className: "block text-sm font-semibold text-neutral-900 mb-2", children: label }),
      /* @__PURE__ */ jsx(
        "input",
        {
          ref,
          id: inputId,
          className: cn(
            "flex h-12 w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-2.5 text-base",
            "ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-neutral-400",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-all duration-200",
            error && "border-red-500 focus-visible:ring-red-500",
            className
          ),
          ...props
        }
      ),
      error && /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-red-600", children: error })
    ] });
  }
);
Input.displayName = "Input";

export { Input as I };

import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { b as cn } from './utils_Brf6JqFr.mjs';
import { forwardRef } from 'react';

const Button = forwardRef(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: "bg-primary-600 !text-white hover:bg-primary-700 active:bg-primary-800 shadow-card hover:shadow-card-hover font-semibold",
      secondary: "bg-secondary-500 text-white hover:bg-secondary-600 active:bg-secondary-700 font-semibold",
      outline: "border-2 border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-50 font-medium",
      ghost: "text-neutral-700 hover:bg-neutral-100 font-medium"
    };
    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-2.5 text-base",
      lg: "px-8 py-3 text-lg"
    };
    return /* @__PURE__ */ jsx(
      "button",
      {
        ref,
        className: cn(
          "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300",
          "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variants[variant],
          sizes[size],
          className
        ),
        disabled: disabled || isLoading,
        ...props,
        children: isLoading ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs(
            "svg",
            {
              className: "mr-2 h-4 w-4 animate-spin",
              xmlns: "http://www.w3.org/2000/svg",
              fill: "none",
              viewBox: "0 0 24 24",
              children: [
                /* @__PURE__ */ jsx(
                  "circle",
                  {
                    className: "opacity-25",
                    cx: "12",
                    cy: "12",
                    r: "10",
                    stroke: "currentColor",
                    strokeWidth: "4"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "path",
                  {
                    className: "opacity-75",
                    fill: "currentColor",
                    d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  }
                )
              ]
            }
          ),
          "Loading..."
        ] }) : children
      }
    );
  }
);
Button.displayName = "Button";

export { Button as B };

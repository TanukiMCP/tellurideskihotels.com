import { jsx } from 'react/jsx-runtime';
import { a as cn } from './utils_CwWswjZg.mjs';
import { forwardRef } from 'react';

const Card = forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx(
    "div",
    {
      ref,
      className: cn("rounded-xl border border-gray-200 bg-white shadow-soft hover:shadow-medium transition-shadow duration-300", className),
      ...props
    }
  )
);
Card.displayName = "Card";
const CardHeader = forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("flex flex-col space-y-1.5 p-6", className), ...props })
);
CardHeader.displayName = "CardHeader";
const CardTitle = forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx(
    "h3",
    {
      ref,
      className: cn("text-2xl font-semibold leading-none tracking-tight", className),
      ...props
    }
  )
);
CardTitle.displayName = "CardTitle";
const CardContent = forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("p-6 pt-0", className), ...props })
);
CardContent.displayName = "CardContent";

export { Card as C, CardHeader as a, CardTitle as b, CardContent as c };

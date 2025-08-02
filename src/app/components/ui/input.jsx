import { forwardRef } from "react";

const inputVariants = {
  base: "flex h-10 w-full rounded-xl border bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 ring-offset-white dark:ring-offset-gray-900 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
  variants: {
    default:
      "border-gray-300 dark:border-gray-600 focus:border-primary-500 dark:focus:border-primary-400",
    error:
      "border-error-500 focus:border-error-500 focus-visible:ring-error-500",
  },
};

const getInputClasses = (variant = "default", className = "") => {
  return `${inputVariants.base} ${inputVariants.variants[variant]} ${className}`.trim();
};

export const Input = forwardRef(
  ({ className = "", type = "text", variant = "default", ...props }, ref) => {
    return (
      <input
        type={type}
        className={getInputClasses(variant, className)}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export const Label = ({ children, htmlFor, className = "", ...props }) => (
  <label
    htmlFor={htmlFor}
    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-gray-300 ${className}`}
    {...props}
  >
    {children}
  </label>
);

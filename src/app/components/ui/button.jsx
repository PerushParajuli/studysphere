const buttonVariants = {
  base: "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-offset-2",
  variants: {
    primary:
      "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm hover:shadow-md",
    secondary:
      "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white focus:ring-gray-500",
    destructive:
      "bg-error-500 text-white hover:bg-error-600 focus:ring-error-500 shadow-sm hover:shadow-md",
    outline:
      "border border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 focus:ring-primary-500 bg-white dark:bg-gray-800",
    ghost:
      "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-gray-500",
  },
  sizes: {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  },
};

const getButtonClasses = (variant = "primary", size = "md", className = "") => {
  return `${buttonVariants.base} ${buttonVariants.variants[variant]} ${buttonVariants.sizes[size]} ${className}`.trim();
};

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) => (
  <button className={getButtonClasses(variant, size, className)} {...props}>
    {children}
  </button>
);

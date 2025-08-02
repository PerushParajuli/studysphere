const cardVariants = {
  base: "rounded-2xl border bg-white text-gray-950 shadow-soft dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50",
  variants: {
    default: "",
    elevated: "shadow-medium",
  },
};

const getCardClasses = (variant = "default", className = "") => {
  return `${cardVariants.base} ${cardVariants.variants[variant]} ${className}`.trim();
};

export const Card = ({
  children,
  variant = "default",
  className = "",
  ...props
}) => (
  <div className={getCardClasses(variant, className)} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ children, className = "", ...props }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = "", ...props }) => (
  <h3
    className={`text-2xl font-semibold leading-none tracking-tight ${className}`}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription = ({ children, className = "", ...props }) => (
  <p
    className={`text-sm text-gray-500 dark:text-gray-400 ${className}`}
    {...props}
  >
    {children}
  </p>
);

export const CardContent = ({ children, className = "", ...props }) => (
  <div className={`p-6 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = "", ...props }) => (
  <div className={`flex items-center p-6 ${className}`} {...props}>
    {children}
  </div>
);

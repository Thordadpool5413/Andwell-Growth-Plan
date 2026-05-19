import React from "react";
import { useDarkMode } from "./DarkModeContext.jsx";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon = null,
  fullWidth = false,
  className = "",
  ...props
}) {
  const { dark } = useDarkMode();

  const baseStyles = "font-semibold transition-smooth focus-ring inline-flex items-center gap-2 justify-center";

  const sizeStyles = {
    sm: "px-3 py-1 text-xs rounded-md",
    md: "px-4 py-2 text-sm rounded-lg",
    lg: "px-6 py-3 text-base rounded-lg",
    xl: "px-8 py-4 text-lg rounded-xl",
  };

  const variantStyles = {
    primary: dark
      ? "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400"
      : "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400",
    secondary: dark
      ? "bg-slate-700 text-white hover:bg-slate-600 disabled:bg-slate-800"
      : "bg-slate-200 text-slate-900 hover:bg-slate-300 disabled:bg-slate-100",
    ghost: dark
      ? "text-slate-200 hover:bg-slate-700 disabled:text-slate-500"
      : "text-slate-700 hover:bg-slate-100 disabled:text-slate-400",
    danger: dark
      ? "bg-error-600 text-white hover:bg-error-700 disabled:bg-error-500"
      : "bg-error-600 text-white hover:bg-error-700 disabled:bg-error-400",
    success: dark
      ? "bg-success-600 text-white hover:bg-success-700 disabled:bg-success-500"
      : "bg-success-600 text-white hover:bg-success-700 disabled:bg-success-400",
    outline: dark
      ? "border border-slate-500 text-slate-200 hover:bg-slate-700 disabled:opacity-50"
      : "border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50",
  };

  const widthStyles = fullWidth ? "w-full" : "";
  const disabledStyles = disabled ? "opacity-60 cursor-not-allowed" : "";

  const combinedClassName = `
    ${baseStyles}
    ${sizeStyles[size]}
    ${variantStyles[variant]}
    ${widthStyles}
    ${disabledStyles}
    ${className}
  `;

  return (
    <button className={combinedClassName} disabled={disabled || loading} {...props}>
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {icon && !loading && icon}
      {children}
    </button>
  );
}

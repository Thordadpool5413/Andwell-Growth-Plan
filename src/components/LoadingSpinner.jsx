import React from "react";
import { useDarkMode } from "./DarkModeContext.jsx";

export default function LoadingSpinner({ size = "md", fullscreen = false, message = "Loading..." }) {
  const { dark } = useDarkMode();

  const sizeStyles = {
    sm: "w-6 h-6",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const spinner = (
    <div className={`relative ${sizeStyles[size]}`}>
      <svg
        className={`absolute inset-0 animate-spin ${dark ? "text-blue-400" : "text-blue-600"}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className={`opacity-25 ${dark ? "text-slate-700" : "text-slate-200"}`}
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );

  if (fullscreen) {
    return (
      <div
        className={`
          fixed inset-0 flex flex-col items-center justify-center z-50
          ${dark ? "bg-slate-900/80" : "bg-slate-900/20"}
          backdrop-blur-sm
        `}
      >
        {spinner}
        {message && (
          <p className={`mt-4 text-lg font-semibold ${dark ? "text-slate-200" : "text-slate-700"}`}>
            {message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      {spinner}
      {message && (
        <p className={`mt-4 text-sm font-medium ${dark ? "text-slate-400" : "text-slate-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
}

import React, { useState } from "react";
import { useDarkMode } from "./DarkModeContext.jsx";

export default function Tooltip({ children, content, position = "top", className = "" }) {
  const [isVisible, setIsVisible] = useState(false);
  const { dark } = useDarkMode();

  const positionStyles = {
    top: "bottom-full mb-2 -translate-x-1/2 left-1/2",
    bottom: "top-full mt-2 -translate-x-1/2 left-1/2",
    left: "right-full mr-2 top-1/2 -translate-y-1/2",
    right: "left-full ml-2 top-1/2 -translate-y-1/2",
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {isVisible && (
        <div
          className={`
            absolute ${positionStyles[position]} z-50 
            whitespace-nowrap px-3 py-2 rounded-lg text-sm font-medium
            pointer-events-none animate-fade-in
            ${dark
              ? "bg-slate-900 text-slate-100 shadow-lg shadow-slate-900/50"
              : "bg-slate-800 text-white shadow-lg shadow-slate-800/50"
            }
          `}
        >
          {content}
          <div
            className={`
              absolute w-2 h-2 transform rotate-45
              ${dark ? "bg-slate-900" : "bg-slate-800"}
              ${
                position === "top"
                  ? "top-full left-1/2 -translate-x-1/2 -translate-y-1/2"
                  : position === "bottom"
                    ? "bottom-full left-1/2 -translate-x-1/2 translate-y-1/2"
                    : position === "left"
                      ? "left-full top-1/2 -translate-y-1/2 translate-x-1/2"
                      : "right-full top-1/2 -translate-y-1/2 -translate-x-1/2"
              }
            `}
          />
        </div>
      )}
    </div>
  );
}

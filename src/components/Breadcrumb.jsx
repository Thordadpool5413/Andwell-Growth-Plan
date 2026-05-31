import React from "react";
import { useDarkMode } from "./DarkModeContext.jsx";
import { ChevronRight } from "lucide-react";

export default function Breadcrumb({ items = [] }) {
  const { dark } = useDarkMode();

  if (items.length === 0) return null;

  return (
    <nav className={`
      flex items-center gap-2 text-sm mb-4 px-1 py-2
      ${dark ? "text-slate-400" : "text-slate-600"}
    `}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && <ChevronRight className="w-4 h-4 opacity-50" />}
          {item.href ? (
            <a
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                item.onClick?.();
              }}
              className={`
                hover:font-semibold transition-smooth
                ${dark 
                  ? "hover:text-blue-400" 
                  : "hover:text-blue-600"}
              `}
            >
              {item.label}
            </a>
          ) : (
            <span className={`
              font-medium
              ${dark ? "text-slate-200" : "text-slate-900"}
            `}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}

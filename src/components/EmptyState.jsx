import React from "react";
import { useDarkMode } from "./DarkModeContext.jsx";
import { AlertCircle, TrendingUp, Search } from "lucide-react";

export default function EmptyState({ 
  title, 
  description, 
  icon = null,
  action = null,
  type = "empty"
}) {
  const { dark } = useDarkMode();

  const icons = {
    empty: AlertCircle,
    search: Search,
    data: TrendingUp,
  };

  const IconComponent = icon || icons[type] || AlertCircle;

  const iconColors = {
    light: "text-slate-300",
    dark: "text-slate-600",
  };

  return (
    <div className={`
      empty-state rounded-2xl border-2 border-dashed
      ${dark 
        ? "border-slate-700 bg-slate-800/30" 
        : "border-slate-300 bg-slate-50"}
    `}>
      <IconComponent className={`
        w-16 h-16 mx-auto mb-4 
        ${dark ? iconColors.dark : iconColors.light}
      `} />
      <h3 className={`
        text-lg font-bold mb-2
        ${dark ? "text-slate-300" : "text-slate-700"}
      `}>
        {title}
      </h3>
      <p className={`
        text-sm mb-6
        ${dark ? "text-slate-400" : "text-slate-500"}
      `}>
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className={`
            px-4 py-2 rounded-lg font-medium transition-smooth
            ${dark
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-blue-500 hover:bg-blue-600 text-white"}
          `}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

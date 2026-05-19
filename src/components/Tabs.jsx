import React, { useState } from "react";
import { useDarkMode } from "./DarkModeContext.jsx";

export default function Tabs({
  tabs,
  defaultTab = 0,
  onChange,
  className = "",
}) {
  const { dark } = useDarkMode();
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleChange = (index) => {
    setActiveTab(index);
    onChange?.(index);
  };

  return (
    <div className={className}>
      {/* Tab list */}
      <div
        className={`
          flex border-b overflow-x-auto
          ${dark ? "border-slate-700" : "border-slate-200"}
        `}
      >
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => handleChange(index)}
            className={`
              px-4 py-3 font-semibold text-sm whitespace-nowrap transition-colors
              border-b-2 -mb-px
              ${
                activeTab === index
                  ? dark
                    ? "border-blue-500 text-blue-400"
                    : "border-blue-600 text-blue-600"
                  : dark
                    ? "border-transparent text-slate-400 hover:text-slate-300"
                    : "border-transparent text-slate-600 hover:text-slate-700"
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div
        className={`
          py-4 animate-fade-in
        `}
      >
        {tabs[activeTab]?.content}
      </div>
    </div>
  );
}

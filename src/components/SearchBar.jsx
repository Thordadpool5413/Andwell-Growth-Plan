import React, { useState, useRef, useEffect } from "react";
import { useDarkMode } from "./DarkModeContext.jsx";
import { Search, X } from "lucide-react";

export default function SearchBar({
  placeholder = "Search...",
  value = "",
  onChange,
  onClear,
  suggestions = [],
  onSelect,
  className = "",
}) {
  const { dark } = useDarkMode();
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (value && suggestions.length > 0) {
      const filtered = suggestions.filter((s) =>
        (typeof s === "string" ? s : s.label).toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setIsOpen(filtered.length > 0);
    } else {
      setFilteredSuggestions([]);
      setIsOpen(false);
    }
  }, [value, suggestions]);

  return (
    <div className={`relative ${className}`}>
      <div
        className={`
          flex items-center gap-2 rounded-lg border px-3 py-2 transition-smooth
          ${dark
            ? "border-slate-600 bg-slate-800 focus-within:border-blue-500 focus-within:bg-slate-750"
            : "border-slate-300 bg-white focus-within:border-blue-500 focus-within:bg-slate-50"
          }
        `}
      >
        <Search className={`h-4 w-4 ${dark ? "text-slate-500" : "text-slate-400"}`} />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={() => value && setIsOpen(true)}
          className={`
            flex-1 bg-transparent outline-none text-sm
            ${dark ? "text-white placeholder-slate-500" : "text-slate-900 placeholder-slate-500"}
          `}
        />
        {value && (
          <button
            onClick={() => {
              onChange?.("");
              onClear?.();
              setFilteredSuggestions([]);
            }}
            className={`hover:opacity-70 transition-opacity`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && filteredSuggestions.length > 0 && (
        <div
          className={`
            absolute top-full left-0 right-0 mt-2 rounded-lg border shadow-lg z-50
            max-h-64 overflow-y-auto animate-slide-in
            ${dark ? "border-slate-600 bg-slate-800" : "border-slate-200 bg-white"}
          `}
        >
          {filteredSuggestions.map((item, index) => {
            const label = typeof item === "string" ? item : item.label;
            const key = typeof item === "string" ? label : item.value;

            return (
              <button
                key={key || index}
                onClick={() => {
                  onSelect?.(item);
                  setIsOpen(false);
                }}
                className={`
                  w-full text-left px-4 py-2 transition-colors text-sm
                  ${
                    index === 0
                      ? dark
                        ? "bg-slate-700"
                        : "bg-slate-100"
                      : ""
                  }
                  hover:${dark ? "bg-slate-700" : "bg-slate-100"}
                  ${dark ? "text-slate-200 hover:text-white" : "text-slate-700 hover:text-slate-900"}
                `}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

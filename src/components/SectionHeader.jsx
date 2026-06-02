import React from "react";
import { useDarkMode } from "./DarkModeContext.jsx";

export default function SectionHeader({ eyebrow, title, children }) {
  const { dark } = useDarkMode();
  return (
    <div className="mb-6">
      {eyebrow && (
        <p className={`mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${dark ? "text-slate-500" : "text-slate-400"}`}>
          {eyebrow}
        </p>
      )}
      <h2 className={`text-2xl font-semibold leading-tight tracking-tight ${dark ? "text-slate-100" : "text-slate-900"}`}>
        {title}
      </h2>
      {children && (
        <p className={`mt-2 max-w-4xl text-sm leading-6 ${dark ? "text-slate-400" : "text-slate-500"}`}>
          {children}
        </p>
      )}
      <div className={`mt-4 h-px ${dark ? "bg-slate-800" : "bg-slate-100"}`} />
    </div>
  );
}

import React from "react";
import { useDarkMode } from "./DarkModeContext.jsx";

export default function SectionHeader({ eyebrow, title, children }) {
  const { dark } = useDarkMode();
  return (
    <div className={`mb-6 rounded-[24px] border px-5 py-5 transition-colors duration-200 sm:px-6 ${
      dark ? "border-slate-800/70 bg-slate-900/55 shadow-sm shadow-slate-950/20" : "border-slate-200 bg-white/80 shadow-sm shadow-slate-200/50"
    }`}>
      {eyebrow && (
        <p className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
          dark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
        }`}>
          {eyebrow}
        </p>
      )}
      <h2 className={`mt-4 text-2xl font-semibold leading-tight tracking-tight ${dark ? "text-slate-100" : "text-slate-900"}`}>
        {title}
      </h2>
      {children && (
        <p className={`mt-3 max-w-4xl text-sm leading-6 ${dark ? "text-slate-400" : "text-slate-600"}`}>
          {children}
        </p>
      )}
      <div className={`mt-5 h-px bg-gradient-to-r ${dark ? "from-blue-500/20 via-slate-700 to-transparent" : "from-blue-200 via-slate-200 to-transparent"}`} />
    </div>
  );
}

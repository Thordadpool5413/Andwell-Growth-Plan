import React from "react";
import { useDarkMode } from "./DarkModeContext.jsx";

export default function SectionHeader({ eyebrow, title, children }) {
  const { dark } = useDarkMode();
  return (
    <div className={`mb-6 overflow-hidden rounded-[20px] border transition-colors duration-200 ${
      dark
        ? "border-slate-800/60 bg-gradient-to-br from-slate-900/70 to-slate-800/50 shadow-sm shadow-slate-950/20"
        : "border-slate-200/80 bg-gradient-to-br from-white to-slate-50/80 shadow-sm shadow-slate-100/80"
    }`}>
      <div className={`h-0.5 w-full bg-gradient-to-r ${dark ? "from-blue-500/50 via-violet-500/30 to-transparent" : "from-blue-400/60 via-violet-400/30 to-transparent"}`} />
      <div className="px-6 py-5">
        {eyebrow && (
          <p className={`inline-flex items-center rounded-full border px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] ${
            dark
              ? "border-slate-700/70 bg-slate-800/80 text-slate-400"
              : "border-slate-200 bg-slate-100/80 text-slate-500"
          }`}>
            {eyebrow}
          </p>
        )}
        <h2 className={`mt-3 text-xl font-semibold leading-tight tracking-tight ${dark ? "text-slate-100" : "text-slate-900"}`}>
          {title}
        </h2>
        {children && (
          <p className={`mt-2.5 max-w-4xl text-sm leading-6 ${dark ? "text-slate-400" : "text-slate-600"}`}>
            {children}
          </p>
        )}
      </div>
    </div>
  );
}

import React from "react";
import { useDarkMode } from "./DarkModeContext.jsx";

const ACCENT_COLORS = {
  emerald: "border-l-[3px] border-l-emerald-500",
  amber:   "border-l-[3px] border-l-amber-500",
  indigo:  "border-l-[3px] border-l-blue-500",
  blue:    "border-l-[3px] border-l-blue-500",
  red:     "border-l-[3px] border-l-red-500",
  slate:   "border-l-[3px] border-l-slate-400",
  violet:  "border-l-[3px] border-l-violet-500",
};

export default function Card({ title, eyebrow, children, accent, flush }) {
  const { dark } = useDarkMode();
  const accentClass = accent ? ACCENT_COLORS[accent] || "" : "";
  const paddingClass = flush ? "p-0" : "p-5";

  return (
    <section
      className={`group overflow-hidden rounded-[20px] border backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 ${paddingClass} ${accentClass} ${
        dark
          ? "border-slate-700/50 bg-gradient-to-br from-slate-900/90 to-slate-800/70 shadow-md shadow-slate-950/30 hover:border-slate-600/60 hover:shadow-lg hover:shadow-slate-950/40"
          : "border-slate-200/80 bg-gradient-to-br from-white to-slate-50/80 shadow-sm shadow-slate-200/80 hover:border-slate-300/70 hover:shadow-md hover:shadow-slate-200/70"
      }`}
    >
      {(eyebrow || title) && (
        <div className={flush ? "px-6 pt-5 pb-3" : ""}>
          {eyebrow && (
            <p className={`mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] ${dark ? "text-slate-500" : "text-slate-400"}`}>
              {eyebrow}
            </p>
          )}
          {title && (
            <h3 className={`text-sm font-semibold leading-snug tracking-tight sm:text-[15px] ${dark ? "text-slate-100" : "text-slate-800"}`}>
              {title}
            </h3>
          )}
        </div>
      )}
      <div className={flush && (eyebrow || title) ? "" : flush ? "" : "mt-4"}>
        {children}
      </div>
    </section>
  );
}

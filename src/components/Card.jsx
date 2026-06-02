import React from "react";
import { useDarkMode } from "./DarkModeContext.jsx";

const ACCENT_COLORS = {
  emerald: "border-l-4 border-l-emerald-500",
  amber: "border-l-4 border-l-amber-500",
  indigo: "border-l-4 border-l-blue-500",
  blue: "border-l-4 border-l-blue-500",
  red: "border-l-4 border-l-red-500",
  slate: "border-l-4 border-l-slate-400",
};

export default function Card({ title, eyebrow, children, accent, flush }) {
  const { dark } = useDarkMode();
  const accentClass = accent ? ACCENT_COLORS[accent] || "" : "";
  const paddingClass = flush ? "p-0" : "p-6";

  return (
    <section
      className={`rounded-xl border transition-colors duration-200 ${paddingClass} ${accentClass} ${
        dark
          ? "border-slate-700/60 bg-slate-800/60 shadow-sm shadow-slate-900/20"
          : "border-slate-200 bg-white shadow-sm shadow-slate-100"
      }`}
    >
      {(eyebrow || title) && (
        <div className={flush ? "px-6 pt-5 pb-4" : ""}>
          {eyebrow && (
            <p className={`mb-1 text-[11px] font-medium uppercase tracking-[0.12em] ${dark ? "text-slate-500" : "text-slate-400"}`}>
              {eyebrow}
            </p>
          )}
          {title && (
            <h3 className={`text-base font-semibold leading-snug ${dark ? "text-slate-100" : "text-slate-800"}`}>
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

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
      className={`group overflow-hidden rounded-[24px] border backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl ${paddingClass} ${accentClass} ${
        dark
          ? "border-slate-700/60 bg-gradient-to-br from-slate-900/85 to-slate-800/65 shadow-sm shadow-slate-950/20"
          : "border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 shadow-sm shadow-slate-200/60"
      }`}
    >
      {(eyebrow || title) && (
        <div className={flush ? "px-6 pt-5 pb-4" : ""}>
          {eyebrow && (
            <p className={`mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${dark ? "text-slate-500" : "text-slate-400"}`}>
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

import React from "react";
import { useDarkMode } from "./DarkModeContext.jsx";

const ACCENT_COLORS = {
  emerald: "border-l-4 border-l-brand-green",
  amber: "border-l-4 border-l-brand-amber",
  indigo: "border-l-4 border-l-brand-blue",
  violet: "border-l-4 border-l-brand-purple",
  blue: "border-l-4 border-l-brand-blue",
  red: "border-l-4 border-l-brand-red",
};

export default function Card({ title, eyebrow, children, accent, flush }) {
  const { dark } = useDarkMode();
  const accentClass = accent ? ACCENT_COLORS[accent] || "" : "";
  const paddingClass = flush ? "p-0" : "p-6";

  return (
    <section className={`rounded-3xl border shadow-md backdrop-blur-md transition-all duration-300 ${paddingClass} ${accentClass} ${dark ? "border-slate-700/50 bg-slate-800/80 shadow-slate-900/40" : "border-slate-200 bg-white/90 shadow-slate-200/60"}`}>
      {(eyebrow || title) && (
        <div className={flush ? "px-6 pt-6 pb-4" : ""}>
          {eyebrow && <p className={`mb-2 text-xs font-black uppercase tracking-[0.22em] ${dark ? "text-blue-400" : "text-blue-700"}`}>{eyebrow}</p>}
          {title && <h2 className={`text-xl font-black ${dark ? "text-white" : "text-slate-950"}`}>{title}</h2>}
        </div>
      )}
      <div className={flush && (eyebrow || title) ? "" : flush ? "" : "mt-4"}>{children}</div>
    </section>
  );
}

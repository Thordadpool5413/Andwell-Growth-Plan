import React from "react";
import { useDarkMode } from "./DarkModeContext.jsx";

export default function Card({ title, eyebrow, children, className = "" }) {
  const { dark } = useDarkMode();
  return (
    <section className={`
      rounded-xl border p-6 elevation-2 transition-smooth
      ${dark 
        ? "border-slate-700/60 bg-gradient-to-br from-slate-800/80 to-slate-800/60 backdrop-blur-sm hover:from-slate-800/90 hover:to-slate-800/70" 
        : "border-slate-200/60 bg-gradient-to-br from-white/90 to-slate-50/90 backdrop-blur-sm hover:from-white hover:to-slate-50"}
      hover:shadow-lg hover:scale-[1.01]
      ${className}
    `}>
      <p className={`
        mb-2 text-label 
        ${dark ? "text-blue-400" : "text-blue-600"}
      `}>
        {eyebrow}
      </p>
      <h2 className={`
        text-heading-sm font-bold 
        ${dark ? "text-white" : "text-slate-950"}
      `}>
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

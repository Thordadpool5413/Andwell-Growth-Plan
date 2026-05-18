import React from "react";
import { useDarkMode } from "./DarkModeContext.jsx";

export default function Card({ title, eyebrow, children }) {
  const { dark } = useDarkMode();
  return (
    <section className={`rounded-3xl border p-6 shadow-sm backdrop-blur transition-colors duration-300 ${dark ? "border-slate-700 bg-slate-800/80 shadow-slate-900/30" : "border-slate-200 bg-white/95 shadow-slate-200/70"}`}>
      <p className={`mb-2 text-xs font-black uppercase tracking-[0.22em] ${dark ? "text-blue-400" : "text-blue-700"}`}>{eyebrow}</p>
      <h2 className={`text-xl font-black ${dark ? "text-white" : "text-slate-950"}`}>{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

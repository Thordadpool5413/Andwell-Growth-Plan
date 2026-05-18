import React from "react";
import { useDarkMode } from "./DarkModeContext.jsx";

export default function SectionHeader({ eyebrow, title, children }) {
  const { dark } = useDarkMode();
  return (
    <div className="mb-5">
      <p className={`text-xs font-black uppercase tracking-[0.22em] ${dark ? "text-blue-400" : "text-blue-700"}`}>{eyebrow}</p>
      <h2 className={`mt-2 text-2xl font-black tracking-tight md:text-3xl ${dark ? "text-white" : "text-slate-950"}`}>{title}</h2>
      {children ? <p className={`mt-2 max-w-4xl text-sm leading-6 ${dark ? "text-slate-400" : "text-slate-600"}`}>{children}</p> : null}
    </div>
  );
}

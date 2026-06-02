import React, { useState } from "react";
import { useDarkMode } from "./DarkModeContext.jsx";

export default function MethodologyCallout({ title = "How is this calculated?", children }) {
  const { dark } = useDarkMode();
  const [open, setOpen] = useState(false);

  return (
    <div className={`rounded-xl border transition-all ${open ? dark ? "border-blue-700/50 bg-blue-950/20" : "border-blue-200 bg-blue-50/60" : dark ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50"}`}>
      <button
        onClick={() => setOpen((p) => !p)}
        className={`flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium transition ${dark ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}
        aria-expanded={open}
      >
        <span className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-medium transition-transform ${open ? "rotate-90" : ""} ${dark ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-600"}`}>
          ▶
        </span>
        <span className={`text-[11px] font-medium uppercase tracking-wide ${dark ? "text-blue-400" : "text-blue-600"}`}>
          {title}
        </span>
      </button>
      {open && (
        <div className={`border-t px-4 pb-4 pt-3 text-sm leading-6 ${dark ? "border-slate-700 text-slate-300" : "border-slate-200 text-slate-700"}`}>
          {children}
        </div>
      )}
    </div>
  );
}

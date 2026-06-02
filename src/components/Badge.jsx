import React from "react";
import { useDarkMode } from "./DarkModeContext.jsx";

const lightTones = {
  blue:  "bg-blue-50 text-blue-700 border-blue-200/80",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  amber: "bg-amber-50 text-amber-700 border-amber-200/80",
  red:   "bg-red-50 text-red-700 border-red-200/80",
  slate: "bg-slate-50 text-slate-600 border-slate-200",
  purple:"bg-slate-50 text-slate-600 border-slate-200",
};

const darkTones = {
  blue:  "bg-blue-950/40 text-blue-300 border-blue-800/50",
  green: "bg-emerald-950/40 text-emerald-300 border-emerald-800/50",
  amber: "bg-amber-950/40 text-amber-300 border-amber-800/50",
  red:   "bg-red-950/40 text-red-300 border-red-800/50",
  slate: "bg-slate-800/60 text-slate-300 border-slate-600/50",
  purple:"bg-slate-800/60 text-slate-300 border-slate-600/50",
};

export default function Badge({ children, tone = "slate" }) {
  const { dark } = useDarkMode();
  const tones = dark ? darkTones : lightTones;
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-semibold leading-4 ${tones[tone] || tones.slate}`}>
      {children}
    </span>
  );
}

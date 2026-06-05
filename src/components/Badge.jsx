import React from "react";
import { useDarkMode } from "./DarkModeContext.jsx";

const lightTones = {
  blue:  "bg-blue-100/90 text-blue-800 border-blue-300/80",
  green: "bg-emerald-100/90 text-emerald-800 border-emerald-300/80",
  amber: "bg-amber-100/90 text-amber-800 border-amber-300/80",
  red:   "bg-red-100/90 text-red-800 border-red-300/80",
  slate: "bg-slate-100/90 text-slate-700 border-slate-300/80",
  purple:"bg-violet-100/90 text-violet-800 border-violet-300/80",
};

const darkTones = {
  blue:  "bg-blue-950/50 text-blue-300 border-blue-800/60",
  green: "bg-emerald-950/50 text-emerald-300 border-emerald-800/60",
  amber: "bg-amber-950/50 text-amber-300 border-amber-800/60",
  red:   "bg-red-950/50 text-red-300 border-red-800/60",
  slate: "bg-slate-800/70 text-slate-300 border-slate-600/60",
  purple:"bg-violet-950/50 text-violet-300 border-violet-800/60",
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

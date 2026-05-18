import React from "react";
import { useDarkMode } from "./DarkModeContext.jsx";

const lightTones = {
  blue: "bg-blue-50 text-blue-800 border-blue-200",
  green: "bg-green-50 text-green-800 border-green-200",
  amber: "bg-amber-50 text-amber-800 border-amber-200",
  red: "bg-red-50 text-red-800 border-red-200",
  purple: "bg-purple-50 text-purple-800 border-purple-200",
  slate: "bg-slate-50 text-slate-800 border-slate-200",
};

const darkTones = {
  blue: "bg-blue-950 text-blue-300 border-blue-800",
  green: "bg-green-950 text-green-300 border-green-800",
  amber: "bg-amber-950 text-amber-300 border-amber-800",
  red: "bg-red-950 text-red-300 border-red-800",
  purple: "bg-purple-950 text-purple-300 border-purple-800",
  slate: "bg-slate-800 text-slate-300 border-slate-600",
};

export default function Badge({ children, tone = "blue" }) {
  const { dark } = useDarkMode();
  const tones = dark ? darkTones : lightTones;
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${tones[tone]}`}>
      {children}
    </span>
  );
}

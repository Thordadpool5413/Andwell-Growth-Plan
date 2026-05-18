import React from "react";

const tones = {
  blue: "bg-blue-50 text-blue-800 border-blue-200",
  green: "bg-green-50 text-green-800 border-green-200",
  amber: "bg-amber-50 text-amber-800 border-amber-200",
  red: "bg-red-50 text-red-800 border-red-200",
  purple: "bg-purple-50 text-purple-800 border-purple-200",
  slate: "bg-slate-50 text-slate-800 border-slate-200",
};

export default function Badge({ children, tone = "blue" }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${tones[tone]}`}>
      {children}
    </span>
  );
}

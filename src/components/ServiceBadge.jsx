import React from "react";
import services from "../data/services.js";
import { COLORS } from "../data/constants.js";

export default function ServiceBadge({ service }) {
  const color = services[service]?.color || COLORS.slate;
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-800 shadow-sm">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {service}
    </span>
  );
}

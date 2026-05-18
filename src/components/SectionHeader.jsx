import React from "react";

export default function SectionHeader({ eyebrow, title, children }) {
  return (
    <div className="mb-5">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">{title}</h2>
      {children ? <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{children}</p> : null}
    </div>
  );
}

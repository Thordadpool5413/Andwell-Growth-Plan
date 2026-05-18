import React from "react";

export default function Card({ title, eyebrow, children }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm shadow-slate-200/70 backdrop-blur">
      <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-blue-700">{eyebrow}</p>
      <h2 className="text-xl font-black text-slate-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

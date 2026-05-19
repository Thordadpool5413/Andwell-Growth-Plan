import React from "react";

export default function Card({ title, eyebrow, children, className = "" }) {
  return (
    <section className={`
      rounded-lg border border-slate-800/50 bg-slate-900/40 backdrop-blur-sm p-6 
      transition-all duration-200 hover:border-slate-700 hover:bg-slate-800/50
      ${className}
    `}>
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-blue-400">
        {eyebrow}
      </p>
      <h2 className="text-lg font-bold text-white">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

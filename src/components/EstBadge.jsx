import React, { useState, useRef } from "react";

export default function EstBadge({ reason, children = "Est." }) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef(null);

  const show = () => {
    clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const hide = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 100);
  };

  return (
    <span className="relative inline-flex items-center">
      <span
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        tabIndex={0}
        role="button"
        aria-label={`Estimated value — ${reason}`}
        className="inline-flex cursor-help items-center gap-0.5 rounded border border-amber-300 bg-amber-50 px-1 py-0.5 text-[10px] font-black text-amber-700 underline decoration-dotted underline-offset-2 transition hover:bg-amber-100 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-400 dark:hover:bg-amber-900/40"
      >
        {children}
      </span>
      {open && reason && (
        <span
          onMouseEnter={show}
          onMouseLeave={hide}
          className="absolute bottom-full left-0 z-50 mb-1.5 w-56 rounded-xl border border-amber-200 bg-white px-3 py-2 text-[11px] leading-5 text-slate-700 shadow-lg dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
        >
          <span className="mb-0.5 block font-black text-amber-700 dark:text-amber-400">Estimation basis</span>
          {reason}
        </span>
      )}
    </span>
  );
}

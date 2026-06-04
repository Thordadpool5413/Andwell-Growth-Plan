import React from "react";
import { useDarkMode } from "./DarkModeContext.jsx";

export default function AiBadge({ children, onRegenerate, generating, label = "AI Summary", prose = false }) {
  const { dark } = useDarkMode();

  const proseClass = dark
    ? "prose prose-invert prose-sm max-w-none prose-h2:text-[11px] prose-h2:font-bold prose-h2:uppercase prose-h2:tracking-widest prose-h2:text-emerald-300 prose-h2:mt-5 prose-h2:mb-1 prose-h3:text-[11px] prose-h3:font-bold prose-h3:uppercase prose-h3:tracking-widest prose-h3:text-emerald-300 prose-h3:mt-4 prose-h3:mb-1 prose-p:text-slate-200 prose-p:leading-7 prose-p:my-2 prose-strong:text-white prose-li:text-slate-300 prose-li:my-0 prose-ul:mt-1 prose-ul:mb-2"
    : "prose prose-sm max-w-none prose-h2:text-[11px] prose-h2:font-bold prose-h2:uppercase prose-h2:tracking-widest prose-h2:text-emerald-700 prose-h2:mt-5 prose-h2:mb-1 prose-h3:text-[11px] prose-h3:font-bold prose-h3:uppercase prose-h3:tracking-widest prose-h3:text-emerald-700 prose-h3:mt-4 prose-h3:mb-1 prose-p:text-slate-700 prose-p:leading-7 prose-p:my-2 prose-strong:text-slate-900 prose-li:text-slate-600 prose-li:my-0 prose-ul:mt-1 prose-ul:mb-2";

  return (
    <div className={`rounded-2xl border p-4 ${dark ? "border-emerald-800/40 bg-emerald-950/20" : "border-emerald-200 bg-emerald-50/80"}`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${dark ? "bg-emerald-800 text-emerald-100" : "bg-emerald-700 text-white"}`}>
            AI
          </span>
          <span className={`text-xs font-semibold ${dark ? "text-emerald-300" : "text-emerald-700"}`}>{label}</span>
          {generating && (
            <span className="inline-flex items-center gap-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
          )}
        </div>
        {onRegenerate && !generating && (
          <button
            onClick={onRegenerate}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${dark ? "text-emerald-300 hover:bg-emerald-950/40" : "text-emerald-700 hover:bg-emerald-100"}`}
          >
            ↻ Regenerate
          </button>
        )}
      </div>

      {prose ? (
        <div className={proseClass}>{children}</div>
      ) : (
        children
      )}

      <div className={`mt-4 flex items-center gap-1.5 border-t pt-3 ${dark ? "border-emerald-900/50" : "border-emerald-200/80"}`}>
        <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${dark ? "bg-emerald-500" : "bg-emerald-400"}`} />
        <p className={`text-[10px] font-medium ${dark ? "text-emerald-500" : "text-emerald-600"}`}>
          AI-generated from modeled data · Not verified clinical or financial advice
        </p>
      </div>
    </div>
  );
}

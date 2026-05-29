import React from "react";
import { useDarkMode } from "./DarkModeContext.jsx";

export default function AiBadge({ children, onRegenerate, generating, label = "AI Summary" }) {
  const { dark } = useDarkMode();

  return (
    <div className={`rounded-2xl border p-4 ${dark ? "border-violet-800/50 bg-violet-950/30" : "border-violet-200 bg-violet-50"}`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${dark ? "bg-violet-700 text-violet-100" : "bg-violet-600 text-white"}`}>
            AI
          </span>
          <span className={`text-xs font-semibold ${dark ? "text-violet-300" : "text-violet-700"}`}>{label}</span>
          {generating && (
            <span className="inline-flex items-center gap-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="inline-block h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
          )}
        </div>
        {onRegenerate && !generating && (
          <button
            onClick={onRegenerate}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${dark ? "text-violet-400 hover:bg-violet-900/40" : "text-violet-600 hover:bg-violet-100"}`}
          >
            ↻ Regenerate
          </button>
        )}
      </div>

      {children}

      <p className={`mt-3 text-[10px] ${dark ? "text-violet-600" : "text-violet-400"}`}>
        AI-generated from modeled data · Not verified clinical or financial advice
      </p>
    </div>
  );
}

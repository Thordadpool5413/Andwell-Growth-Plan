import React, { useState, useRef, useCallback } from "react";
import { useDarkMode } from "./DarkModeContext.jsx";
import { streamChat, buildAskPrompt, AI_AVAILABLE } from "../utils/ai.js";

export default function AskPanel({ rows, totals }) {
  const { dark } = useDarkMode();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const handleAsk = useCallback(() => {
    if (!question.trim() || generating) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setAnswer("");
    setError(null);
    setGenerating(true);

    streamChat({
      messages: buildAskPrompt(question, rows, totals),
      signal: controller.signal,
      onChunk: (_, full) => setAnswer(full),
      onDone: () => setGenerating(false),
      onError: (err) => {
        setError(err.message);
        setGenerating(false);
      },
    });
  }, [question, rows, totals, generating]);

  const handleClear = useCallback(() => {
    abortRef.current?.abort();
    setQuestion("");
    setAnswer("");
    setError(null);
    setGenerating(false);
  }, []);

  if (!AI_AVAILABLE) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 print:hidden">
      {open ? (
        <div
          className={`flex w-96 flex-col rounded-3xl border shadow-2xl ${
            dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white shadow-slate-200"
          }`}
        >
          <div
            className={`flex items-center justify-between border-b px-4 py-3 ${
              dark ? "border-slate-700" : "border-slate-100"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                  dark ? "bg-violet-700 text-violet-100" : "bg-violet-600 text-white"
                }`}
              >
                AI
              </span>
              <span className={`text-sm font-black ${dark ? "text-white" : "text-slate-900"}`}>Ask the data</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className={`rounded-lg p-1 text-sm transition ${
                dark ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-900"
              }`}
              aria-label="Close Ask the data panel"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3 p-4">
            <div
              className={`flex items-center gap-1 rounded-xl border ${
                dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"
              }`}
            >
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                placeholder="Which county has the best risk-adjusted return?"
                className={`flex-1 bg-transparent px-3 py-2.5 text-sm outline-none ${
                  dark ? "text-white placeholder-slate-500" : "text-slate-900 placeholder-slate-400"
                }`}
                disabled={generating}
              />
              <button
                onClick={handleAsk}
                disabled={!question.trim() || generating}
                className="mr-1 rounded-xl bg-violet-600 px-3 py-2 text-sm font-black text-white transition hover:bg-violet-500 disabled:opacity-40"
              >
                →
              </button>
            </div>

            {(answer || generating) && (
              <div
                className={`max-h-64 overflow-y-auto rounded-xl p-3 text-sm leading-6 ${
                  dark ? "bg-slate-800 text-slate-200" : "bg-slate-50 text-slate-700"
                }`}
              >
                {answer ? (
                  <>
                    <span className="whitespace-pre-wrap">{answer}</span>
                    {generating && (
                      <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-violet-400" />
                    )}
                  </>
                ) : (
                  <span className={dark ? "text-slate-500" : "text-slate-400"}>Thinking…</span>
                )}
              </div>
            )}

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/30 dark:text-red-400">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between">
              <p className={`text-[10px] ${dark ? "text-slate-600" : "text-slate-400"}`}>
                AI-generated from modeled data · Not verified advice
              </p>
              {(answer || question) && (
                <button
                  onClick={handleClear}
                  className={`text-xs ${dark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"}`}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-500/25 transition hover:scale-105 hover:bg-violet-500"
        >
          <span
            className={`rounded-sm px-1 text-[10px] font-black uppercase ${
              dark ? "bg-violet-500/50" : "bg-violet-500/40"
            }`}
          >
            AI
          </span>
          Ask the data
        </button>
      )}
    </div>
  );
}

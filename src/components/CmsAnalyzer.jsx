import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { useDarkMode } from "./DarkModeContext.jsx";
import { callCmsAnalyze } from "../utils/ai.js";

const SUGGESTED = [
  "Is Beacon Hospice CMS certified in Maine?",
  "What quality scores does Andwell have in the CMS provider data?",
  "Which Maine home health agencies have CMS certifications in Cumberland County?",
  "Find Compassus hospice provider data in Maine",
];

export default function CmsAnalyzer() {
  const { dark } = useDarkMode();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function analyze(q) {
    const query = q || question;
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await callCmsAnalyze(query);
      setResult(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`rounded-xl border p-6 space-y-4 ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
      <div>
        <p className={`text-xs font-medium uppercase tracking-widest ${dark ? "text-blue-400" : "text-blue-600"}`}>AI + CMS function calling</p>
        <p className={`mt-1 text-lg font-semibold ${dark ? "text-white" : "text-slate-950"}`}>CMS competitor intelligence</p>
        <p className={`mt-1 text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>
          Ask about any competitor or provider — the AI calls CMS Provider Data Catalog tools automatically to look up certification, quality scores, and service area data.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {SUGGESTED.map((s) => (
          <button
            key={s}
            onClick={() => { setQuestion(s); analyze(s); }}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${dark ? "bg-slate-700 text-purple-300 hover:bg-slate-600" : "bg-purple-50 text-purple-700 hover:bg-purple-100"}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && analyze()}
          placeholder="Ask about any Maine competitor or provider..."
          className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 ${dark ? "border-slate-600 bg-slate-700 text-white placeholder-slate-500" : "border-slate-200 bg-slate-50 text-slate-950 placeholder-slate-400"}`}
        />
        <button
          onClick={() => analyze()}
          disabled={loading || !question.trim()}
          className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? "…" : "Ask"}
        </button>
      </div>

      {loading && (
        <div className={`rounded-xl border p-4 ${dark ? "border-slate-700 bg-slate-700/30" : "border-slate-100 bg-slate-50"}`}>
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
            <p className={`text-sm font-semibold ${dark ? "text-slate-400" : "text-slate-500"}`}>Calling CMS tools...</p>
          </div>
        </div>
      )}

      {error && (
        <div className={`rounded-xl border p-4 text-sm ${dark ? "border-red-800 bg-red-950/50 text-red-300" : "border-red-200 bg-red-50 text-red-700"}`}>
          <p className="font-semibold">Error</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {result && (
        <div className={`rounded-xl border p-5 space-y-3 ${dark ? "border-slate-700 bg-slate-700/30" : "border-slate-200 bg-slate-50"}`}>
          <div className="flex items-center justify-between">
            <p className={`text-xs font-bold uppercase tracking-widest ${dark ? "text-purple-400" : "text-purple-600"}`}>Analysis</p>
            {result.tool_calls_made > 0 && (
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${dark ? "bg-purple-900/50 text-purple-300" : "bg-purple-100 text-purple-700"}`}>
                {result.tool_calls_made} CMS tool call{result.tool_calls_made !== 1 ? "s" : ""} made
              </span>
            )}
          </div>
          <div className={
            dark
              ? "prose prose-invert prose-sm max-w-none prose-h2:text-[11px] prose-h2:font-bold prose-h2:uppercase prose-h2:tracking-widest prose-h2:text-purple-400 prose-h2:mt-4 prose-h2:mb-1 prose-p:text-slate-200 prose-p:leading-7 prose-p:my-2 prose-strong:text-white prose-li:text-slate-300 prose-ul:mt-1"
              : "prose prose-sm max-w-none prose-h2:text-[11px] prose-h2:font-bold prose-h2:uppercase prose-h2:tracking-widest prose-h2:text-purple-700 prose-h2:mt-4 prose-h2:mb-1 prose-p:text-slate-700 prose-p:leading-7 prose-p:my-2 prose-strong:text-slate-900 prose-li:text-slate-600 prose-ul:mt-1"
          }>
            <ReactMarkdown>{result.answer}</ReactMarkdown>
          </div>
          <div className={`flex items-center gap-1.5 border-t pt-3 ${dark ? "border-slate-700/60" : "border-slate-200"}`}>
            <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${dark ? "bg-purple-600" : "bg-purple-400"}`} />
            <p className={`text-[10px] font-medium ${dark ? "text-slate-500" : "text-slate-400"}`}>
              Sourced via CMS Provider Data Catalog · AI-interpreted · Not verified clinical or financial advice
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

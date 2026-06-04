import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useDarkMode } from "./DarkModeContext.jsx";
import { streamChat, buildAskPrompt, AI_AVAILABLE } from "../utils/ai.js";
import { getCountyIntelligence } from "../utils/calculations.js";

const SUGGESTED_QUESTIONS = {
  "Executive View": [
    "What's the total 3-year revenue opportunity across all counties?",
    "Which counties drive the most Year 1 contribution margin?",
    "How many referrals do we need to hit Year 1 targets?",
    "What's our biggest risk to the financial plan?",
  ],
  "County Plan": [
    "Which county should we launch first and why?",
    "What makes Cumberland the top opportunity?",
    "Which county has the best risk-adjusted return?",
    "Where is competitive threat lowest relative to market size?",
  ],
  "Referral Plan": [
    "How many referral sources do we need per county?",
    "Which county requires the fewest referrals to hit targets?",
    "What conversion rate assumption drives Year 1 starts?",
    "Which counties are most sensitive to referral shortfalls?",
  ],
  "Opportunity Score": [
    "Which county has the highest composite opportunity score?",
    "What factors most influence opportunity score rankings?",
    "Are there hidden gem counties with low competition and strong scores?",
    "How does penetration rate affect opportunity scoring?",
  ],
  "Competitive View": [
    "Which counties have national chain competitors present?",
    "Where do competitors have the highest beneficiary share?",
    "Which market has the most fragmented competition?",
    "What is the competitive threat level in York County?",
  ],
  "CMS Data": [
    "How many CMS-certified providers operate in Maine?",
    "Which counties have the fewest certified home health agencies?",
    "What does CMS beneficiary volume tell us about market concentration?",
    "Which providers have the largest Medicare beneficiary share?",
  ],
  "Financial Model": [
    "What's our break-even timeline?",
    "How sensitive is Year 2 revenue to conversion rate changes?",
    "Which county contributes the most to 3-year contribution margin?",
    "What revenue milestone do we hit by end of Year 1?",
  ],
  "Sensitivity": [
    "How does a 10% drop in referrals affect Year 1 revenue?",
    "What's the revenue impact of delaying launch by one quarter?",
    "Which assumption has the largest effect on total contribution margin?",
    "What happens to starts if capture rates fall to 7%?",
  ],
  "Staffing Model": [
    "How many FTEs do we need at full Year 3 scale?",
    "Which county requires the most clinical staff in Year 1?",
    "What's the staffing ramp between Year 1 and Year 3?",
    "How does Hospice staffing ratio compare to Home Health?",
  ],
  "Launch Timeline": [
    "What's the recommended launch sequence across priority groups?",
    "Which counties are in Launch Group 1 and why?",
    "How long does it take to reach full operational capacity?",
    "What milestones should we track in the first 90 days?",
  ],
  "Board Report": [
    "Summarize the financial opportunity in two sentences for the board.",
    "What are the top three risks the board should monitor?",
    "Which market represents the strongest near-term case for investment?",
    "What competitive advantages does Andwell hold in these markets?",
  ],
  "Launch Checklist": [
    "What are the most critical pre-launch requirements?",
    "Which checklist items carry the highest regulatory risk?",
    "How long does CMS certification typically take for new agencies?",
    "What operational dependencies must be resolved before go-live?",
  ],
};

const SOURCE_FOOTNOTE = "Based on CMS 2022 PUF · Andwell planning assumptions · May 2026 model";

export default function AskPanel({
  rows,
  totals,
  activeTab,
  selectedCounty,
  mapLayer,
  competitorProviderType,
  scenarioOpen = false,
}) {
  const { dark } = useDarkMode();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  const threadRef = useRef(null);

  const intelMap = useMemo(() => {
    const counties = [...new Set(rows.map((r) => r.county))];
    return Object.fromEntries(counties.map((c) => [c, getCountyIntelligence(c, rows)]));
  }, [rows]);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages, generating]);

  const runQuery = useCallback(
    (q) => {
      if (!q.trim() || generating) return;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const userMsg = { role: "user", content: q };
      setMessages((prev) => [...prev, userMsg, { role: "assistant", content: "", streaming: true }]);
      setError(null);
      setGenerating(true);
      setQuestion("");

      streamChat({
        messages: buildAskPrompt(q, rows, totals, intelMap, selectedCounty, { activeTab, mapLayer, competitorProviderType }),
        signal: controller.signal,
        onChunk: (_, full) => {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: full, streaming: true };
            return updated;
          });
        },
        onDone: () => {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...updated[updated.length - 1], streaming: false };
            return updated;
          });
          setGenerating(false);
        },
        onError: (err) => {
          setError(err.message);
          setMessages((prev) => prev.slice(0, -1));
          setGenerating(false);
        },
      });
    },
    [rows, totals, intelMap, selectedCounty, activeTab, mapLayer, competitorProviderType, generating],
  );

  const handleAsk = useCallback(() => runQuery(question), [question, runQuery]);

  const handleChip = useCallback(
    (q) => {
      setQuestion(q);
      runQuery(q);
    },
    [runQuery],
  );

  const handleNewConversation = useCallback(() => {
    abortRef.current?.abort();
    setQuestion("");
    setMessages([]);
    setError(null);
    setGenerating(false);
  }, []);

  if (!AI_AVAILABLE) return null;

  const hasConversation = messages.length > 0;
  const visibleMessages = messages.slice(-6);
  const suggestedQuestions = SUGGESTED_QUESTIONS[activeTab] ?? SUGGESTED_QUESTIONS["Executive View"];
  const tabLabel = activeTab ?? "Overview";

  const proseClass = dark
    ? "prose prose-invert prose-sm max-w-none prose-p:text-slate-200 prose-strong:text-white prose-li:text-slate-200 prose-headings:text-white"
    : "prose prose-sm max-w-none prose-p:text-slate-700 prose-strong:text-slate-900 prose-li:text-slate-700 prose-headings:text-slate-900";

  return (
    <div
      className={`fixed bottom-5 z-50 print:hidden transition-all duration-300 ${
        scenarioOpen ? "right-5 xl:right-[24rem]" : "right-5"
      }`}
    >
      {open ? (
        <div
          className={`flex w-[23rem] flex-col overflow-hidden rounded-[26px] border shadow-[0_32px_80px_-36px_rgba(15,23,42,0.55)] backdrop-blur-xl sm:w-[24rem] ${
            dark ? "border-slate-700/80 bg-slate-900/96" : "border-[#ddd6c7] bg-white/96"
          }`}
        >
          <div
            className={`flex items-center justify-between border-b px-4 py-3 ${
              dark
                ? "border-slate-700 bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent"
                : "border-[#efe8db] bg-gradient-to-r from-emerald-50 via-white to-white"
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                    dark ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  AI
                </span>
                <span className={`truncate text-sm font-semibold ${dark ? "text-white" : "text-slate-950"}`}>
                  Ask the data
                </span>
              </div>
              <p className={`mt-1 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
                {tabLabel}
              </p>
            </div>

            <div className="ml-3 flex items-center gap-1">
              {hasConversation && (
                <button
                  onClick={handleNewConversation}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                    dark ? "text-slate-400 hover:bg-slate-800 hover:text-emerald-300" : "text-slate-500 hover:bg-slate-100 hover:text-emerald-700"
                  }`}
                >
                  Reset
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className={`rounded-full p-1.5 transition ${
                  dark ? "text-slate-400 hover:bg-slate-800 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                }`}
                aria-label="Close Ask the data panel"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 p-4">
            {!hasConversation && (
              <div className="flex flex-wrap gap-1.5">
                {suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleChip(q)}
                    disabled={generating}
                    className={`rounded-full border px-3 py-1.5 text-left text-xs font-medium transition ${
                      dark
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15 disabled:opacity-40"
                        : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 disabled:opacity-40"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {hasConversation && (
              <div ref={threadRef} className="flex max-h-72 flex-col gap-3 overflow-y-auto pr-1">
                {visibleMessages.map((msg, i) => (
                  <div key={i} className={msg.role === "user" ? "flex justify-end" : ""}>
                    {msg.role === "user" ? (
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                          dark ? "bg-emerald-600 text-white" : "bg-emerald-700 text-white"
                        }`}
                      >
                        {msg.content}
                      </div>
                    ) : (
                      <div
                        className={`rounded-2xl border px-3 py-2.5 ${
                          dark ? "border-slate-700 bg-slate-950/70" : "border-[#ece4d6] bg-[#fbf8f2]"
                        }`}
                      >
                        <div className={`text-sm leading-6 ${proseClass}`}>
                          {msg.content ? (
                            <>
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                              {msg.streaming && (
                                <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-emerald-500" />
                              )}
                            </>
                          ) : (
                            <span className={dark ? "text-slate-500" : "text-slate-400"}>Thinking…</span>
                          )}
                        </div>
                        {!msg.streaming && msg.content && (
                          <p
                            className={`mt-2 border-t pt-1.5 text-[10px] italic ${
                              dark ? "border-slate-700 text-slate-500" : "border-[#ece4d6] text-slate-400"
                            }`}
                          >
                            {SOURCE_FOOTNOTE}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {error && (
              <p className={`rounded-xl px-3 py-2 text-xs ${dark ? "bg-red-950/30 text-red-400" : "bg-red-50 text-red-600"}`}>
                {error}
              </p>
            )}

            <div
              className={`flex items-center gap-1 rounded-2xl border ${
                dark ? "border-slate-700 bg-slate-800" : "border-[#e6dfd1] bg-[#f8f5ee]"
              }`}
            >
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                placeholder={hasConversation ? "Follow up..." : "Ask anything about the data..."}
                className={`flex-1 bg-transparent px-3 py-2.5 text-sm outline-none ${
                  dark ? "text-white placeholder-slate-500" : "text-slate-900 placeholder-slate-400"
                }`}
                disabled={generating}
              />
              <button
                onClick={handleAsk}
                disabled={!question.trim() || generating}
                className="mr-1 rounded-xl bg-emerald-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-600 disabled:opacity-40"
              >
                Ask
              </button>
            </div>

            <p className={`text-[10px] ${dark ? "text-slate-600" : "text-slate-400"}`}>
              AI summary support only. Not verified advice.
            </p>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm font-medium shadow-[0_24px_60px_-36px_rgba(15,23,42,0.5)] transition hover:-translate-y-0.5 ${
            dark
              ? "border-slate-700 bg-slate-950/95 text-white hover:border-emerald-500/25"
              : "border-[#ddd6c7] bg-white/95 text-slate-900 hover:border-emerald-200"
          }`}
        >
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              dark ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-100 text-emerald-700"
            }`}
          >
            <SparklesIcon />
          </span>
          <span className="flex flex-col items-start leading-tight">
            <span className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${dark ? "text-slate-400" : "text-slate-500"}`}>
              AI Workspace
            </span>
            <span>Ask the data</span>
          </span>
        </button>
      )}
    </div>
  );
}

function SparklesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l.767 2.36a1 1 0 00.95.69h2.48c.969 0 1.371 1.24.588 1.81l-2.006 1.458a1 1 0 00-.364 1.118l.766 2.36c.3.922-.755 1.688-1.538 1.118l-2.006-1.458a1 1 0 00-1.176 0l-2.006 1.458c-.783.57-1.838-.196-1.539-1.118l.767-2.36a1 1 0 00-.363-1.118L4.264 7.787c-.783-.57-.38-1.81.588-1.81h2.48a1 1 0 00.95-.69l.767-2.36z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
    </svg>
  );
}

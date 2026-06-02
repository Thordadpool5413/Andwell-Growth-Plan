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
  "Service Lines": [
    "How does Home Healthcare revenue compare to Hospice across counties?",
    "Which service line has the stronger Year 3 growth trajectory?",
    "Which county is best positioned for a Hospice-first launch?",
    "What staffing ratios differ between Home Health and Hospice?",
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

export default function AskPanel({ rows, totals, activeTab }) {
  const { dark } = useDarkMode();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [pulseKey, setPulseKey] = useState(0);
  const abortRef = useRef(null);
  const threadRef = useRef(null);
  const prevTabRef = useRef(activeTab);

  const intelMap = useMemo(() => {
    const counties = [...new Set(rows.map((r) => r.county))];
    return Object.fromEntries(counties.map((c) => [c, getCountyIntelligence(c, rows)]));
  }, [rows]);

  useEffect(() => {
    if (activeTab !== prevTabRef.current) {
      prevTabRef.current = activeTab;
      setPulseKey((k) => k + 1);
    }
  }, [activeTab]);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages, generating]);

  const runQuery = useCallback((q) => {
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
      messages: buildAskPrompt(q, rows, totals, intelMap),
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
  }, [rows, totals, intelMap, generating]);

  const handleAsk = useCallback(() => runQuery(question), [question, runQuery]);

  const handleChip = useCallback((q) => {
    setQuestion(q);
    runQuery(q);
  }, [runQuery]);

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
    <div className="fixed bottom-6 right-6 z-50 print:hidden">
      {open ? (
        <div
          className={`flex w-[26rem] flex-col rounded-xl border shadow-2xl ${
            dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white shadow-slate-200"
          }`}
        >
          <div
            className={`flex items-center justify-between border-b px-4 py-3 ${
              dark ? "border-slate-700" : "border-slate-100"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                  dark ? "bg-violet-700 text-violet-100" : "bg-violet-600 text-white"
                }`}
              >
                AI
              </span>
              <span className={`text-sm font-semibold truncate ${dark ? "text-white" : "text-slate-900"}`}>
                Ask the data
                <span className={`ml-1.5 font-semibold ${dark ? "text-violet-400" : "text-violet-600"}`}>
                  — {tabLabel}
                </span>
              </span>
              {generating && (
                <span className="inline-flex items-center gap-0.5 shrink-0">
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
            <div className="flex items-center gap-1 shrink-0">
              {hasConversation && (
                <button
                  onClick={handleNewConversation}
                  className={`rounded-lg px-2 py-1 text-xs font-semibold transition ${
                    dark ? "text-slate-400 hover:text-violet-300 hover:bg-slate-800" : "text-slate-500 hover:text-violet-600 hover:bg-violet-50"
                  }`}
                >
                  New conversation
                </button>
              )}
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
          </div>

          <div className="flex flex-col gap-3 p-4">
            {!hasConversation && (
              <div className="flex flex-wrap gap-1.5">
                {suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleChip(q)}
                    disabled={generating}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition text-left ${
                      dark
                        ? "border-violet-800/60 bg-violet-950/30 text-violet-300 hover:bg-violet-900/40 hover:border-violet-700 disabled:opacity-40"
                        : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 hover:border-violet-300 disabled:opacity-40"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {hasConversation && (
              <div
                ref={threadRef}
                className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1"
              >
                {visibleMessages.map((msg, i) => (
                  <div key={i} className={msg.role === "user" ? "flex justify-end" : ""}>
                    {msg.role === "user" ? (
                      <div
                        className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                          dark ? "bg-violet-700 text-white" : "bg-violet-600 text-white"
                        }`}
                      >
                        {msg.content}
                      </div>
                    ) : (
                      <div
                        className={`rounded-xl border px-3 py-2.5 ${
                          dark ? "border-violet-800/50 bg-violet-950/30" : "border-violet-200 bg-violet-50"
                        }`}
                      >
                        <div className={`text-sm leading-6 ${proseClass}`}>
                          {msg.content ? (
                            <>
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                              {msg.streaming && (
                                <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-violet-400" />
                              )}
                            </>
                          ) : (
                            <span className={dark ? "text-slate-500" : "text-slate-400"}>Thinking…</span>
                          )}
                        </div>
                        {!msg.streaming && msg.content && (
                          <p className={`mt-2 border-t pt-1.5 text-[10px] italic ${
                            dark ? "border-violet-800/40 text-violet-600" : "border-violet-200 text-violet-400"
                          }`}>
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
              <p className={`rounded-lg px-3 py-2 text-xs ${dark ? "bg-red-950/30 text-red-400" : "bg-red-50 text-red-600"}`}>
                {error}
              </p>
            )}

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
                placeholder={hasConversation ? "Follow up…" : "Ask anything about the data…"}
                className={`flex-1 bg-transparent px-3 py-2.5 text-sm outline-none ${
                  dark ? "text-white placeholder-slate-500" : "text-slate-900 placeholder-slate-400"
                }`}
                disabled={generating}
              />
              <button
                onClick={handleAsk}
                disabled={!question.trim() || generating}
                className="mr-1 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-40"
              >
                →
              </button>
            </div>

            <p className={`text-[10px] ${dark ? "text-slate-600" : "text-slate-400"}`}>
              AI · Not verified advice
            </p>
          </div>
        </div>
      ) : (
        <button
          key={pulseKey}
          onClick={() => setOpen(true)}
          className="ask-panel-pulse flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-violet-500/25 transition hover:scale-105 hover:bg-violet-500"
        >
          <span className="rounded-sm bg-violet-500/40 px-1 text-[10px] font-medium uppercase">AI</span>
          Ask the data
        </button>
      )}
    </div>
  );
}

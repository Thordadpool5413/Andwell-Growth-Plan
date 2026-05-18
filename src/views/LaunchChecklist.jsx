import React from "react";
import Card from "../components/Card.jsx";
import Badge from "../components/Badge.jsx";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import launchPlan from "../data/launchPlan.js";

const statusTone = (s) => (s === "Done" ? "green" : s === "In Progress" ? "blue" : "slate");

export default function LaunchChecklist() {
  const { dark } = useDarkMode();
  const phases = [...new Set(launchPlan.map((item) => item.phase))];
  const done = launchPlan.filter((i) => i.status === "Done").length;
  const total = launchPlan.length;

  return (
    <div className="space-y-6">
      <div className={`rounded-3xl border p-5 ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-semibold ${dark ? "text-slate-400" : "text-slate-500"}`}>Overall progress</p>
            <p className={`text-3xl font-black ${dark ? "text-white" : "text-slate-950"}`}>{done}/{total} complete</p>
          </div>
          <div className={`text-sm font-black ${done === total ? "text-emerald-600" : dark ? "text-blue-400" : "text-blue-700"}`}>
            {Math.round((done / total) * 100)}%
          </div>
        </div>
        <div className={`mt-3 h-2 w-full overflow-hidden rounded-full ${dark ? "bg-slate-700" : "bg-slate-100"}`}>
          <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${(done / total) * 100}%` }} />
        </div>
      </div>

      {phases.map((phase) => (
        <Card key={phase} title={phase} eyebrow="Launch phase">
          <div className="space-y-3">
            {launchPlan.filter((item) => item.phase === phase).map((item) => (
              <div key={item.task} className={`flex items-start justify-between gap-4 rounded-2xl border p-4 ${dark ? "border-slate-700 bg-slate-700/30" : "border-slate-100 bg-slate-50"}`}>
                <div className="flex-1">
                  <p className={`font-black ${dark ? "text-white" : "text-slate-950"}`}>{item.task}</p>
                  {item.owner && <p className={`mt-1 text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>Owner: {item.owner}</p>}
                </div>
                <Badge tone={statusTone(item.status)}>{item.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

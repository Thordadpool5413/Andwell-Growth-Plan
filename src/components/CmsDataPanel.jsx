import React, { useState, useEffect } from "react";
import { useDarkMode } from "./DarkModeContext.jsx";
import VerificationBadge from "./VerificationBadge.jsx";
import CmsAnalyzer from "./CmsAnalyzer.jsx";

let _cachedCmsToken = null;
let _cmsTokenFetchedAt = 0;
const CMS_TOKEN_TTL = 3.5 * 60 * 60 * 1000;

async function getCmsToken() {
  const now = Date.now();
  if (_cachedCmsToken && now - _cmsTokenFetchedAt < CMS_TOKEN_TTL) return _cachedCmsToken;
  const res = await fetch("/api/ai/token");
  if (!res.ok) throw new Error("Could not obtain session token.");
  const { token } = await res.json();
  _cachedCmsToken = token;
  _cmsTokenFetchedAt = now;
  return token;
}

function StatBox({ label, value, sub, dark }) {
  return (
    <div className={`rounded-xl border p-4 ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
      <p className={`text-xs font-medium uppercase tracking-wide ${dark ? "text-slate-400" : "text-slate-500"}`}>{label}</p>
      <p className={`mt-1 text-3xl font-bold tabular-nums ${dark ? "text-white" : "text-slate-950"}`}>{value}</p>
      {sub && <p className={`mt-0.5 text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>{sub}</p>}
    </div>
  );
}

export default function CmsDataPanel() {
  const { dark } = useDarkMode();
  const [stats, setStats] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [syncType, setSyncType] = useState("hospice");
  const [competitors, setCompetitors] = useState([]);
  const [loadingComps, setLoadingComps] = useState(false);
  const [activePanel, setActivePanel] = useState("overview");

  const fetchStats = async () => {
    try {
      const token = await getCmsToken();
      const r = await fetch("/api/cms/stats", { headers: { "x-ai-token": token } });
      if (r.ok) setStats(await r.json());
    } catch (_) {}
  };

  const fetchCompetitors = async () => {
    setLoadingComps(true);
    try {
      const token = await getCmsToken();
      const r = await fetch("/api/cms/competitors", { headers: { "x-ai-token": token } });
      const d = r.ok ? await r.json() : { competitors: [] };
      setCompetitors(d.competitors || []);
    } catch (_) {}
    setLoadingComps(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const runSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const token = await getCmsToken();
      const res = await fetch("/api/cms/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-ai-token": token },
        body: JSON.stringify({ provider_type: syncType }),
      });
      const data = await res.json();
      setSyncResult(data);
      fetchStats();
    } catch (err) {
      setSyncResult({ error: err.message });
    } finally {
      setSyncing(false);
    }
  };

  const runCrawl = async () => {
    setSyncing(true);
    try {
      const token = await getCmsToken();
      const res = await fetch("/api/cms/crawl", {
        method: "POST",
        headers: { "x-ai-token": token },
      });
      const data = await res.json();
      setSyncResult(data);
    } catch (err) {
      setSyncResult({ error: err.message });
    } finally {
      setSyncing(false);
    }
  };

  const runMatch = async (competitorName) => {
    try {
      const token = await getCmsToken();
      const res = await fetch("/api/cms/match", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-ai-token": token },
        body: JSON.stringify({ competitor_name: competitorName }),
      });
      const data = await res.json();
      return data;
    } catch {
      return null;
    }
  };

  const tabs = [
    { id: "overview", label: "Connection Status" },
    { id: "competitors", label: "Competitor Records" },
    { id: "ai", label: "AI Analysis" },
    { id: "sync", label: "Sync & Crawl" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { setActivePanel(t.id); if (t.id === "competitors") fetchCompetitors(); }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${activePanel === t.id ? "bg-blue-600 text-white" : dark ? "bg-slate-800 text-slate-300 ring-1 ring-slate-700 hover:bg-slate-700" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activePanel === "overview" && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <StatBox label="Datasets discovered" value={stats?.datasetsDiscovered ?? "—"} sub="CMS Provider Data Catalog" dark={dark} />
            <StatBox label="ME hospice providers" value={stats?.maineHospiceProviders ?? "—"} sub="CMS-certified records" dark={dark} />
            <StatBox label="ME home health agencies" value={stats?.maineHHAgencies ?? "—"} sub="CMS-certified records" dark={dark} />
            <StatBox label="Competitors verified" value={stats?.competitorMatches ?? "—"} sub="CMS-matched records" dark={dark} />
          </div>

          <div className={`rounded-xl border p-6 ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
            <p className={`text-sm font-semibold mb-3 ${dark ? "text-white" : "text-slate-950"}`}>CMS Provider Data Catalog</p>
            <div className="grid gap-3 md:grid-cols-2 text-sm">
              {[
                { label: "API endpoint", value: "data.cms.gov/provider-data/api/1", status: "Active" },
                { label: "Authentication", value: "None required (public API)", status: "Active" },
                { label: "Dataset discovery", value: "Dynamic — no hardcoded IDs", status: "Active" },
                { label: "State filter", value: "ME (Maine)", status: "Active" },
                { label: "Provider types", value: "Hospice + Home Health", status: "Active" },
                { label: "Last sync", value: stats?.lastSync?.t ? new Date(stats.lastSync.t).toLocaleDateString() : "Not yet synced", status: stats?.lastSync ? "Active" : "Pending" },
              ].map((row) => (
                <div key={row.label} className={`flex items-center justify-between rounded-xl px-4 py-3 ${dark ? "bg-slate-700/30" : "bg-slate-50"}`}>
                  <div>
                    <p className={`text-xs font-semibold ${dark ? "text-slate-300" : "text-slate-700"}`}>{row.label}</p>
                    <p className={`text-xs mt-0.5 ${dark ? "text-slate-500" : "text-slate-400"}`}>{row.value}</p>
                  </div>
                  <span className={`text-[10px] font-medium rounded px-2 py-0.5 ${row.status === "Active" ? dark ? "bg-emerald-900/40 text-emerald-300" : "bg-emerald-50 text-emerald-700" : dark ? "bg-amber-900/40 text-amber-300" : "bg-amber-50 text-amber-700"}`}>
                    {row.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Match-status breakdown */}
          {stats?.matchStatusBreakdown?.length > 0 && (
            <div className={`rounded-xl border p-5 ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
              <p className={`text-sm font-semibold mb-3 ${dark ? "text-white" : "text-slate-950"}`}>Verification status breakdown</p>
              <div className="flex flex-wrap gap-2">
                {stats.matchStatusBreakdown.map((row) => (
                  <div key={row.match_status} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs ${dark ? "bg-slate-700/40" : "bg-slate-50"}`}>
                    <span className={`h-2 w-2 rounded-full ${row.match_status?.includes("Verified") ? "bg-emerald-500" : row.match_status ? "bg-amber-400" : "bg-slate-400"}`} />
                    <span className={dark ? "text-slate-300" : "text-slate-700"}>{row.match_status || "Unknown"}</span>
                    <span className={`font-semibold tabular-nums ${dark ? "text-white" : "text-slate-950"}`}>{row.c}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Failed sync messages */}
          {stats?.failedSyncs?.length > 0 && (
            <div className={`rounded-xl border p-5 ${dark ? "border-red-900/50 bg-red-950/20" : "border-red-200 bg-red-50"}`}>
              <p className={`text-sm font-semibold mb-2 ${dark ? "text-red-300" : "text-red-800"}`}>Failed sync events</p>
              {stats.failedSyncs.map((f, i) => (
                <div key={i} className={`mt-1.5 text-xs ${dark ? "text-red-400" : "text-red-700"}`}>
                  <span className="font-semibold">{f.provider_type} / {f.dataset_identifier || "unknown"}</span>
                  {" — "}{f.error_message?.slice(0, 80) || "Error (no detail)"}{" "}
                  <span className={dark ? "text-red-600" : "text-red-400"}>{f.completed_at ? new Date(f.completed_at).toLocaleDateString() : ""}</span>
                </div>
              ))}
            </div>
          )}

          {/* Dataset list with dictionary links */}
          {stats?.datasetList?.length > 0 && (
            <div className={`rounded-xl border p-5 ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
              <p className={`text-sm font-semibold mb-3 ${dark ? "text-white" : "text-slate-950"}`}>Discovered datasets</p>
              <div className="space-y-2">
                {stats.datasetList.map((ds) => (
                  <div key={ds.cms_dataset_identifier} className={`flex items-center justify-between rounded-xl px-4 py-2 text-xs ${dark ? "bg-slate-700/30" : "bg-slate-50"}`}>
                    <div className="min-w-0">
                      <p className={`font-semibold truncate ${dark ? "text-slate-200" : "text-slate-800"}`}>{ds.title || ds.cms_dataset_identifier}</p>
                      <p className={`mt-0.5 ${dark ? "text-slate-500" : "text-slate-400"}`}>{ds.topic} · {ds.cms_dataset_identifier}</p>
                    </div>
                    {ds.api_reference && (
                      <a href={ds.api_reference} target="_blank" rel="noopener noreferrer"
                        className={`ml-3 shrink-0 rounded px-2 py-0.5 font-medium text-[10px] transition ${dark ? "bg-blue-900/40 text-blue-300 hover:bg-blue-900/60" : "bg-blue-50 text-blue-700 hover:bg-blue-100"}`}>
                        Dictionary ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={`rounded-xl border p-5 text-xs leading-6 ${dark ? "border-slate-700 bg-slate-800/50 text-slate-400" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
            <p className="font-semibold mb-1">Data provenance and limitations</p>
            <p>Provider records are sourced from the CMS Provider Data Catalog via the public DKAN API. Records reflect Medicare certification status only. CMS data does not include Medicaid-only or private-pay providers. Match confidence scores are computed from name normalization and location proximity — review flagged records before treating as definitive competitive intelligence.</p>
          </div>
        </div>
      )}

      {activePanel === "competitors" && (
        <div className="space-y-3">
          {loadingComps && (
            <div className={`rounded-xl border p-6 text-center ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
              <p className={`text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>Loading competitor records…</p>
            </div>
          )}
          {!loadingComps && competitors.length === 0 && (
            <div className={`rounded-xl border p-6 text-center ${dark ? "border-amber-800 bg-amber-950/20" : "border-amber-200 bg-amber-50"}`}>
              <p className={`text-sm font-semibold ${dark ? "text-amber-300" : "text-amber-900"}`}>No competitor records yet</p>
              <p className={`mt-1 text-xs ${dark ? "text-amber-400" : "text-amber-700"}`}>No CMS records are available for this admin view. Use the developer refresh workflow if this data must be regenerated.</p>
            </div>
          )}
          {!loadingComps && competitors.map((comp) => (
            <div key={comp.id || comp.name} className={`rounded-xl border p-4 ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={`font-semibold truncate ${dark ? "text-slate-100" : "text-slate-800"}`}>{comp.name}</p>
                  <p className={`text-xs mt-0.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>
                    {comp.provider_type} {comp.parent_company ? `· ${comp.parent_company}` : ""}
                  </p>
                </div>
                <VerificationBadge status={comp.match_status || "Source pending"} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                <div>
                  <p className={dark ? "text-slate-400" : "text-slate-500"}>CCN</p>
                  <p className={`font-semibold ${dark ? "text-slate-200" : "text-slate-800"}`}>{comp.cms_certification_number || "—"}</p>
                </div>
                <div>
                  <p className={dark ? "text-slate-400" : "text-slate-500"}>Location</p>
                  <p className={`font-semibold ${dark ? "text-slate-200" : "text-slate-800"}`}>{[comp.city, comp.zip_code].filter(Boolean).join(" ") || "—"}</p>
                </div>
                <div>
                  <p className={dark ? "text-slate-400" : "text-slate-500"}>Match confidence</p>
                  <p className={`font-semibold ${dark ? "text-slate-200" : "text-slate-800"}`}>
                    {comp.match_confidence != null ? `${Math.round(comp.match_confidence * 100)}%` : "—"}
                  </p>
                </div>
              </div>
              {comp.known_counties?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {comp.known_counties.slice(0, 5).map((c) => (
                    <span key={c} className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${dark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"}`}>{c}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activePanel === "ai" && <CmsAnalyzer />}

      {activePanel === "sync" && (
        <div className="space-y-4">
          <div className={`rounded-xl border p-6 ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
            <p className={`font-semibold mb-4 ${dark ? "text-white" : "text-slate-950"}`}>CMS Admin Refresh</p>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={syncType}
                onChange={(e) => setSyncType(e.target.value)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold border ${dark ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-900"}`}
              >
                <option value="hospice">Hospice providers</option>
                <option value="homehealth">Home health agencies</option>
                <option value="both">Both (hospice + home health)</option>
              </select>
              <button
                onClick={runSync}
                disabled={syncing}
                className={`rounded-lg px-6 py-2.5 text-sm font-medium transition disabled:opacity-50 ${dark ? "bg-blue-600 text-white hover:bg-blue-500" : "bg-blue-600 text-white hover:bg-blue-700"}`}
              >
                {syncing ? "Refreshing…" : "Refresh CMS Data"}
              </button>
            </div>
            <p className={`mt-3 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
              Fetches Maine provider records from the CMS Provider Data Catalog, upserts to local database, and runs competitor matching.
            </p>
          </div>

          <div className={`rounded-xl border p-6 ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
            <p className={`font-semibold mb-4 ${dark ? "text-white" : "text-slate-950"}`}>Competitor Website Crawl</p>
            <button
              onClick={runCrawl}
              disabled={syncing}
              className={`rounded-lg px-6 py-2.5 text-sm font-medium transition disabled:opacity-50 ${dark ? "bg-slate-700 text-slate-200 hover:bg-slate-600" : "bg-slate-900 text-white hover:bg-slate-800"}`}
            >
              {syncing ? "Crawling…" : "Crawl Competitor Websites"}
            </button>
            <p className={`mt-3 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
              Visits each seeded competitor's website to extract service lines, county coverage, quality claims, and parent company signals.
            </p>
          </div>

          {syncResult && (
            <div className={`rounded-xl border p-5 text-sm ${syncResult.error ? (dark ? "border-red-800 bg-red-950/30 text-red-300" : "border-red-200 bg-red-50 text-red-800") : (dark ? "border-emerald-800 bg-emerald-950/30 text-emerald-300" : "border-emerald-200 bg-emerald-50 text-emerald-800")}`}>
              <p className="font-semibold mb-2">{syncResult.error ? "Sync error" : "Sync complete"}</p>
              <pre className="text-xs overflow-auto whitespace-pre-wrap">{JSON.stringify(syncResult, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

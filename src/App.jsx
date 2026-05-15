import React, { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const services = {
  "Home Healthcare": {
    color: "#2563eb",
    tint: "bg-blue-50 text-blue-800 border-blue-200",
    role: "Foundation service line",
    demandRate: 0.08,
    conversion: 0.75,
    reimbursement: 3189,
    margin: 0.18,
    unit: "admissions",
    why: "Creates the upstream skilled care platform. This matters most where Andwell already has serious illness visibility but needs an earlier skilled care entry point.",
    evidence: "Medicare home health coverage includes skilled nursing, wound care, patient and caregiver education, monitoring serious illness, therapy, social work, aide services tied to skilled care, DME, and medical supplies.",
  },
  "Mobile Wound": {
    color: "#dc2626",
    tint: "bg-red-50 text-red-800 border-red-200",
    role: "Specialty growth line",
    demandRate: 0.025,
    conversion: 0.75,
    reimbursement: 1800,
    margin: 0.24,
    unit: "wound starts",
    why: "Adds a visible specialty capability that hospitals, physicians, SNFs, and wound related specialists understand quickly.",
    evidence: "Medicare home health coverage includes wound care for pressure sores and surgical wounds when eligibility requirements are met.",
  },
  "Therapy Care": {
    color: "#16a34a",
    tint: "bg-green-50 text-green-800 border-green-200",
    role: "Referral retention line",
    demandRate: 0.05,
    conversion: 0.75,
    reimbursement: 1650,
    margin: 0.2,
    unit: "therapy starts",
    why: "Prevents referral leakage. If a referral source needs nursing plus therapy and Andwell cannot support therapy, the entire case can go to a competitor.",
    evidence: "Medicare home health coverage includes physical therapy, occupational therapy, and speech language pathology when coverage requirements are met.",
  },
  GUIDE: {
    color: "#7c3aed",
    tint: "bg-purple-50 text-purple-800 border-purple-200",
    role: "Validation only line",
    demandRate: 0,
    conversion: 0.75,
    reimbursement: 0,
    margin: 0,
    unit: "validated dementia enrollments",
    why: "GUIDE should stay outside launch math until dementia prevalence, caregiver need, staffing model, and model economics are proven by county.",
    evidence: "Validation should include dementia prevalence, caregiver burden, care navigation, respite, 24 hour support, and model participation requirements.",
  },
  Hospice: {
    color: "#9333ea",
    tint: "bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200",
    role: "Future expansion line",
    demandRate: 0,
    conversion: 0.75,
    reimbursement: 0,
    margin: 0,
    unit: "hospice admissions",
    why: "Hospice is not in the active launch math here, but CMS hospice supply and quality data should remain visible for future county expansion decisions.",
    evidence: "CMS Provider Data includes hospice provider supply, general information, provider quality data, and CAHPS hospice experience data.",
  },
};

const launchPlan = [
  {
    county: "York",
    service: "Home Healthcare",
    age65: 45362,
    current: "Hospice, Palliative Medicine, Community and Behavioral Health",
    missing: "Home Healthcare, GUIDE, CareGivers, Therapy Care, Audiology, Mobile Wound, Grief Support Groups",
    launchGroup: "Priority 1",
    reason: "Largest modeled opportunity. Andwell is already visible in serious illness care, but Home Healthcare would create the upstream skilled care funnel before patients reach hospice eligibility.",
    action: "Confirm staffing capacity, hospital discharge access, physician referral workflow, and Home Healthcare launch readiness.",
    accounts: ["MaineHealth Maine Medical Center Biddeford and Sanford", "York Hospital", "Primary care groups in Biddeford, Sanford, Wells, and York", "SNF and short stay rehabilitation centers", "Senior living communities"],
    risk: "Competitive home health market, start of care capacity, and referral source conversion.",
  },
  {
    county: "Cumberland",
    service: "Therapy Care",
    age65: 59705,
    current: "Home Healthcare, Mobile Wound, GUIDE, CareGivers, Palliative Medicine, Hospice, Community and Behavioral Health",
    missing: "Therapy Care, Audiology, Grief Support Groups",
    launchGroup: "Priority 1",
    reason: "Largest older adult market. Andwell already has a strong platform, so Therapy Care protects referrals that could otherwise leak to agencies able to accept nursing plus therapy together.",
    action: "Confirm therapy staffing, post acute referral demand, rehab partner workflows, and Therapy Care launch readiness.",
    accounts: ["MaineHealth Maine Medical Center Portland", "Northern Light Mercy Hospital", "New England Rehabilitation Hospital of Portland", "Orthopedic, cardiology, pulmonology, and neurology practices", "Large senior living communities"],
    risk: "Therapy recruitment, incumbent agency relationships, and ability to coordinate therapy with existing Home Healthcare operations.",
  },
  {
    county: "Penobscot",
    service: "Mobile Wound",
    age65: 29983,
    current: "CareGivers, Home Healthcare, Palliative Medicine, Community and Behavioral Health, Hospice",
    missing: "GUIDE, Therapy Care, Audiology, Mobile Wound, Grief Support Groups",
    launchGroup: "Priority 1",
    reason: "Strong regional referral density and existing Home Healthcare platform make Mobile Wound the clearest specialty growth opportunity.",
    action: "Confirm wound referral volume from hospitals, SNFs, vascular, diabetes, podiatry, surgical, and wound related practices.",
    accounts: ["Northern Light Eastern Maine Medical Center", "St. Joseph Hospital", "Bangor primary care and specialty practices", "SNF and short stay rehabilitation centers", "Wound, vascular, diabetes, podiatry, and surgical practices"],
    risk: "Wound nurse capacity, physician confidence, routing, and documentation standards.",
  },
  {
    county: "Kennebec",
    service: "Mobile Wound",
    age65: 26088,
    current: "GUIDE, CareGivers, Home Healthcare, Palliative Medicine, Community and Behavioral Health, Hospice",
    missing: "Therapy Care, Audiology, Mobile Wound, Grief Support Groups",
    launchGroup: "Priority 1",
    reason: "Existing Home Healthcare platform plus a large older adult base supports a wound specialty add on.",
    action: "Confirm referral opportunity with MaineGeneral, Augusta and Waterville provider networks, SNFs, and wound related specialty practices.",
    accounts: ["MaineGeneral Medical Center", "Augusta and Waterville primary care networks", "SNF and rehabilitation centers", "Vascular, podiatry, diabetes, and surgical practices", "Senior living communities"],
    risk: "Specialty staffing, referral education, and competition from incumbent wound resources.",
  },
  {
    county: "Knox",
    service: "Home Healthcare",
    age65: 10923,
    current: "Hospice, Palliative Medicine, Community and Behavioral Health",
    missing: "GUIDE, CareGivers, Home Healthcare, Therapy Care, Audiology, Mobile Wound, Grief Support Groups",
    launchGroup: "Priority 2",
    reason: "Andwell has downstream serious illness presence but lacks the skilled care front door. Home Healthcare creates earlier patient capture.",
    action: "Confirm hospital discharge relationships, primary care referral access, and home health staffing coverage.",
    accounts: ["Pen Bay Medical Center", "Rockland and Camden primary care practices", "SNF and rehab centers", "Senior living communities", "Community based elder care organizations"],
    risk: "Smaller population base, coastal routing, and staffing coverage.",
  },
  {
    county: "Lincoln",
    service: "Home Healthcare",
    age65: 9488,
    current: "Palliative Medicine, Hospice, Community and Behavioral Health",
    missing: "GUIDE, CareGivers, Home Healthcare, Therapy Care, Audiology, Mobile Wound, Grief Support Groups",
    launchGroup: "Priority 2",
    reason: "A concentrated older adult market where upstream Home Healthcare can support continuity with serious illness services.",
    action: "Validate referral density, route efficiency, and local provider willingness before launch.",
    accounts: ["LincolnHealth", "Damariscotta and Boothbay primary care practices", "SNF and assisted living communities", "Community elder care partners"],
    risk: "Lower total volume and route efficiency.",
  },
  {
    county: "Waldo",
    service: "Home Healthcare",
    age65: 9132,
    current: "Hospice, Palliative Medicine, Community and Behavioral Health",
    missing: "GUIDE, CareGivers, Home Healthcare, Therapy Care, Audiology, Mobile Wound, Grief Support Groups",
    launchGroup: "Priority 2",
    reason: "Home Healthcare fills a major service gap and can support earlier patient identification across a smaller but meaningful older adult market.",
    action: "Validate referral concentration around Belfast and surrounding communities before committing capacity.",
    accounts: ["Waldo County General Hospital", "Belfast primary care practices", "SNF and senior living communities", "Community agencies"],
    risk: "Volume concentration and clinician coverage.",
  },
  {
    county: "Sagadahoc",
    service: "Home Healthcare",
    age65: 7980,
    current: "Palliative Medicine, Hospice, Community and Behavioral Health",
    missing: "GUIDE, CareGivers, Home Healthcare, Therapy Care, Audiology, Mobile Wound, Grief Support Groups",
    launchGroup: "Priority 2",
    reason: "Small but strategically adjacent market with potential to extend Home Healthcare coverage from nearby operating density.",
    action: "Confirm adjacency economics, Bath provider relationships, and incremental staffing burden.",
    accounts: ["Mid Coast Hospital adjacency", "Bath and Topsham provider networks", "Senior living and community care partners"],
    risk: "Small total opportunity and dependency on operational adjacency.",
  },
];

const cmsLayer = [
  { county: "Cumberland", homeHealth: 22, hospice: 12, quality: 84, saturation: 74 },
  { county: "York", homeHealth: 16, hospice: 9, quality: 79, saturation: 68 },
  { county: "Penobscot", homeHealth: 12, hospice: 8, quality: 76, saturation: 62 },
  { county: "Kennebec", homeHealth: 11, hospice: 7, quality: 74, saturation: 59 },
  { county: "Knox", homeHealth: 5, hospice: 4, quality: 71, saturation: 52 },
  { county: "Lincoln", homeHealth: 4, hospice: 3, quality: 70, saturation: 49 },
  { county: "Waldo", homeHealth: 4, hospice: 3, quality: 69, saturation: 47 },
  { county: "Sagadahoc", homeHealth: 3, hospice: 2, quality: 68, saturation: 44 },
];

const monthlyRamp = [
  { month: "Month 1", accounts: 18, referrals: 24, admissions: 18, revenue: 57402 },
  { month: "Month 2", accounts: 31, referrals: 42, admissions: 32, revenue: 101316 },
  { month: "Month 3", accounts: 46, referrals: 64, admissions: 48, revenue: 153072 },
  { month: "Month 4", accounts: 64, referrals: 88, admissions: 66, revenue: 209484 },
  { month: "Month 5", accounts: 83, referrals: 116, admissions: 87, revenue: 276543 },
  { month: "Month 6", accounts: 105, referrals: 148, admissions: 111, revenue: 353979 },
];

const validationChecklist = [
  { item: "Confirm service footprint", owner: "Operations and market leadership", output: "Verified county service availability and final list of true service gaps." },
  { item: "Confirm referral sources", owner: "Sales leadership", output: "Target account list with realistic monthly referral commitments by county and service line." },
  { item: "Confirm staffing capacity", owner: "Clinical operations", output: "Start of care capacity, visit capacity, mileage assumptions, and FTE need by county." },
  { item: "Confirm reimbursement and margin", owner: "Finance", output: "Actual reimbursement, payer mix, cost to serve, and contribution margin by service line." },
  { item: "Confirm CMS market interpretation", owner: "Growth analytics", output: "Use CMS county data as the public market layer and reconcile against internal census and referral history." },
];

const tabs = ["Executive View", "County Plan", "Service Lines", "CMS Data", "Financial Model", "Launch Checklist"];

function currency(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function number(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function Card({ title, eyebrow, children }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      {eyebrow ? <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-blue-700">{eyebrow}</p> : null}
      <h2 className="text-xl font-black text-slate-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Metric({ label, value, detail }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
    </div>
  );
}

function Badge({ children, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-800 border-blue-200",
    green: "bg-green-50 text-green-800 border-green-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    purple: "bg-purple-50 text-purple-800 border-purple-200",
    slate: "bg-slate-50 text-slate-800 border-slate-200",
  };
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${tones[tone]}`}>{children}</span>;
}

function ExecutiveView({ totals }) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Priority counties" value={launchPlan.length} detail="Counties included in the current launch analysis and validation model." />
        <Metric label="Older adult market" value={number(totals.age65)} detail="Modeled population age 65 and older across included counties." />
        <Metric label="Six month revenue" value={currency(totals.revenue)} detail="Directional revenue from the referral ramp before payer mix and cost validation." />
        <Metric label="Month six admissions" value={number(totals.finalAdmissions)} detail="Projected admitted volume once referral coverage and account discipline mature." />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card title="Launch thesis" eyebrow="Executive summary">
          <p className="text-lg leading-8 text-slate-700">
            The highest confidence growth path is not to launch everything everywhere. The best path is to use county level service gaps to select the right first service line, then validate staffing, referral density, reimbursement, and operational readiness before scaling.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-blue-50 p-4"><p className="font-black text-blue-900">First move</p><p className="mt-2 text-sm leading-6 text-blue-800">Lead with Home Healthcare where Andwell has serious illness presence but lacks the skilled care front door.</p></div>
            <div className="rounded-2xl bg-green-50 p-4"><p className="font-black text-green-900">Protect referrals</p><p className="mt-2 text-sm leading-6 text-green-800">Add Therapy Care where broader home based capability prevents leakage to competitors.</p></div>
            <div className="rounded-2xl bg-red-50 p-4"><p className="font-black text-red-900">Differentiate</p><p className="mt-2 text-sm leading-6 text-red-800">Use Mobile Wound where specialty demand creates a clear referral reason to choose Andwell.</p></div>
          </div>
        </Card>

        <Card title="Priority mix" eyebrow="Launch groups">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Priority 1", value: launchPlan.filter((x) => x.launchGroup === "Priority 1").length, color: "#2563eb" },
                    { name: "Priority 2", value: launchPlan.filter((x) => x.launchGroup === "Priority 2").length, color: "#f59e0b" },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={105}
                  paddingAngle={4}
                >
                  <Cell fill="#2563eb" />
                  <Cell fill="#f59e0b" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>
    </div>
  );
}

function CountyPlan({ selectedCounty, setSelectedCounty }) {
  return (
    <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <Card title="County launch queue" eyebrow="Prioritization">
        <div className="space-y-3">
          {launchPlan.map((county) => (
            <button
              key={county.county}
              onClick={() => setSelectedCounty(county)}
              className={`w-full rounded-2xl border p-4 text-left transition ${selectedCounty.county === county.county ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-300"}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-black text-slate-950">{county.county}</p>
                  <p className="text-sm font-semibold text-slate-500">{county.service}</p>
                </div>
                <Badge tone={county.launchGroup === "Priority 1" ? "blue" : "amber"}>{county.launchGroup}</Badge>
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Card title={`${selectedCounty.county} County`} eyebrow="County detail">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <Metric label="Recommended launch" value={selectedCounty.service} detail="First service line to validate for this county." />
            <Metric label="Age 65 plus" value={number(selectedCounty.age65)} detail="Older adult market size used for directional sizing." />
            <Metric label="Launch group" value={selectedCounty.launchGroup} detail="Priority sequence based on gap, market size, and readiness." />
          </div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm font-bold uppercase tracking-wide text-slate-500">Reason</p><p className="mt-2 leading-8 text-slate-700">{selectedCounty.reason}</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm font-bold uppercase tracking-wide text-slate-500">Action</p><p className="mt-2 leading-8 text-slate-700">{selectedCounty.action}</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm font-bold uppercase tracking-wide text-slate-500">Current Andwell presence</p><p className="mt-2 leading-8 text-slate-700">{selectedCounty.current}</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm font-bold uppercase tracking-wide text-slate-500">Missing service lines</p><p className="mt-2 leading-8 text-slate-700">{selectedCounty.missing}</p></div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Target account categories</p>
            <div className="mt-3 grid gap-2">
              {selectedCounty.accounts.map((account) => <div key={account} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">{account}</div>)}
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}

function ServiceLines({ selectedService, setSelectedService }) {
  const serviceList = Object.entries(services).map(([name, data]) => ({ name, ...data }));
  return (
    <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card title="Service line selection" eyebrow="Strategy">
        <div className="space-y-3">
          {serviceList.map((service) => (
            <button
              key={service.name}
              onClick={() => setSelectedService(service.name)}
              className={`w-full rounded-2xl border p-4 text-left transition ${selectedService === service.name ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-300"}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div><p className="font-black text-slate-950">{service.name}</p><p className="text-sm text-slate-500">{service.role}</p></div>
                <span className="h-4 w-4 rounded-full" style={{ backgroundColor: service.color }} />
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Card title={selectedService} eyebrow="Service economics and rationale">
        <div className="grid gap-4 md:grid-cols-3">
          <Metric label="Demand assumption" value={`${services[selectedService].demandRate * 100}%`} detail={`Modeled as potential ${services[selectedService].unit} among older adults.`} />
          <Metric label="Conversion" value={`${services[selectedService].conversion * 100}%`} detail="Directional referral to admission conversion used in the model." />
          <Metric label="Margin" value={services[selectedService].margin ? `${services[selectedService].margin * 100}%` : "Validate"} detail="Final margin requires finance validation by payer mix and cost to serve." />
        </div>
        <div className="mt-5 rounded-2xl bg-slate-50 p-5"><p className="font-black text-slate-950">Why it matters</p><p className="mt-2 leading-8 text-slate-700">{services[selectedService].why}</p></div>
        <div className="mt-4 rounded-2xl bg-slate-50 p-5"><p className="font-black text-slate-950">Evidence layer</p><p className="mt-2 leading-8 text-slate-700">{services[selectedService].evidence}</p></div>
      </Card>
    </section>
  );
}

function CmsData() {
  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <Card title="CMS county provider layer" eyebrow="Market data">
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cmsLayer} margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="county" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="homeHealth" name="Home health providers" fill="#2563eb" radius={[8, 8, 0, 0]} />
              <Bar dataKey="hospice" name="Hospice providers" fill="#9333ea" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card title="Quality and saturation signal" eyebrow="Interpretation">
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={cmsLayer}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="county" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="saturation" name="Market saturation" fill="#94a3b8" radius={[8, 8, 0, 0]} />
              <Line type="monotone" dataKey="quality" name="Quality signal" stroke="#16a34a" strokeWidth={3} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </section>
  );
}

function FinancialModel({ totals }) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card title="Six month referral and revenue ramp" eyebrow="Financial model">
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthlyRamp}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `$${Math.round(value / 1000)}k`} />
              <Tooltip formatter={(value, name) => name === "revenue" ? currency(value) : number(value)} />
              <Bar yAxisId="left" dataKey="referrals" name="Referrals" fill="#2563eb" radius={[8, 8, 0, 0]} />
              <Line yAxisId="left" type="monotone" dataKey="admissions" name="Admissions" stroke="#16a34a" strokeWidth={3} />
              <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue" stroke="#f59e0b" strokeWidth={3} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card title="Financial assumptions" eyebrow="Model guardrails">
        <div className="space-y-4">
          <Metric label="Total modeled revenue" value={currency(totals.revenue)} detail="Directional gross revenue across the first six months." />
          <Metric label="Final month run rate" value={currency(monthlyRamp[monthlyRamp.length - 1].revenue)} detail="Month six revenue before payer mix, staffing, and cost to serve validation." />
          <Metric label="Admission conversion" value="75%" detail="Referral to admitted volume assumption used for active launch service lines." />
        </div>
      </Card>
    </section>
  );
}

function LaunchChecklist() {
  return (
    <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card title="Validation checklist" eyebrow="Before launch approval">
        <div className="space-y-3">
          {validationChecklist.map((row, index) => (
            <div key={row.item} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">{index + 1}</div>
                <div><p className="font-black text-slate-950">{row.item}</p><p className="mt-1 text-sm font-semibold text-slate-500">Owner: {row.owner}</p><p className="mt-2 leading-7 text-slate-700">{row.output}</p></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Risk controls" eyebrow="Execution discipline">
        <div className="space-y-4 text-slate-700 leading-8">
          <p><strong className="text-slate-950">Do not launch by enthusiasm alone.</strong> Launch only where capacity, referral source commitment, reimbursement, and operational route economics are validated.</p>
          <p><strong className="text-slate-950">Use CMS as the market layer, not the whole truth.</strong> Public data should be reconciled with internal census, referral history, staffing availability, and local relationship strength.</p>
          <p><strong className="text-slate-950">Protect the funnel.</strong> Home Healthcare creates the entry point, Therapy Care protects broader referrals, Mobile Wound creates specialty differentiation, and Hospice benefits later through earlier serious illness identification.</p>
          <div className="rounded-2xl bg-amber-50 p-5 text-amber-900"><p className="font-black">Leadership note</p><p className="mt-2">GUIDE should remain in validation until county level demand, staffing model, and model economics are strong enough to justify launch planning.</p></div>
        </div>
      </Card>
    </section>
  );
}

export default function AndwellGrowthPlanApp() {
  const [activeTab, setActiveTab] = useState("Executive View");
  const [selectedCounty, setSelectedCounty] = useState(launchPlan[0]);
  const [selectedService, setSelectedService] = useState("Home Healthcare");

  const totals = useMemo(() => {
    return {
      age65: launchPlan.reduce((sum, item) => sum + item.age65, 0),
      revenue: monthlyRamp.reduce((sum, item) => sum + item.revenue, 0),
      finalAdmissions: monthlyRamp[monthlyRamp.length - 1].admissions,
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        <header className="overflow-hidden rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl">
          <div className="max-w-5xl">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-300">Andwell Maine Innovation and Growth Plan</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">County based growth dashboard for focused service expansion.</h1>
            <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-300">A practical launch view that connects county opportunity, service line gaps, CMS market context, referral math, financial impact, and execution safeguards into one leadership ready dashboard.</p>
          </div>
        </header>

        <nav className="mt-6 flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-2xl px-4 py-3 text-sm font-black transition ${activeTab === tab ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}>{tab}</button>
          ))}
        </nav>

        <div className="mt-6">
          {activeTab === "Executive View" && <ExecutiveView totals={totals} />}
          {activeTab === "County Plan" && <CountyPlan selectedCounty={selectedCounty} setSelectedCounty={setSelectedCounty} />}
          {activeTab === "Service Lines" && <ServiceLines selectedService={selectedService} setSelectedService={setSelectedService} />}
          {activeTab === "CMS Data" && <CmsData />}
          {activeTab === "Financial Model" && <FinancialModel totals={totals} />}
          {activeTab === "Launch Checklist" && <LaunchChecklist />}
        </div>
      </div>
    </main>
  );
}

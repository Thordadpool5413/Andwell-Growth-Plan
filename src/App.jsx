import React, { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const countyData = [
  {
    county: "Cumberland",
    priority: "Tier 1",
    population65: 61170,
    currentShare: 9.4,
    targetShare: 12.5,
    opportunity: "Highest population density, strongest referral potential, and best near term return.",
    focus: "Hospitals, primary care groups, specialists, senior living, and discharge planners.",
    services: ["Home Healthcare", "Mobile Wound", "Therapy Care", "Hospice"],
  },
  {
    county: "York",
    priority: "Tier 1",
    population65: 48110,
    currentShare: 6.8,
    targetShare: 10.5,
    opportunity: "Large senior population with meaningful upside if referral coverage becomes more consistent.",
    focus: "SNFs, physician offices, assisted living, and hospital discharge channels.",
    services: ["Home Healthcare", "Mobile Wound", "Therapy Care"],
  },
  {
    county: "Androscoggin",
    priority: "Tier 2",
    population65: 22740,
    currentShare: 7.2,
    targetShare: 10.0,
    opportunity: "Strong adjacency to existing care infrastructure and practical growth path through skilled home care.",
    focus: "Primary care, hospital transition teams, wound care sources, and community partners.",
    services: ["Home Healthcare", "Therapy Care", "Hospice"],
  },
  {
    county: "Kennebec",
    priority: "Tier 2",
    population65: 25820,
    currentShare: 5.9,
    targetShare: 8.5,
    opportunity: "Mid sized county where tighter account discipline can produce measurable incremental volume.",
    focus: "Discharge planners, elder care networks, and high confidence physician referral sources.",
    services: ["Home Healthcare", "Mobile Wound"],
  },
  {
    county: "Penobscot",
    priority: "Tier 3",
    population65: 30090,
    currentShare: 4.8,
    targetShare: 7.0,
    opportunity: "Longer ramp market requiring careful validation of staffing, travel burden, and margin before expansion.",
    focus: "Selective partnerships, hospital systems, and concentrated referral corridors.",
    services: ["Hospice", "Home Healthcare"],
  },
];

const serviceLines = [
  {
    name: "Home Healthcare",
    color: "#2563eb",
    role: "Foundation service line",
    demand: 8,
    margin: 18,
    reimbursement: 3189,
    description: "Creates the upstream skilled care platform and protects referrals before patients decline into higher acuity needs.",
  },
  {
    name: "Mobile Wound",
    color: "#dc2626",
    role: "Specialty growth line",
    demand: 2.5,
    margin: 24,
    reimbursement: 1800,
    description: "Gives referral sources a clear, concrete reason to choose Andwell when wound care complexity is driving discharge risk.",
  },
  {
    name: "Therapy Care",
    color: "#16a34a",
    role: "Referral retention line",
    demand: 5,
    margin: 20,
    reimbursement: 1650,
    description: "Keeps nursing plus therapy referrals from leaking to competitors when patients need a broader home based care plan.",
  },
  {
    name: "GUIDE",
    color: "#7c3aed",
    role: "Validation only line",
    demand: 0,
    margin: 0,
    reimbursement: 0,
    description: "Should remain outside launch math until dementia prevalence, caregiver need, staffing model, and CMS economics are proven by county.",
  },
  {
    name: "Hospice",
    color: "#9333ea",
    role: "Downstream continuity line",
    demand: 0,
    margin: 0,
    reimbursement: 0,
    description: "Becomes more powerful when the upstream home health and palliative relationships identify eligible patients earlier.",
  },
];

const monthlyPlan = [
  { month: "Month 1", referrals: 18, admissions: 12, revenue: 38268 },
  { month: "Month 2", referrals: 28, admissions: 19, revenue: 60600 },
  { month: "Month 3", referrals: 42, admissions: 29, revenue: 92500 },
  { month: "Month 4", referrals: 58, admissions: 41, revenue: 130700 },
  { month: "Month 5", referrals: 74, admissions: 53, revenue: 168800 },
  { month: "Month 6", referrals: 92, admissions: 66, revenue: 210500 },
];

const competitorData = [
  { name: "Andwell", value: 24, color: "#2563eb" },
  { name: "Regional competitors", value: 41, color: "#64748b" },
  { name: "Local independents", value: 22, color: "#94a3b8" },
  { name: "Unassigned opportunity", value: 13, color: "#f59e0b" },
];

const validationChecklist = [
  "Confirm county service footprint and final list of true service gaps.",
  "Validate referral source targets and monthly referral commitments by county and service line.",
  "Confirm start of care capacity, visit capacity, mileage assumptions, and FTE needs.",
  "Validate actual reimbursement, payer mix, cost to serve, and contribution margin by service line.",
  "Use CMS county data as the public market layer, then reconcile against internal census and referral history.",
];

function currency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function number(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function Card({ title, children, eyebrow }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      {eyebrow ? <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-600">{eyebrow}</p> : null}
      <h2 className="text-xl font-bold text-slate-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Metric({ label, value, detail }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
    </div>
  );
}

export default function AndwellGrowthPlanApp() {
  const [selectedCounty, setSelectedCounty] = useState(countyData[0]);
  const [selectedService, setSelectedService] = useState(serviceLines[0]);

  const totals = useMemo(() => {
    const population = countyData.reduce((sum, county) => sum + county.population65, 0);
    const finalMonth = monthlyPlan[monthlyPlan.length - 1];
    const sixMonthRevenue = monthlyPlan.reduce((sum, item) => sum + item.revenue, 0);
    const avgShareGap = countyData.reduce((sum, county) => sum + (county.targetShare - county.currentShare), 0) / countyData.length;
    return { population, finalMonth, sixMonthRevenue, avgShareGap };
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        <header className="overflow-hidden rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl">
          <div className="max-w-4xl">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-300">Andwell Maine Innovation and Growth Plan</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              County by county growth dashboard for focused service line expansion.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              This dashboard converts CMS market context, county opportunity, referral planning, and service line economics into a practical launch view for Home Healthcare, Mobile Wound, Therapy Care, GUIDE validation, and Hospice continuity.
            </p>
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          <Metric label="Senior population reviewed" value={number(totals.population)} detail="Population age 65 plus across priority counties used for launch sizing." />
          <Metric label="Average share gap" value={`${totals.avgShareGap.toFixed(1)} pts`} detail="Difference between current modeled share and target share across counties." />
          <Metric label="Month six admissions" value={number(totals.finalMonth.admissions)} detail="Projected admissions after account coverage, referral discipline, and service line readiness mature." />
          <Metric label="Six month revenue model" value={currency(totals.sixMonthRevenue)} detail="Directional gross revenue model before final finance validation and payer mix adjustment." />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card title="County prioritization" eyebrow="Market focus">
            <div className="grid gap-3">
              {countyData.map((county) => (
                <button
                  key={county.county}
                  onClick={() => setSelectedCounty(county)}
                  className={`rounded-2xl border p-4 text-left transition ${selectedCounty.county === county.county ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-300"}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-black text-slate-950">{county.county}</p>
                      <p className="text-sm font-semibold text-slate-500">{county.priority}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Target share</p>
                      <p className="text-2xl font-black text-blue-700">{county.targetShare}%</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card title={selectedCounty.county} eyebrow="County detail">
            <div className="space-y-5">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Opportunity</p>
                <p className="mt-2 leading-7 text-slate-700">{selectedCounty.opportunity}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Referral focus</p>
                <p className="mt-2 leading-7 text-slate-700">{selectedCounty.focus}</p>
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Recommended services</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedCounty.services.map((service) => (
                    <span key={service} className="rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700">{service}</span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card title="Share gap by county" eyebrow="CMS market layer">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={countyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="county" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="currentShare" name="Current share" fill="#94a3b8" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="targetShare" name="Target share" fill="#2563eb" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Referral ramp model" eyebrow="Growth math">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyPlan}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip formatter={(value, name) => name === "revenue" ? currency(value) : value} />
                  <Line type="monotone" dataKey="referrals" name="Referrals" stroke="#2563eb" strokeWidth={3} />
                  <Line type="monotone" dataKey="admissions" name="Admissions" stroke="#16a34a" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card title="Service line strategy" eyebrow="Launch design">
            <div className="space-y-3">
              {serviceLines.map((service) => (
                <button
                  key={service.name}
                  onClick={() => setSelectedService(service)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${selectedService.name === service.name ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-300"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-950">{service.name}</p>
                      <p className="text-sm text-slate-500">{service.role}</p>
                    </div>
                    <span className="h-4 w-4 rounded-full" style={{ backgroundColor: service.color }} />
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card title={selectedService.name} eyebrow="Service detail">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Modeled demand</p>
                <p className="mt-2 text-2xl font-black">{selectedService.demand}%</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Modeled reimbursement</p>
                <p className="mt-2 text-2xl font-black">{selectedService.reimbursement ? currency(selectedService.reimbursement) : "Validate"}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Modeled margin</p>
                <p className="mt-2 text-2xl font-black">{selectedService.margin ? `${selectedService.margin}%` : "Validate"}</p>
              </div>
            </div>
            <p className="mt-5 leading-8 text-slate-700">{selectedService.description}</p>
          </Card>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card title="Competitive view" eyebrow="Positioning">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={competitorData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={115} paddingAngle={3}>
                    {competitorData.map((item) => <Cell key={item.name} fill={item.color} />)}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {competitorData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}: {item.value}%
                </div>
              ))}
            </div>
          </Card>

          <Card title="Validation checklist" eyebrow="Before launch approval">
            <div className="space-y-3">
              {validationChecklist.map((item, index) => (
                <div key={item} className="flex gap-3 rounded-2xl bg-slate-50 p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">{index + 1}</div>
                  <p className="leading-7 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="mt-6 rounded-[2rem] border border-blue-200 bg-blue-50 p-6">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">Executive readout</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">The growth case is strongest when Andwell leads with Home Healthcare and uses specialty services to protect referral relationships.</h2>
          <p className="mt-4 max-w-5xl leading-8 text-slate-700">
            The model prioritizes counties where senior population, current share gap, referral density, and operational feasibility create the clearest path to growth. GUIDE remains a validation track until the care model economics are proven. Hospice stays strategically important, but the strongest growth engine is the upstream relationship created through skilled home based care.
          </p>
        </section>
      </div>
    </main>
  );
}

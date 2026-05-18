export function exportCSV(headers, rows, filename) {
  const escape = (val) => {
    const str = String(val ?? "");
    return str.includes(",") || str.includes('"') || str.includes("\n")
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };

  const csv = [
    headers.map(escape).join(","),
    ...rows.map((row) => row.map(escape).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportReferralCSV(rows) {
  const headers = [
    "County", "Service", "Priority",
    "Y1 Starts", "Y1 Referrals", "Y1 Revenue",
    "Y2 Starts", "Y2 Referrals", "Y2 Revenue",
    "Y3 Starts", "Y3 Referrals", "Y3 Revenue",
    "Demand Pool", "Reimbursement", "Basis",
  ];
  const data = rows.map((r) => [
    r.county, r.service, r.launchGroup,
    r.starts[0], r.referrals[0], r.revenue[0],
    r.starts[1], r.referrals[1], r.revenue[1],
    r.starts[2], r.referrals[2], r.revenue[2],
    r.demandPool, r.reimbursement, r.basis,
  ]);
  exportCSV(headers, data, "Andwell-Referral-Plan");
}

export function exportFinancialCSV(rows) {
  const yearData = [0, 1, 2].map((i) => ({
    year: `Year ${i + 1}`,
    starts: rows.reduce((s, r) => s + r.starts[i], 0),
    referrals: rows.reduce((s, r) => s + r.referrals[i], 0),
    revenue: rows.reduce((s, r) => s + r.revenue[i], 0),
    contribution: rows.reduce((s, r) => s + Math.round(r.revenue[i] * r.meta.margin), 0),
  }));
  const headers = ["Year", "Starts", "Referrals", "Revenue", "Contribution"];
  const data = yearData.map((y) => [y.year, y.starts, y.referrals, y.revenue, y.contribution]);
  exportCSV(headers, data, "Andwell-Financial-Model");
}

export function exportCmsCSV(cmsData) {
  const headers = [
    "County", "FFS Beneficiaries",
    "HH Providers", "HH Users", "HH Rate", "HH Payment", "HH PPU",
    "Hospice Providers", "Hospice Users", "Hospice PPU",
  ];
  const data = Object.entries(cmsData).map(([county, m]) => [
    county, m.ffs,
    m.hh.prov, m.hh.users, m.hh.rate, m.hh.pay, m.hh.ppu,
    m.hos.prov, m.hos.users, m.hos.ppu,
  ]);
  exportCSV(headers, data, "Andwell-CMS-Data");
}

export function exportCompetitiveCSV(providers) {
  const headers = [
    "Service", "Provider Name", "Location County",
    "Beneficiaries", "Episodes", "Payment",
    "Provider Volume Share", "Is Andwell",
  ];
  const data = providers.map((p) => [
    p.service, p.providerName, p.locationCounty,
    p.beneficiaries, p.episodes, p.payment,
    (p.providerVolumeShare * 100).toFixed(1) + "%",
    p.isAndwellCmsRecord ? "Yes" : "No",
  ]);
  exportCSV(headers, data, "Andwell-Competitive-Data");
}

export class InsightsEngine {
  constructor(rows, totals) {
    this.rows = rows;
    this.totals = totals;
  }

  // Detect anomalies
  detectAnomalies() {
    const anomalies = [];
    const avgRevenue = this.rows.reduce((sum, r) => sum + r.revenue[0], 0) / this.rows.length;

    this.rows.forEach((row) => {
      const revenueDeviation = Math.abs(row.revenue[0] - avgRevenue) / avgRevenue;

      if (revenueDeviation > 0.5) {
        anomalies.push({
          id: `anomaly-${row.county}`,
          severity: revenueDeviation > 1 ? "high" : "medium",
          title: `${row.county} revenue opportunity`,
          message: `${row.county} shows ${revenueDeviation > 1 ? "significantly" : "notably"} ${revenueDeviation > avgRevenue ? "higher" : "lower"} revenue potential than peers`,
          type: "anomaly",
          county: row.county,
          metric: "revenue",
          value: row.revenue[0],
        });
      }

      if (row.referrals[0] < 10) {
        anomalies.push({
          id: `risk-${row.county}`,
          severity: "high",
          title: `Low referral requirement in ${row.county}`,
          message: "This county needs fewer referrals to launch, indicating potential market saturation or service line mismatch",
          type: "risk",
          county: row.county,
          metric: "referrals",
          value: row.referrals[0],
        });
      }
    });

    return anomalies;
  }

  // Generate smart recommendations
  generateRecommendations() {
    const recommendations = [];
    const sortedByRevenue = [...this.rows].sort((a, b) => b.revenue[0] - a.revenue[0]);
    const sortedByThreat = [...this.rows].sort((a, b) => (b.threat?.score || 0) - (a.threat?.score || 0));

    // Top opportunity
    if (sortedByRevenue[0]) {
      recommendations.push({
        id: "rec-1",
        priority: "high",
        title: "Prioritize high-revenue county",
        message: `Focus resources on ${sortedByRevenue[0].county} which shows the highest revenue potential (${(sortedByRevenue[0].revenue[0] / 1000).toFixed(0)}K in Year 1)`,
        action: "View County Plan",
        actionValue: sortedByRevenue[0].county,
      });
    }

    // Competition warning
    if (sortedByThreat[0]?.threat?.score > 70) {
      recommendations.push({
        id: "rec-2",
        priority: "high",
        title: "High competition detected",
        message: `${sortedByThreat[0].county} has significant competitive pressure. Consider aggressive pricing or service differentiation`,
        action: "View Competitive Analysis",
        actionValue: sortedByThreat[0].county,
      });
    }

    // Growth opportunity
    const lowThreats = this.rows.filter((r) => !r.threat || r.threat.score < 30);
    if (lowThreats.length > 0) {
      const topOpportunity = lowThreats.sort((a, b) => b.revenue[0] - a.revenue[0])[0];
      recommendations.push({
        id: "rec-3",
        priority: "medium",
        title: "Expand in undercompetitive market",
        message: `${topOpportunity.county} combines low competition with strong revenue potential. Consider accelerated launch timeline`,
        action: "Adjust Launch Timeline",
        actionValue: topOpportunity.county,
      });
    }

    // Service mix optimization
    const serviceDistribution = {};
    this.rows.forEach((r) => {
      serviceDistribution[r.service] = (serviceDistribution[r.service] || 0) + 1;
    });
    const dominantService = Object.entries(serviceDistribution).sort((a, b) => b[1] - a[1])[0];
    if (dominantService && dominantService[1] / this.rows.length > 0.5) {
      recommendations.push({
        id: "rec-4",
        priority: "low",
        title: "Diversify service line portfolio",
        message: `${dominantService[0]} represents ${((dominantService[1] / this.rows.length) * 100).toFixed(0)}% of your plan. Consider balancing with other services`,
        action: "Explore Service Mix",
      });
    }

    return recommendations;
  }

  // Calculate growth trends
  calculateTrends() {
    const trends = {
      y1ToY2Growth: this.totals.y2Revenue / this.totals.y1Revenue - 1,
      y2ToY3Growth: this.totals.y3Revenue / this.totals.y2Revenue - 1,
      avgAnnualGrowth: (Math.pow(this.totals.y3Revenue / this.totals.y1Revenue, 1 / 2) - 1) * 100,
      countiesLaunchingPerYear: [
        this.rows.filter((r) => r.launchGroup.includes("1")).length,
        this.rows.filter((r) => r.launchGroup.includes("2")).length,
        this.rows.filter((r) => r.launchGroup.includes("3")).length,
      ],
    };

    return trends;
  }

  // Risk assessment
  assessRisks() {
    const risks = [];
    const y1Concentration = this.rows.length > 0
      ? Math.max(...this.rows.map((r) => r.revenue[0])) / this.totals.y1Revenue
      : 0;

    if (y1Concentration > 0.3) {
      risks.push({
        id: "risk-1",
        severity: "high",
        title: "Revenue concentration risk",
        message: "More than 30% of revenue depends on a single county. Consider geographic diversification",
      });
    }

    const lowMarginCounties = this.rows.filter((r) => r.margin < 0.2).length;
    if (lowMarginCounties > 0) {
      risks.push({
        id: "risk-2",
        severity: "medium",
        title: "Low margin counties",
        message: `${lowMarginCounties} counties have margins below 20%. Review pricing and cost structure`,
      });
    }

    return risks;
  }

  // Get all insights
  getAllInsights() {
    return {
      anomalies: this.detectAnomalies(),
      recommendations: this.generateRecommendations(),
      trends: this.calculateTrends(),
      risks: this.assessRisks(),
    };
  }
}

// Quick calculation helpers
export function calculateMetricTrend(prev, current) {
  if (prev === 0) return 0;
  return ((current - prev) / prev) * 100;
}

export function getMetricStatus(value, benchmarks) {
  if (value > benchmarks.high) return "excellent";
  if (value > benchmarks.medium) return "good";
  if (value > benchmarks.low) return "fair";
  return "poor";
}

export function currency(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);
}

export function number(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value || 0);
}

export function percent(value) {
  return `${((value || 0) * 100).toFixed(1)}%`;
}

export function badgeTone(value) {
  return value.includes("Built in") ? "green" : value.includes("Partially") ? "blue" : "amber";
}

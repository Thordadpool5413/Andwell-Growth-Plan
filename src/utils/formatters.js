export function currency(value, options = {}) {
  const { minimumFractionDigits = 0, maximumFractionDigits = 0 } = options;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value || 0);
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

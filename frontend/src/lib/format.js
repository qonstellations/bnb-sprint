// Shared financial formatting per PLAN Sec 31. Currency follows API `currency` (default USD).
export function formatCurrency(value, currency = "USD") {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export function formatPercentage(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  const sign = Number(value) > 0 ? "+" : "";
  return `${sign}${Number(value).toFixed(2)}%`;
}

export function formatQuantity(value) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US").format(Number(value));
}

export function formatDateTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

// Unambiguous P&L: +$142.30 / -$53.10
export function formatPnl(value, currency = "USD") {
  if (value == null) return "—";
  const formatted = formatCurrency(Math.abs(value), currency);
  if (Number(value) > 0) return `+${formatted}`;
  if (Number(value) < 0) return `-${formatted}`;
  return formatted;
}

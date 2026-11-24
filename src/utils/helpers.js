// Shared utilities
export function mediaUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || window.location.origin;
  return `${base}/${String(path).replace(/^\//, "")}`;
}

export function formatCurrency(amount) {
  if (amount == null) return "$0.00";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function orderStatusBadge(status) {
  const map = {
    pending: "yellow", processing: "blue", shipped: "blue",
    delivered: "green", cancelled: "red", refunded: "gray",
  };
  return map[status] || "gray";
}

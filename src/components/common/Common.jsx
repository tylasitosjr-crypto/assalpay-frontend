// Common reusable components
export function Spinner() {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
    </div>
  );
}

export function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div className="empty-state">
      {icon && <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.4 }}>{icon}</div>}
      <h3>{title}</h3>
      {subtitle && <p style={{ marginBottom: "1rem" }}>{subtitle}</p>}
      {action}
    </div>
  );
}

export function Badge({ status, children }) {
  const map = {
    pending: "yellow", processing: "blue", shipped: "blue",
    delivered: "green", cancelled: "red", refunded: "gray",
    active: "green", inactive: "red", approved: "green", rejected: "red",
  };
  const cls = map[status?.toLowerCase()] || "gray";
  return <span className={`badge ${cls}`}>{children || status}</span>;
}

export function Stars({ value = 0, size = "1rem" }) {
  return (
    <span className="stars" style={{ fontSize: size }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= Math.round(value) ? "#f59e0b" : "#d1d5db" }}>★</span>
      ))}
    </span>
  );
}

export function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination">
      <button disabled={page === 1} onClick={() => onPage(page - 1)}>‹</button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
        <button key={p} className={p === page ? "active" : ""} onClick={() => onPage(p)}>{p}</button>
      ))}
      <button disabled={page === totalPages} onClick={() => onPage(page + 1)}>›</button>
    </div>
  );
}

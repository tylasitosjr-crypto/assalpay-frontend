import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getOrderDetails, generateInvoice } from "../../api/orders.js";
import { Spinner, Badge } from "../../components/common/Common.jsx";
import { formatCurrency, formatDate, mediaUrl } from "../../utils/helpers.js";
import { toast } from "react-toastify";
import { FiDownload } from "react-icons/fi";

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrderDetails(id).then(res => setOrder(res?.order || res)).finally(() => setLoading(false));
  }, [id]);

  async function handleDownloadInvoice() {
    try {
      const res = await generateInvoice(id);
      window.open(res?.url || res, "_blank");
    } catch (err) { toast.error(err.message || "Failed to generate invoice"); }
  }

  if (loading) return <Spinner />;
  if (!order) return <div className="empty-state"><h3>Order not found</h3></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Order #{String(order.id || order._id).slice(-8).toUpperCase()}</h1>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn outline" onClick={() => navigate("/orders")}>← Back</button>
          <button className="btn outline" onClick={handleDownloadInvoice}><FiDownload /> Invoice</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.5rem" }}>
        <div>
          <div className="card" style={{ marginBottom: "1.25rem" }}>
            <h3 className="card-title">Items</h3>
            {(order.order_items || []).map((item, i) => (
              <div key={i} style={{ display: "flex", gap: "1rem", padding: "0.75rem 0", borderBottom: i < order.order_items.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div style={{ width: 60, height: 60, borderRadius: 8, overflow: "hidden", background: "#f8faf9", flexShrink: 0 }}>
                  {item.image_url ? <img src={mediaUrl(item.image_url)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "1.5rem" }}>📦</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{item.product_name || item.name}</div>
                  <div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Qty: {item.quantity}</div>
                </div>
                <div style={{ fontWeight: 700, color: "var(--brand)" }}>{formatCurrency((item.price || 0) * (item.quantity || 1))}</div>
              </div>
            ))}
          </div>

          {order.order_status_histories?.length > 0 && (
            <div className="card">
              <h3 className="card-title">Status History</h3>
              {order.order_status_histories.map((h, i) => (
                <div key={i} style={{ display: "flex", gap: "1rem", padding: "0.5rem 0", borderBottom: i < order.order_status_histories.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <Badge status={h.status}>{h.status}</Badge>
                  <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{formatDate(h.created_at)}</span>
                  {h.note && <span style={{ fontSize: "0.85rem" }}>{h.note}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="card" style={{ marginBottom: "1.25rem" }}>
            <h3 className="card-title">Order Summary</h3>
            <div className="summary-row"><span>Status</span><Badge status={order.status}>{order.status}</Badge></div>
            <div className="summary-row"><span>Date</span><span>{formatDate(order.created_at)}</span></div>
            <div className="summary-row total"><span>Total</span><span>{formatCurrency(order.total_amount || order.total)}</span></div>
          </div>
          {order.address && (
            <div className="card">
              <h3 className="card-title">Delivery Address</h3>
              <p style={{ color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.7 }}>
                <strong>{order.address.name}</strong><br />
                {order.address.address}<br />
                {order.address.city}, {order.address.country}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

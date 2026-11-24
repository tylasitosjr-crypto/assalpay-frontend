import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getVendorOrderDetails, updateOrderStatus } from "../../api/vendor.js";
import { Spinner, Badge } from "../../components/common/Common.jsx";
import { formatCurrency, formatDate, mediaUrl } from "../../utils/helpers.js";
import { toast } from "react-toastify";

export default function VendorOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [updating, setUpdating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await getVendorOrderDetails(id);
      const o = res?.order || res;
      setOrder(o);
      if (o?.status) setStatus(o.status);
    } catch (err) {
      toast.error(err.message || "Failed to load order");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleStatusUpdate(e) {
    e.preventDefault();
    setUpdating(true);
    try {
      await updateOrderStatus({ order_id: id, status });
      toast.success("Order status updated!");
      load();
    } catch (err) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) return <Spinner />;
  if (!order) return <div className="empty-state"><h3>Order not found</h3></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Order #{String(order.id || order._id).slice(-8).toUpperCase()}</h1>
        <button className="btn" onClick={() => navigate("/vendor/orders")}>
          ← Back to Orders
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.5rem" }}>
        <div>
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <h3 className="card-title">Order Items</h3>
            {(order.order_items || []).map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  gap: "1rem",
                  padding: "0.75rem 0",
                  borderBottom: idx < order.order_items.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 8,
                    overflow: "hidden",
                    background: "#f8faf9",
                    flexShrink: 0,
                  }}
                >
                  {item.image_url ? (
                    <img
                      src={mediaUrl(item.image_url)}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>📦</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{item.product_name || item.name}</div>
                  <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                    Qty: {item.quantity} × {formatCurrency(item.price)}
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: "var(--brand)" }}>
                  {formatCurrency((item.price || 0) * (item.quantity || 1))}
                </div>
              </div>
            ))}
          </div>

          {order.address && (
            <div className="card">
              <h3 className="card-title">Shipping & Customer</h3>
              <p style={{ color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.7 }}>
                <strong>{order.address.name || order.customer_name}</strong><br />
                {order.address.phone && <>Phone: {order.address.phone}<br /></>}
                {order.address.address}<br />
                {order.address.city}, {order.address.state} {order.address.zip}, {order.address.country}
              </p>
            </div>
          )}
        </div>

        <div>
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <h3 className="card-title">Manage Status</h3>
            <form onSubmit={handleStatusUpdate}>
              <div className="form-group">
                <label>Current Status</label>
                <select
                  className="form-control"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <button className="btn primary full" type="submit" disabled={updating}>
                {updating ? "Updating..." : "Update Status"}
              </button>
            </form>
          </div>

          <div className="card">
            <h3 className="card-title">Financial Details</h3>
            <div className="summary-row">
              <span>Order Total</span>
              <strong>{formatCurrency(order.total_amount || order.total)}</strong>
            </div>
            <div className="summary-row">
              <span>Date Placed</span>
              <span>{formatDate(order.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

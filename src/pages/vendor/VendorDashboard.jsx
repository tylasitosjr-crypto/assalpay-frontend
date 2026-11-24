import { useEffect, useState } from "react";
import { getDashboardDetails } from "../../api/vendor.js";
import { getVendorOrderList } from "../../api/vendor.js";
import { Spinner, Badge } from "../../components/common/Common.jsx";
import { formatCurrency, formatDate } from "../../utils/helpers.js";
import { Link } from "react-router-dom";
import { FiPackage, FiShoppingBag, FiDollarSign, FiTrendingUp } from "react-icons/fi";

export default function VendorDashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [dashRes, ordRes] = await Promise.allSettled([getDashboardDetails(), getVendorOrderList({ page: 1, limit: 5 })]);
        if (dashRes.status === "fulfilled") setStats(dashRes.value?.dashboard || dashRes.value);
        if (ordRes.status === "fulfilled") setRecentOrders(ordRes.value?.orders || ordRes.value?.data || ordRes.value || []);
      } finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="page-header"><h1>Dashboard</h1></div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label"><FiPackage /> Total Products</div>
          <div className="stat-value">{stats?.total_products ?? "—"}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><FiShoppingBag /> Total Orders</div>
          <div className="stat-value">{stats?.total_orders ?? "—"}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><FiDollarSign /> Total Revenue</div>
          <div className="stat-value">{formatCurrency(stats?.total_revenue || 0)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><FiTrendingUp /> Pending Orders</div>
          <div className="stat-value">{stats?.pending_orders ?? "—"}</div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 className="card-title" style={{ margin: 0 }}>Recent Orders</h3>
          <Link to="/vendor/orders" style={{ fontSize: "0.85rem" }}>View all →</Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="empty-state" style={{ padding: "2rem" }}><h3>No orders yet</h3></div>
        ) : (
          <table className="orders-table">
            <thead><tr><th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {recentOrders.map(o => (
                <tr key={o.id || o._id}>
                  <td><Link to={`/vendor/orders/${o.id || o._id}`}>#{String(o.id || o._id).slice(-8).toUpperCase()}</Link></td>
                  <td>{o.user_name || o.customer_name || "—"}</td>
                  <td>{formatCurrency(o.total_amount || o.total)}</td>
                  <td><Badge status={o.status}>{o.status}</Badge></td>
                  <td>{formatDate(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

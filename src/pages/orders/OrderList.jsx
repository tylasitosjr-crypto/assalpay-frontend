import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getOrderList } from "../../api/orders.js";
import { Spinner, Badge, Pagination } from "../../components/common/Common.jsx";
import { formatCurrency, formatDate } from "../../utils/helpers.js";

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    getOrderList({ page, limit: 10 })
      .then(res => { setOrders(res?.orders || res?.data || res || []); setTotalPages(res?.total_pages || 1); })
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="page-header"><h1>My Orders</h1></div>
      {orders.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📦</div>
          <h3>No orders yet</h3>
          <p style={{ marginBottom: "1.5rem" }}>Start shopping to see your orders here.</p>
          <Link to="/products" className="btn primary">Browse Products</Link>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="orders-table">
            <thead>
              <tr><th>Order ID</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id || order._id}>
                  <td><strong>#{String(order.id || order._id).slice(-8).toUpperCase()}</strong></td>
                  <td>{formatDate(order.created_at)}</td>
                  <td>{order.item_count || order.order_items?.length || "—"}</td>
                  <td>{formatCurrency(order.total_amount || order.total)}</td>
                  <td><Badge status={order.status}>{order.status}</Badge></td>
                  <td><Link to={`/orders/${order.id || order._id}`}>View →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </div>
      )}
    </div>
  );
}

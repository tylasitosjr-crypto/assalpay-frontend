import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getVendorOrderList } from "../../api/vendor.js";
import { Spinner, Badge, Pagination } from "../../components/common/Common.jsx";
import { formatCurrency, formatDate } from "../../utils/helpers.js";

export default function VendorOrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  async function load() {
    setLoading(true);
    try {
      const res = await getVendorOrderList({ page, limit: 10 });
      setOrders(res?.orders || res?.data || res || []);
      setTotalPages(res?.total_pages || 1);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page]);

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="page-header">
        <h1>Orders</h1>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📦</div>
          <h3>No vendor orders yet</h3>
          <p>Orders containing your products will appear here.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id || o._id}>
                  <td>
                    <strong>#{String(o.id || o._id).slice(-8).toUpperCase()}</strong>
                  </td>
                  <td>{o.customer_name || o.user?.name || "Customer"}</td>
                  <td>{o.item_count || o.order_items?.length || 1}</td>
                  <td>{formatCurrency(o.total_amount || o.total)}</td>
                  <td>
                    <Badge status={o.status}>{o.status}</Badge>
                  </td>
                  <td>{formatDate(o.created_at)}</td>
                  <td>
                    <Link to={`/vendor/orders/${o.id || o._id}`} className="btn sm outline">
                      Manage →
                    </Link>
                  </td>
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

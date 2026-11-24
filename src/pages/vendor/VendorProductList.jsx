import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getVendorProductList, toggleProductStatus, deleteProduct } from "../../api/vendor.js";
import { Spinner, Badge, Pagination } from "../../components/common/Common.jsx";
import { formatCurrency, mediaUrl } from "../../utils/helpers.js";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { FiEdit2, FiTrash2, FiPlus } from "react-icons/fi";

export default function VendorProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  async function load() {
    setLoading(true);
    try {
      const res = await getVendorProductList({ page, limit: 10 });
      setProducts(res?.products || res?.data || res || []);
      setTotalPages(res?.total_pages || 1);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [page]);

  async function handleToggle(id, current) {
    try { await toggleProductStatus(id); load(); toast.success(`Product ${current === "active" ? "deactivated" : "activated"}!`); }
    catch (err) { toast.error(err.message); }
  }

  async function handleDelete(id) {
    const { isConfirmed } = await Swal.fire({ title: "Delete product?", text: "This cannot be undone.", icon: "warning", showCancelButton: true, confirmButtonColor: "#b91c1c", confirmButtonText: "Delete" });
    if (!isConfirmed) return;
    try { await deleteProduct(id); toast.success("Product deleted!"); load(); }
    catch (err) { toast.error(err.message); }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="page-header">
        <h1>Products</h1>
        <Link to="/vendor/products/new" className="btn primary"><FiPlus /> Add Product</Link>
      </div>
      {products.length === 0 ? (
        <div className="empty-state"><h3>No products yet</h3><p>Start by adding your first product.</p><Link to="/vendor/products/new" className="btn primary" style={{ marginTop: "1rem" }}>Add Product</Link></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="orders-table">
            <thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id || p._id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ width: 40, height: 40, borderRadius: 6, overflow: "hidden", background: "#f8faf9", flexShrink: 0 }}>
                        {p.product_images?.[0]?.image_url ? <img src={mediaUrl(p.product_images[0].image_url)} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /> : <span style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>📦</span>}
                      </div>
                      <span style={{ fontWeight: 600 }}>{p.name}</span>
                    </div>
                  </td>
                  <td>{formatCurrency(p.sale_price || p.price)}</td>
                  <td>{p.stock ?? "—"}</td>
                  <td><Badge status={p.status}>{p.status}</Badge></td>
                  <td>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <Link to={`/vendor/products/${p.id || p._id}/edit`} className="btn sm outline"><FiEdit2 /></Link>
                      <button className="btn sm" onClick={() => handleToggle(p.id || p._id, p.status)} title="Toggle status">{p.status === "active" ? "⏸" : "▶"}</button>
                      <button className="btn sm danger" onClick={() => handleDelete(p.id || p._id)}><FiTrash2 /></button>
                    </div>
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

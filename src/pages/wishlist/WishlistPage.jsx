import { useEffect, useState } from "react";
import { getUserWishlist, toggleWishlistProduct } from "../../api/wishlist.js";
import { Spinner } from "../../components/common/Common.jsx";
import ProductCard from "../../components/common/ProductCard.jsx";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await getUserWishlist();
      setItems(res?.wishlist || res || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function handleToggle(id) {
    setItems(items => items.filter(w => (w.product_id || w.product?.id) !== id));
  }

  if (loading) return <Spinner />;

  const products = items.map(w => w.product || { id: w.product_id, name: w.product_name, ...w });
  const wishlistIds = products.map(p => p.id);

  return (
    <div>
      <div className="page-header"><h1>❤️ Wishlist ({items.length})</h1></div>
      {items.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>💔</div>
          <h3>Your wishlist is empty</h3>
          <p style={{ marginBottom: "1.5rem" }}>Save products you love to find them later.</p>
          <Link to="/products" className="btn primary">Discover Products</Link>
        </div>
      ) : (
        <div className="products-grid">
          {products.map(p => (
            <ProductCard key={p.id || p._id} product={p} wishlistIds={wishlistIds} onWishlistToggle={handleToggle} />
          ))}
        </div>
      )}
    </div>
  );
}

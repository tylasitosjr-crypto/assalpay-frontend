import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { getUserProductList, getCategoryList, getSubCategoryList } from "../../api/products.js";
import { getUserWishlist } from "../../api/wishlist.js";
import { Spinner, Pagination } from "../../components/common/Common.jsx";
import ProductCard from "../../components/common/ProductCard.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export default function ProductList() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  const q = searchParams.get("q") || "";
  const catId = searchParams.get("category_id") || "";
  const subCatId = searchParams.get("sub_category_id") || "";
  const page = parseInt(searchParams.get("page") || "1");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (q) params.search = q;
      if (catId) params.category_id = catId;
      if (subCatId) params.sub_category_id = subCatId;
      const res = await getUserProductList(params);
      setProducts(res?.products || res?.data || res || []);
      setTotalPages(res?.total_pages || res?.totalPages || 1);
      if (user) {
        const wRes = await getUserWishlist();
        const items = wRes?.wishlist || wRes || [];
        setWishlistIds(items.map(w => w.product_id || w.id));
      }
    } finally {
      setLoading(false);
    }
  }, [q, catId, subCatId, page, user]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    getCategoryList().then(r => setCategories(r?.categories || r || [])).catch(() => {});
  }, []);
  useEffect(() => {
    if (catId) getSubCategoryList({ category_id: catId }).then(r => setSubCategories(r?.sub_categories || r || [])).catch(() => {});
    else setSubCategories([]);
  }, [catId]);

  function setParam(key, val) {
    const p = new URLSearchParams(searchParams);
    if (val) p.set(key, val); else p.delete(key);
    p.delete("page");
    setSearchParams(p);
  }

  return (
    <div>
      <div className="page-header">
        <h1>Products {q && <span style={{ color: "var(--muted)", fontSize: "1rem" }}>— "{q}"</span>}</h1>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <input
          className="form-control"
          placeholder="Search products…"
          defaultValue={q}
          onKeyDown={e => { if (e.key === "Enter") setParam("q", e.target.value); }}
          style={{ maxWidth: 220 }}
        />
        <select className="form-control" style={{ maxWidth: 180 }} value={catId} onChange={e => setParam("category_id", e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
        </select>
        {subCategories.length > 0 && (
          <select className="form-control" style={{ maxWidth: 180 }} value={subCatId} onChange={e => setParam("sub_category_id", e.target.value)}>
            <option value="">All Sub-categories</option>
            {subCategories.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
          </select>
        )}
      </div>

      {loading ? <Spinner /> : (
        <>
          {products.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📦</div>
              <h3>No products found</h3>
              <p>Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="products-grid">
              {products.map(p => (
                <ProductCard
                  key={p.id || p._id}
                  product={p}
                  wishlistIds={wishlistIds}
                  onWishlistToggle={id => setWishlistIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id])}
                />
              ))}
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} onPage={p => setParam("page", String(p))} />
        </>
      )}
    </div>
  );
}

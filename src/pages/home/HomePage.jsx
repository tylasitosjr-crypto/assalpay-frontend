import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getFeaturedList, getUserProductList, getCategoryList } from "../../api/products.js";
import { getFlashSaleProducts } from "../../api/cms.js";
import { getUserWishlist } from "../../api/wishlist.js";
import { Spinner } from "../../components/common/Common.jsx";
import ProductCard from "../../components/common/ProductCard.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

const CATEGORY_ICONS = ["👗", "👠", "👜", "⌚", "💍", "🧴", "🏠", "📱", "🎮", "🛒", "🌿", "🎁"];

export default function HomePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);
  const [flashSale, setFlashSale] = useState([]);
  const [categories, setCategories] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [featRes, catsRes] = await Promise.allSettled([
          getFeaturedList(),
          getCategoryList(),
        ]);
        if (featRes.status === "fulfilled") setFeatured(featRes.value?.products || featRes.value || []);
        if (catsRes.status === "fulfilled") setCategories(catsRes.value?.categories || catsRes.value || []);

        if (user) {
          const [flashRes, wishRes] = await Promise.allSettled([
            getFlashSaleProducts(),
            getUserWishlist(),
          ]);
          if (flashRes.status === "fulfilled") setFlashSale(flashRes.value?.products || flashRes.value || []);
          if (wishRes.status === "fulfilled") {
            const items = wishRes.value?.wishlist || wishRes.value || [];
            setWishlistIds(items.map((w) => w.product_id || w.id));
          }
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  function handleWishlistToggle(productId) {
    setWishlistIds((ids) =>
      ids.includes(productId) ? ids.filter((id) => id !== productId) : [...ids, productId]
    );
  }

  if (loading) return <Spinner />;

  return (
    <div>
      {/* Hero */}
      <div className="hero">
        <h1>{t("hero_title")}</h1>
        <p>{t("hero_desc")}</p>
        <button
          className="btn"
          style={{ background: "#fff", color: "var(--brand)", fontWeight: 700 }}
          onClick={() => navigate("/products")}
        >
          {t("browse_products")}
        </button>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <section style={{ marginBottom: "2.5rem" }}>
          <div className="section-title">
            <span>{t("shop_by_category")}</span>
            <Link to="/products">{t("view_all")}</Link>
          </div>
          <div className="categories-grid">
            {categories.slice(0, 12).map((cat, i) => (
              <Link
                key={cat.id || cat._id}
                to={`/products?category_id=${cat.id || cat._id}`}
                className="category-card"
              >
                <div className="category-icon">{CATEGORY_ICONS[i % CATEGORY_ICONS.length]}</div>
                {cat.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Flash Sale */}
      {flashSale.length > 0 && (
        <section style={{ marginBottom: "2.5rem" }}>
          <div className="section-title">
            <span>{t("flash_sales")}</span>
            <Link to="/products">{t("view_all")}</Link>
          </div>
          <div className="products-grid">
            {flashSale.slice(0, 4).map((p) => (
              <ProductCard
                key={p.id || p._id}
                product={p}
                wishlistIds={wishlistIds}
                onWishlistToggle={handleWishlistToggle}
              />
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <section style={{ marginBottom: "2.5rem" }}>
          <div className="section-title">
            <span>{t("featured_products")}</span>
            <Link to="/products">{t("view_all")}</Link>
          </div>
          <div className="products-grid">
            {featured.slice(0, 8).map((p) => (
              <ProductCard
                key={p.id || p._id}
                product={p}
                wishlistIds={wishlistIds}
                onWishlistToggle={handleWishlistToggle}
              />
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <div
        style={{
          background: "var(--brand-muted)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "2rem",
          textAlign: "center",
          marginBottom: "2rem",
        }}
      >
        <h2 style={{ marginBottom: "0.5rem" }}>{t("become_vendor")}</h2>
        <p style={{ color: "var(--muted)", marginBottom: "1.25rem" }}>
          {t("become_vendor_desc")}
        </p>
        <Link to="/signup" className="btn primary">
          {t("get_started")}
        </Link>
      </div>
    </div>
  );
}

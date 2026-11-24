import { Link, useNavigate } from "react-router-dom";
import { FiHeart } from "react-icons/fi";
import { mediaUrl, formatCurrency } from "../../utils/helpers.js";
import { Stars } from "./Common.jsx";
import { toggleWishlistProduct } from "../../api/wishlist.js";
import { addToCart } from "../../api/cart.js";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function ProductCard({ product, wishlistIds = [], onWishlistToggle }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isWishlisted = wishlistIds.includes(product.id || product._id);

  async function handleWishlist(e) {
    e.preventDefault();
    if (!user) return navigate("/login");
    try {
      await toggleWishlistProduct(product.id || product._id);
      onWishlistToggle && onWishlistToggle(product.id || product._id);
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleAddToCart(e) {
    e.preventDefault();
    if (!user) return navigate("/login");
    try {
      await addToCart({ product_id: product.id || product._id, quantity: 1 });
      toast.success(t("add_to_cart") + " !");
    } catch (err) {
      toast.error(err.message || "Failed to add to cart");
    }
  }

  const img = product.product_images?.[0]?.image_url || product.image_url;
  const price = product.sale_price || product.price || 0;
  const original = product.original_price || product.price;
  const hasDiscount = product.sale_price && product.sale_price < original;

  return (
    <Link to={`/products/${product.id || product._id}`} className="product-card" style={{ textDecoration: "none" }}>
      <div className="product-card-img">
        {img ? (
          <img src={mediaUrl(img)} alt={product.name} />
        ) : (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
            📦
          </div>
        )}
        <button
          className={`wishlist-btn ${isWishlisted ? "active" : ""}`}
          onClick={handleWishlist}
          title={isWishlisted ? t("wishlisted") : t("wishlist")}
        >
          <FiHeart />
        </button>
        {hasDiscount && <span className="sale-badge">{t("sale")}</span>}
      </div>
      <div className="product-card-body">
        {product.vendor_name && <div className="product-card-vendor">{product.vendor_name}</div>}
        <div className="product-card-name">{product.name}</div>
        <div className="product-card-price">
          {formatCurrency(price)}
          {hasDiscount && <span className="original">{formatCurrency(original)}</span>}
        </div>
        {product.average_rating > 0 && (
          <div className="product-card-stars">
            <Stars value={product.average_rating} />
            <span>({product.rating_count || 0})</span>
          </div>
        )}
        <button className="btn primary" onClick={handleAddToCart}>
          {t("add_to_cart")}
        </button>
      </div>
    </Link>
  );
}

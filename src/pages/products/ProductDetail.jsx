import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUserProductDetails } from "../../api/products.js";
import { addToCart } from "../../api/cart.js";
import { toggleWishlistProduct, getUserWishlist } from "../../api/wishlist.js";
import { addRating, getRatingList } from "../../api/orders.js";
import { Spinner, Stars, Badge } from "../../components/common/Common.jsx";
import { mediaUrl, formatCurrency, formatDate } from "../../utils/helpers.js";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext.jsx";
import { FiHeart, FiShoppingCart } from "react-icons/fi";

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [wishlisted, setWishlisted] = useState(false);
  const [addingCart, setAddingCart] = useState(false);
  const [review, setReview] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getUserProductDetails(id);
        const p = res?.product || res;
        setProduct(p);
        if (user) {
          const wRes = await getUserWishlist();
          const items = wRes?.wishlist || wRes || [];
          setWishlisted(items.some(w => (w.product_id || w.id) === p?.id));
          const rRes = await getRatingList({ product_id: id });
          setRatings(rRes?.ratings || rRes || []);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, user]);

  async function handleAddToCart() {
    if (!user) return navigate("/login");
    setAddingCart(true);
    try {
      await addToCart({
        product_id: product.id || product._id,
        quantity: qty,
        product_variant_id: selectedVariant,
        product_variant_size_id: selectedSize,
      });
      toast.success("Added to cart!");
    } catch (err) {
      toast.error(err.message || "Failed to add");
    } finally {
      setAddingCart(false);
    }
  }

  async function handleWishlist() {
    if (!user) return navigate("/login");
    try {
      await toggleWishlistProduct(product.id || product._id);
      setWishlisted(w => !w);
      toast.success(wishlisted ? "Removed from wishlist" : "Added to wishlist");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleReviewSubmit(e) {
    e.preventDefault();
    if (!user) return navigate("/login");
    setSubmittingReview(true);
    try {
      await addRating({ product_id: product.id || product._id, ...review });
      toast.success("Review submitted!");
      const rRes = await getRatingList({ product_id: id });
      setRatings(rRes?.ratings || rRes || []);
      setReview({ rating: 5, comment: "" });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmittingReview(false);
    }
  }

  if (loading) return <Spinner />;
  if (!product) return <div className="empty-state"><h3>Product not found</h3></div>;

  const images = product.product_images || [];
  const price = product.sale_price || product.price || 0;
  const original = product.original_price || product.price;
  const hasDiscount = product.sale_price && product.sale_price < original;

  return (
    <div>
      <div className="product-detail">
        {/* Images */}
        <div className="product-images">
          <div className="main-img">
            {images[activeImg]?.image_url
              ? <img src={mediaUrl(images[activeImg].image_url)} alt={product.name} />
              : <div style={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "5rem" }}>📦</div>
            }
          </div>
          {images.length > 1 && (
            <div className="product-thumbs">
              {images.map((img, i) => (
                <img key={i} src={mediaUrl(img.image_url)} alt="" className={i === activeImg ? "active" : ""} onClick={() => setActiveImg(i)} />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="product-info">
          <h1>{product.name}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            {product.average_rating > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Stars value={product.average_rating} />
                <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>({product.rating_count || 0})</span>
              </div>
            )}
            {product.vendor_name && <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>by {product.vendor_name}</span>}
          </div>
          <div className="product-price">
            {formatCurrency(price)}
            {hasDiscount && <span className="original">{formatCurrency(original)}</span>}
          </div>
          {product.description && <p className="product-desc">{product.description}</p>}

          {/* Variants */}
          {product.product_variants?.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <div className="variants-label">Color / Variant</div>
              <div className="variants-list">
                {product.product_variants.map(v => (
                  <button key={v.id} className={`variant-btn ${selectedVariant === v.id ? "active" : ""}`} onClick={() => { setSelectedVariant(v.id); setSelectedSize(null); }}>
                    {v.color || v.name || `Variant ${v.id}`}
                  </button>
                ))}
              </div>
              {selectedVariant && product.product_variants.find(v => v.id === selectedVariant)?.product_variant_sizes?.length > 0 && (
                <>
                  <div className="variants-label">Size</div>
                  <div className="variants-list">
                    {product.product_variants.find(v => v.id === selectedVariant).product_variant_sizes.map(s => (
                      <button key={s.id} className={`variant-btn ${selectedSize === s.id ? "active" : ""}`} onClick={() => setSelectedSize(s.id)}>
                        {s.size}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Quantity */}
          <div style={{ marginBottom: "1rem" }}>
            <div className="variants-label">Quantity</div>
            <div className="qty-control">
              <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <span>{qty}</span>
              <button onClick={() => setQty(q => q + 1)}>+</button>
            </div>
          </div>

          <div className="product-actions">
            <button className="btn primary lg" onClick={handleAddToCart} disabled={addingCart}>
              <FiShoppingCart /> {addingCart ? "Adding…" : "Add to Cart"}
            </button>
            <button className={`btn lg ${wishlisted ? "danger" : "outline"}`} onClick={handleWishlist}>
              <FiHeart /> {wishlisted ? "Wishlisted" : "Wishlist"}
            </button>
          </div>

          {product.stock !== undefined && (
            <div style={{ marginTop: "1rem", fontSize: "0.85rem", color: product.stock > 0 ? "var(--success)" : "var(--danger)" }}>
              {product.stock > 0 ? `✓ ${product.stock} in stock` : "✗ Out of stock"}
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div style={{ marginTop: "3rem" }}>
        <h2 style={{ marginBottom: "1.5rem" }}>Customer Reviews</h2>
        {user && (
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <h3 className="card-title">Write a Review</h3>
            <form onSubmit={handleReviewSubmit}>
              <div className="form-group">
                <label>Rating</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button" onClick={() => setReview(r => ({ ...r, rating: n }))} style={{ background: "none", border: "none", fontSize: "1.75rem", cursor: "pointer", color: n <= review.rating ? "#f59e0b" : "#d1d5db" }}>★</button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Comment</label>
                <textarea className="form-control" rows={3} value={review.comment} onChange={e => setReview(r => ({ ...r, comment: e.target.value }))} placeholder="Share your experience…" />
              </div>
              <button className="btn primary" type="submit" disabled={submittingReview}>{submittingReview ? "Submitting…" : "Submit Review"}</button>
            </form>
          </div>
        )}
        {ratings.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No reviews yet. Be the first!</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {ratings.map((r, i) => (
              <div key={i} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <div>
                    <Stars value={r.rating} />
                    <strong style={{ marginLeft: "0.5rem" }}>{r.user_name || r.user?.name || "User"}</strong>
                  </div>
                  <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{formatDate(r.created_at)}</span>
                </div>
                <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

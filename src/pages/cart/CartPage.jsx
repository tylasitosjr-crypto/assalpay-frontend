import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCartDetails, decrementCartItem, removeCartItem } from "../../api/cart.js";
import { Spinner } from "../../components/common/Common.jsx";
import { mediaUrl, formatCurrency } from "../../utils/helpers.js";
import { toast } from "react-toastify";
import { FiTrash2, FiPlus, FiMinus } from "react-icons/fi";
import { addToCart } from "../../api/cart.js";

export default function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await getCartDetails();
      setCart(res?.cart || res);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleIncrement(item) {
    try {
      await addToCart({ product_id: item.product_id, quantity: 1, product_variant_id: item.product_variant_id, product_variant_size_id: item.product_variant_size_id });
      load();
    } catch (err) { toast.error(err.message); }
  }

  async function handleDecrement(item) {
    try {
      await decrementCartItem({ cart_item_id: item.id });
      load();
    } catch (err) { toast.error(err.message); }
  }

  async function handleRemove(itemId) {
    try {
      await removeCartItem(itemId);
      load();
    } catch (err) { toast.error(err.message); }
  }

  if (loading) return <Spinner />;

  const items = cart?.cart_items || cart?.items || [];
  const subtotal = items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);

  return (
    <div>
      <div className="page-header"><h1>Shopping Cart</h1></div>
      {items.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🛒</div>
          <h3>Your cart is empty</h3>
          <p style={{ marginBottom: "1.5rem" }}>Discover amazing products to fill it up.</p>
          <button className="btn primary" onClick={() => navigate("/products")}>Browse Products</button>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="card">
            {items.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-img">
                  {item.image_url ? <img src={mediaUrl(item.image_url)} alt={item.product_name} /> : <span style={{ fontSize: "2rem" }}>📦</span>}
                </div>
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.product_name || item.name}</div>
                  <div className="cart-item-meta">
                    {item.variant_name && <span>{item.variant_name} </span>}
                    {item.size && <span>· Size: {item.size}</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.5rem" }}>
                    <div className="qty-control">
                      <button onClick={() => handleDecrement(item)}><FiMinus /></button>
                      <span>{item.quantity}</span>
                      <button onClick={() => handleIncrement(item)}><FiPlus /></button>
                    </div>
                    <div className="cart-item-price">{formatCurrency((item.price || 0) * (item.quantity || 1))}</div>
                  </div>
                </div>
                <button className="btn danger sm" onClick={() => handleRemove(item.id)} style={{ alignSelf: "flex-start" }}><FiTrash2 /></button>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            <h3>Order Summary</h3>
            <div className="summary-row"><span>Subtotal ({items.length} items)</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="summary-row"><span>Shipping</span><span>Calculated at checkout</span></div>
            <div className="summary-row total"><span>Estimated Total</span><span>{formatCurrency(subtotal)}</span></div>
            <button className="btn primary full" style={{ marginTop: "1rem" }} onClick={() => navigate("/checkout")}>Proceed to Checkout</button>
            <button className="btn full" style={{ marginTop: "0.5rem" }} onClick={() => navigate("/products")}>Continue Shopping</button>
          </div>
        </div>
      )}
    </div>
  );
}

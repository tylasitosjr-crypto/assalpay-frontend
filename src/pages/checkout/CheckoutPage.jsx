import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCheckoutDetails, placeOrder } from "../../api/orders.js";
import { getAddressList, addAddress } from "../../api/address.js";
import { Spinner } from "../../components/common/Common.jsx";
import { formatCurrency } from "../../utils/helpers.js";
import { toast } from "react-toastify";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [checkout, setCheckout] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [coupon, setCoupon] = useState("");
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [newAddr, setNewAddr] = useState({ name: "", phone: "", address: "", city: "", state: "", zip: "", country: "" });

  useEffect(() => {
    async function load() {
      try {
        const [coRes, addrRes] = await Promise.all([getCheckoutDetails(), getAddressList()]);
        setCheckout(coRes?.checkout || coRes);
        const addrs = addrRes?.addresses || addrRes || [];
        setAddresses(addrs);
        const def = addrs.find(a => a.is_default) || addrs[0];
        if (def) setSelectedAddress(def.id || def._id);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleAddAddress(e) {
    e.preventDefault();
    try {
      const res = await addAddress(newAddr);
      const addrs = [...addresses, res?.address || res];
      setAddresses(addrs);
      setSelectedAddress((res?.address || res).id);
      setShowAddAddr(false);
      toast.success("Address added!");
    } catch (err) { toast.error(err.message); }
  }

  async function handlePlaceOrder() {
    if (!selectedAddress) return toast.error("Please select a delivery address");
    setPlacing(true);
    try {
      const res = await placeOrder({ address_id: selectedAddress, coupon_code: coupon || undefined });
      toast.success("Order placed successfully!");
      navigate(`/orders/${res?.order?.id || res?.id || ""}`);
    } catch (err) {
      toast.error(err.message || "Failed to place order");
    } finally {
      setPlacing(false);
    }
  }

  if (loading) return <Spinner />;

  const items = checkout?.cart_items || checkout?.items || [];
  const subtotal = checkout?.subtotal || items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);

  return (
    <div>
      <div className="page-header"><h1>Checkout</h1></div>
      <div className="cart-layout">
        <div>
          {/* Address Selection */}
          <div className="card" style={{ marginBottom: "1.25rem" }}>
            <h3 className="card-title">Delivery Address</h3>
            {addresses.length === 0 ? (
              <p style={{ color: "var(--muted)", marginBottom: "1rem" }}>No addresses saved yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
                {addresses.map(addr => (
                  <label key={addr.id || addr._id} style={{ display: "flex", gap: "0.75rem", cursor: "pointer", padding: "0.75rem", border: `1.5px solid ${selectedAddress === (addr.id || addr._id) ? "var(--brand)" : "var(--border)"}`, borderRadius: "8px", transition: "border-color 0.15s" }}>
                    <input type="radio" name="address" value={addr.id || addr._id} checked={selectedAddress === (addr.id || addr._id)} onChange={() => setSelectedAddress(addr.id || addr._id)} />
                    <div>
                      <strong>{addr.name}</strong> · {addr.phone}<br />
                      <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{addr.address}, {addr.city}, {addr.state} {addr.zip}, {addr.country}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <button className="btn outline sm" onClick={() => setShowAddAddr(v => !v)}>+ Add New Address</button>
            {showAddAddr && (
              <form onSubmit={handleAddAddress} style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div className="form-row">
                  <div className="form-group"><label>Name</label><input className="form-control" value={newAddr.name} onChange={e => setNewAddr(a => ({ ...a, name: e.target.value }))} required /></div>
                  <div className="form-group"><label>Phone</label><input className="form-control" value={newAddr.phone} onChange={e => setNewAddr(a => ({ ...a, phone: e.target.value }))} /></div>
                </div>
                <div className="form-group"><label>Address</label><input className="form-control" value={newAddr.address} onChange={e => setNewAddr(a => ({ ...a, address: e.target.value }))} required /></div>
                <div className="form-row">
                  <div className="form-group"><label>City</label><input className="form-control" value={newAddr.city} onChange={e => setNewAddr(a => ({ ...a, city: e.target.value }))} /></div>
                  <div className="form-group"><label>Country</label><input className="form-control" value={newAddr.country} onChange={e => setNewAddr(a => ({ ...a, country: e.target.value }))} /></div>
                </div>
                <button className="btn primary" type="submit">Save Address</button>
              </form>
            )}
          </div>

          {/* Coupon */}
          <div className="card">
            <h3 className="card-title">Coupon Code</h3>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <input className="form-control" placeholder="Enter coupon code" value={coupon} onChange={e => setCoupon(e.target.value)} />
              <button className="btn outline">Apply</button>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="cart-summary">
          <h3>Order Summary</h3>
          {items.map((item, i) => (
            <div key={i} className="summary-row" style={{ fontSize: "0.85rem" }}>
              <span>{item.product_name || item.name} × {item.quantity}</span>
              <span>{formatCurrency((item.price || 0) * (item.quantity || 1))}</span>
            </div>
          ))}
          <div className="summary-row total"><span>Total</span><span>{formatCurrency(subtotal)}</span></div>
          <button className="btn primary full" style={{ marginTop: "1rem" }} onClick={handlePlaceOrder} disabled={placing}>
            {placing ? "Placing Order…" : "Place Order"}
          </button>
          <button className="btn full" style={{ marginTop: "0.5rem" }} onClick={() => navigate("/cart")}>← Back to Cart</button>
        </div>
      </div>
    </div>
  );
}

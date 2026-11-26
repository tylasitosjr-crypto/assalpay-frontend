import React, { useState, useMemo } from "react";
import { useGrispella } from "../context/GrispellaContext.jsx";
import { toast } from "react-toastify";
import { DEPOTS } from "../constants/grispella.js";
import {
  FiSearch, FiShoppingCart, FiUser, FiTrash2, FiPlus, FiMinus,
  FiMapPin, FiDollarSign, FiCreditCard, FiPrinter, FiX, FiCheckCircle,
  FiAlertTriangle, FiTag,
} from "react-icons/fi";

const PAYMENT_METHODS_LIST = ["Cash", "Waafi", "CAC", "Saba", "Exim Bank"];

const METHOD_ICONS = {
  Cash: "💵",
  Waafi: "📱",
  CAC: "🏦",
  Saba: "🏧",
  "Exim Bank": "🏛️",
};

export default function POS() {
  const { state, formatFDJ, processSale, getAvailableStock } = useGrispella();
  const { products = [], customers = [], currentUser, currentDepot = "DEP-01" } = state || {};

  const [selectedDepot, setSelectedDepot] = useState(currentDepot || "DEP-01");
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("CLI-000");
  const [discount, setDiscount] = useState(0);
  const [payments, setPayments] = useState([{ method: "Cash", amount: "" }]);
  const [completedInvoice, setCompletedInvoice] = useState(null);
  const [printType, setPrintType] = useState("a4");
  const [selectedUnit, setSelectedUnit] = useState({});
  const [activeCategory, setActiveCategory] = useState("all");

  const getStock = (product, depotId) => {
    if (product.stockByDepot) {
      const d = product.stockByDepot[depotId];
      if (!d) return 0;
      return typeof d === "object" ? Math.max(0, (d.physical || 0) - (d.reserved || 0)) : d;
    }
    if (product.stocks) return Number(product.stocks[depotId] || 0);
    return 0;
  };

  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category).filter(Boolean))];
    return cats;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return products.filter(p => {
      if (q && !(p.name.toLowerCase().includes(q) || (p.ref || "").toLowerCase().includes(q) || (p.barcode || "").includes(q))) return false;
      if (activeCategory !== "all" && p.category !== activeCategory) return false;
      return true;
    });
  }, [searchTerm, products, activeCategory]);

  const addToCart = (product) => {
    const unitConfig = selectedUnit[product.id] || product.saleUnits?.[0] || { unit: product.baseUnit || "pièce", factor: 1, priceGross: product.priceGross || 0 };
    const availableStock = getStock(product, selectedDepot);
    if (availableStock <= 0) { toast.error(`${product.name} — Rupture de stock`); return; }

    setCart(prev => {
      const key = `${product.id}__${unitConfig.unit}`;
      const existing = prev.find(i => i.cartKey === key);
      if (existing) {
        const newQty = existing.quantity + 1;
        if (newQty * (unitConfig.factor || 1) > availableStock) { toast.warning("Quantité maximale atteinte"); return prev; }
        return prev.map(i => i.cartKey === key ? { ...i, quantity: newQty } : i);
      }
      return [...prev, {
        cartKey: key,
        productId: product.id,
        productName: product.name,
        unit: unitConfig.unit,
        unitFactor: unitConfig.factor || 1,
        quantity: 1,
        unitPrice: unitConfig.priceGross || product.priceGross || 0,
        maxQty: Math.floor(availableStock / (unitConfig.factor || 1)),
      }];
    });
  };

  const updateQty = (cartKey, delta) => {
    setCart(prev => prev.map(i => {
      if (i.cartKey !== cartKey) return i;
      const newQty = i.quantity + delta;
      if (newQty <= 0) return null;
      if (newQty > i.maxQty) { toast.warning("Stock insuffisant"); return i; }
      return { ...i, quantity: newQty };
    }).filter(Boolean));
  };

  const removeFromCart = (cartKey) => setCart(prev => prev.filter(i => i.cartKey !== cartKey));

  const subtotal = cart.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const totalAfterDiscount = Math.max(0, subtotal - (Number(discount) || 0));
  const totalPayments = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const creditAmount = Math.max(0, totalAfterDiscount - totalPayments);
  const change = Math.max(0, totalPayments - totalAfterDiscount);

  const updatePayment = (idx, key, val) => setPayments(prev => prev.map((p, i) => i === idx ? { ...p, [key]: val } : p));
  const addPaymentLine = () => setPayments(prev => [...prev, { method: "Cash", amount: "" }]);
  const removePaymentLine = (idx) => setPayments(prev => prev.filter((_, i) => i !== idx));
  const handleQuickPay = () => setPayments([{ method: "Cash", amount: String(totalAfterDiscount) }]);

  const handleProcessSale = () => {
    if (cart.length === 0) { toast.error("Le panier est vide"); return; }
    if (totalPayments > totalAfterDiscount) { toast.error("Paiement supérieur au total"); return; }

    const customer = customers.find(c => c.id === selectedCustomer);
    const creditLimit = customer?.creditLimit || 0;
    const currentDebt = customer?.debtAmount || customer?.currentDebt || 0;
    if (creditAmount > 0 && selectedCustomer !== "CLI-000" && (currentDebt + creditAmount) > creditLimit) {
      if (!window.confirm(`⚠️ La dette de ${customer?.name} dépassera sa limite de crédit (${formatFDJ(creditLimit)}).\nContinuer quand même ?`)) return;
    }
    if (creditAmount > 0 && selectedCustomer === "CLI-000") {
      toast.error("Client comptoir ne peut pas avoir de crédit.");
      return;
    }

    const invoice = processSale({
      customerId: selectedCustomer,
      depotId: selectedDepot,
      items: cart.map(i => ({ ...i })),
      discount: Number(discount) || 0,
      payments: payments.filter(p => Number(p.amount) > 0).map(p => ({ method: p.method, amount: Number(p.amount) })),
    });

    toast.success(`✅ Vente enregistrée — ${invoice.id}`);
    setCompletedInvoice(invoice);
    setCart([]);
    setDiscount(0);
    setPayments([{ method: "Cash", amount: "" }]);
    setSelectedCustomer("CLI-000");
  };

  const selectedCustomerObj = customers.find(c => c.id === selectedCustomer);

  return (
    <div className="grispella-page" style={{ flex: 1, minHeight: 0 }}>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 40, height: 40, background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
            borderRadius: "var(--radius)", display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: "1.2rem", boxShadow: "0 2px 10px rgba(16,185,129,0.3)"
          }}>
            <FiShoppingCart />
          </div>
          <div>
            <h1 style={{ marginBottom: 0, fontSize: "1.2rem" }}>Point de Vente</h1>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: 0 }}>Caisse & Encaissement</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          <FiMapPin style={{ color: "var(--text-muted)", fontSize: "0.85rem" }} />
          <select className="form-select" value={selectedDepot} onChange={e => setSelectedDepot(e.target.value)} style={{ width: "auto", fontWeight: 600 }}>
            {DEPOTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grispella-pos-layout" style={{ flex: 1 }}>
        {/* LEFT — Catalog */}
        <div className="pos-catalog-column">
          {/* Search */}
          <div className="grispella-card" style={{ padding: "12px 14px" }}>
            <div className="pos-search-bar">
              <FiSearch className="search-icon-pos" />
              <input
                type="text"
                className="form-input"
                placeholder="Rechercher par nom, référence ou code-barres..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
            {/* Category tabs */}
            {categories.length > 0 && (
              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                <button
                  className={`btn btn-xs ${activeCategory === "all" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setActiveCategory("all")}
                >
                  Tous
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    className={`btn btn-xs ${activeCategory === cat ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product grid */}
          <div className="pos-product-grid">
            {filteredProducts.map(p => {
              const unitConfig = selectedUnit[p.id] || p.saleUnits?.[0] || { unit: p.baseUnit || "pièce", factor: 1, priceGross: p.priceGross || 0 };
              const stock = getStock(p, selectedDepot);
              const isOut = stock <= 0;
              const isLow = !isOut && stock <= (p.alertThreshold || p.stockAlertThreshold || 10);

              return (
                <div
                  key={p.id}
                  className={`pos-product-card${isOut ? " out-of-stock" : ""}`}
                  onClick={() => !isOut && addToCart(p)}
                  title={isOut ? "Rupture de stock" : `Ajouter ${p.name}`}
                >
                  {/* Unit selector */}
                  {p.saleUnits && p.saleUnits.length > 1 && (
                    <select
                      style={{
                        padding: "2px 4px", fontSize: "0.68rem", marginBottom: 2,
                        border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg2)",
                        cursor: "pointer", width: "100%"
                      }}
                      value={unitConfig.unit}
                      onClick={e => e.stopPropagation()}
                      onChange={e => {
                        const u = p.saleUnits.find(u => u.unit === e.target.value);
                        setSelectedUnit(prev => ({ ...prev, [p.id]: u }));
                      }}
                    >
                      {p.saleUnits.map(u => <option key={u.unit} value={u.unit}>{u.label || u.unit}</option>)}
                    </select>
                  )}

                  <div className="prod-name">{p.name}</div>

                  <div className="prod-price">
                    {formatFDJ(unitConfig.priceGross || p.priceGross || 0)}
                  </div>

                  <div className="prod-stock" style={{
                    color: isOut ? "var(--danger)" : isLow ? "var(--warning)" : "var(--accent)"
                  }}>
                    {isOut ? (
                      <><FiAlertTriangle style={{ marginRight: 2 }} />Rupture</>
                    ) : isLow ? (
                      `⚠ Stock: ${stock}`
                    ) : (
                      `✓ Stock: ${stock}`
                    )}
                  </div>
                </div>
              );
            })}
            {filteredProducts.length === 0 && (
              <div style={{ gridColumn: "1/-1" }}>
                <div className="empty-state">
                  <div className="empty-state-icon"><FiSearch /></div>
                  <div className="empty-state-text">Aucun article trouvé</div>
                  <div className="empty-state-sub">Essayez un autre terme de recherche</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Cart */}
        <div className="pos-cart-column">
          {/* Customer */}
          <div className="customer-selector-card">
            <div className="form-group">
              <label><FiUser style={{ marginRight: 4 }} />Client</label>
              <select className="form-select" value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)}>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {selectedCustomerObj && (selectedCustomerObj.debtAmount || selectedCustomerObj.currentDebt || 0) > 0 && (
              <div className="customer-debt-alert">
                <FiAlertTriangle />
                Dette: {formatFDJ(selectedCustomerObj.debtAmount || selectedCustomerObj.currentDebt || 0)}
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div className="pos-cart-panel">
            <div className="pos-cart-header">
              <h3>
                <FiShoppingCart />
                Panier
                {cart.length > 0 && <span className="cart-count-badge">{cart.length}</span>}
              </h3>
              {cart.length > 0 && (
                <button className="btn btn-xs btn-ghost" onClick={() => setCart([])}>
                  <FiTrash2 /> Vider
                </button>
              )}
            </div>

            <div className="pos-cart-items">
              {cart.length === 0 ? (
                <div className="cart-empty">
                  <div className="cart-empty-icon"><FiShoppingCart /></div>
                  <div style={{ fontSize: "0.84rem", fontWeight: 600 }}>Panier vide</div>
                  <div style={{ fontSize: "0.75rem" }}>Cliquez sur un article pour l'ajouter</div>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.cartKey} className="cart-item">
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.productName}</div>
                      <div className="cart-item-unit">{item.unit} · {formatFDJ(item.unitPrice)}/u</div>
                      <div className="cart-item-subtotal">{formatFDJ(item.quantity * item.unitPrice)}</div>
                    </div>
                    <div className="cart-item-controls">
                      <div className="qty-control">
                        <button className="qty-btn qty-minus" onClick={() => updateQty(item.cartKey, -1)}><FiMinus /></button>
                        <span className="qty-span">{item.quantity}</span>
                        <button className="qty-btn" onClick={() => updateQty(item.cartKey, 1)}><FiPlus /></button>
                      </div>
                      <button className="cart-remove-btn" onClick={() => removeFromCart(item.cartKey)}>
                        <FiX size={11} /> Retirer
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Discount */}
          <div className="grispella-card" style={{ padding: "12px 14px" }}>
            <div className="form-group">
              <label><FiTag style={{ marginRight: 4 }} />Remise (FDJ)</label>
              <input
                type="number"
                className="form-input"
                value={discount}
                onChange={e => setDiscount(e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          {/* Totals */}
          <div className="pos-totals-panel">
            <div className="pos-total-row">
              <span>Sous-total</span>
              <span>{formatFDJ(subtotal)}</span>
            </div>
            {Number(discount) > 0 && (
              <div className="pos-total-row">
                <span>Remise</span>
                <span style={{ color: "#6ee7b7" }}>−{formatFDJ(Number(discount))}</span>
              </div>
            )}
            <div className="pos-total-row grand-total">
              <span>TOTAL</span>
              <span>{formatFDJ(totalAfterDiscount)}</span>
            </div>
            {creditAmount > 0 && (
              <div className="pos-total-row credit-row">
                <span>Crédit restant</span>
                <span>{formatFDJ(creditAmount)}</span>
              </div>
            )}
            {change > 0 && (
              <div className="pos-total-row" style={{ color: "#6ee7b7" }}>
                <span>Monnaie à rendre</span>
                <span>{formatFDJ(change)}</span>
              </div>
            )}
          </div>

          {/* Payments */}
          <div className="grispella-card" style={{ padding: "12px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <FiCreditCard style={{ marginRight: 4 }} />Paiement
              </label>
              <div style={{ display: "flex", gap: 5 }}>
                <button className="btn btn-xs btn-outline" onClick={handleQuickPay}>Tout Cash</button>
                <button className="btn btn-xs btn-secondary" onClick={addPaymentLine}><FiPlus /></button>
              </div>
            </div>

            {payments.map((p, idx) => (
              <div key={idx} className="payment-split-row">
                <select
                  className="form-select"
                  value={p.method}
                  onChange={e => updatePayment(idx, "method", e.target.value)}
                  style={{ flex: 1, fontSize: "0.8rem" }}
                >
                  {PAYMENT_METHODS_LIST.map(m => (
                    <option key={m} value={m}>{METHOD_ICONS[m]} {m}</option>
                  ))}
                </select>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Montant"
                  value={p.amount}
                  onChange={e => updatePayment(idx, "amount", e.target.value)}
                  style={{ flex: 1.4, fontSize: "0.84rem" }}
                />
                {payments.length > 1 && (
                  <button className="btn btn-xs btn-danger" onClick={() => removePaymentLine(idx)}><FiX /></button>
                )}
              </div>
            ))}

            <div style={{ textAlign: "right", fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 4 }}>
              Versé: <strong style={{ color: totalPayments >= totalAfterDiscount ? "var(--accent)" : "var(--danger)" }}>
                {formatFDJ(totalPayments)}
              </strong>
            </div>
          </div>

          {/* Confirm */}
          <button
            className="pos-confirm-btn"
            onClick={handleProcessSale}
            disabled={cart.length === 0}
          >
            <FiCheckCircle />
            Valider la vente
            {cart.length > 0 && <span style={{ opacity: 0.7, fontSize: "0.8rem" }}>({formatFDJ(totalAfterDiscount)})</span>}
          </button>
        </div>
      </div>

      {/* Print Modal */}
      {completedInvoice && (
        <div className="print-modal-overlay">
          <div className="print-modal-content">
            <div className="no-print" style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 6, background: "var(--bg2)", padding: "4px", borderRadius: "var(--radius)", flex: 1 }}>
                <button className={`btn btn-sm ${printType === "a4" ? "btn-primary" : "btn-ghost"}`} onClick={() => setPrintType("a4")}>
                  📄 Format A4
                </button>
                <button className={`btn btn-sm ${printType === "ticket" ? "btn-primary" : "btn-ghost"}`} onClick={() => setPrintType("ticket")}>
                  🧾 Ticket 80mm
                </button>
              </div>
              <button className="btn btn-sm btn-primary" onClick={() => window.print()}>
                <FiPrinter /> Imprimer
              </button>
              <button className="btn btn-sm btn-secondary" onClick={() => setCompletedInvoice(null)}>
                <FiX /> Fermer
              </button>
            </div>

            {printType === "a4" ? (
              <div className="printable-a4-invoice">
                <div className="invoice-header">
                  <div className="company-info">
                    <h2>GRISPELLA GENERAL TRADING SARL</h2>
                    <p>Djibouti | Tél: +253 21 35 00 00</p>
                    <p style={{ fontSize: "0.78rem", color: "#666" }}>NIF: DJI-123456</p>
                  </div>
                  <div className="invoice-meta">
                    <h3>FACTURE</h3>
                    <p><strong>N°</strong> {completedInvoice.id}</p>
                    <p><strong>Date:</strong> {new Date(completedInvoice.date).toLocaleDateString("fr-FR")}</p>
                  </div>
                </div>
                <div className="invoice-parties">
                  <div>
                    <strong>Vendeur:</strong>
                    <p>GRISPELLA GENERAL TRADING SARL</p>
                    <p style={{ fontSize: "0.78rem", color: "#666" }}>Djibouti</p>
                  </div>
                  <div>
                    <strong>Client:</strong>
                    <p>{customers.find(c => c.id === completedInvoice.customerId)?.name || "Client Comptoir"}</p>
                  </div>
                </div>
                <table className="invoice-table">
                  <thead>
                    <tr>
                      <th>Désignation</th>
                      <th>Unité</th>
                      <th style={{ textAlign: "center" }}>Qté</th>
                      <th style={{ textAlign: "right" }}>Prix Unit.</th>
                      <th style={{ textAlign: "right" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedInvoice.items.map((item, i) => (
                      <tr key={i}>
                        <td>{item.productName}</td>
                        <td>{item.unit}</td>
                        <td style={{ textAlign: "center" }}>{item.quantity}</td>
                        <td style={{ textAlign: "right" }}>{formatFDJ(item.unitPrice)}</td>
                        <td style={{ textAlign: "right" }}>{formatFDJ(item.quantity * item.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    {completedInvoice.discount > 0 && (
                      <tr>
                        <td colSpan={4}>Remise</td>
                        <td style={{ textAlign: "right", color: "green" }}>−{formatFDJ(completedInvoice.discount)}</td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={4}><strong>TOTAL</strong></td>
                      <td style={{ textAlign: "right" }}><strong>{formatFDJ(completedInvoice.total)}</strong></td>
                    </tr>
                    <tr>
                      <td colSpan={4}>Montant versé</td>
                      <td style={{ textAlign: "right", color: "green" }}>{formatFDJ(completedInvoice.paidAmount)}</td>
                    </tr>
                    <tr>
                      <td colSpan={4}>Reste à payer</td>
                      <td style={{ textAlign: "right", color: "red" }}>{formatFDJ((completedInvoice.total || 0) - (completedInvoice.paidAmount || 0))}</td>
                    </tr>
                  </tfoot>
                </table>
                <div className="invoice-signatures">
                  <div className="sig-block"><p>Vendeur</p><div className="sig-line"></div></div>
                  <div className="sig-block"><p>Client</p><div className="sig-line"></div></div>
                </div>
              </div>
            ) : (
              <div className="printable-ticket-80mm">
                <div className="ticket-header">
                  <strong>GRISPELLA GENERAL TRADING</strong><br />
                  <small>Djibouti · +253 21 35 00 00</small><br />
                  <small>N° {completedInvoice.id}</small><br />
                  <small>{new Date(completedInvoice.date).toLocaleString("fr-FR")}</small>
                </div>
                <div className="ticket-divider" />
                {completedInvoice.items.map((item, i) => (
                  <div key={i}>
                    <div style={{ fontSize: "0.78rem" }}>{item.productName}</div>
                    <div className="ticket-line">
                      <span>{item.quantity} × {formatFDJ(item.unitPrice)}</span>
                      <span>{formatFDJ(item.quantity * item.unitPrice)}</span>
                    </div>
                  </div>
                ))}
                <div className="ticket-divider" />
                <div className="ticket-line ticket-total"><span>TOTAL</span><span>{formatFDJ(completedInvoice.total)}</span></div>
                <div className="ticket-line"><span>Payé</span><span style={{ color: "green" }}>{formatFDJ(completedInvoice.paidAmount)}</span></div>
                {((completedInvoice.total || 0) - (completedInvoice.paidAmount || 0)) > 0 && (
                  <div className="ticket-line"><span>Reste</span><span style={{ color: "red" }}>{formatFDJ(completedInvoice.total - completedInvoice.paidAmount)}</span></div>
                )}
                <div className="ticket-footer">Merci de votre confiance !<br />Statut: {completedInvoice.status}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

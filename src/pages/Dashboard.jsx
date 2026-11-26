import React, { useState } from "react";
import { useGrispella } from "../context/GrispellaContext.jsx";
import { Link } from "react-router-dom";
import {
  FiShoppingCart, FiDollarSign, FiTrendingUp, FiTrendingDown,
  FiPackage, FiUsers, FiCreditCard, FiAlertTriangle, FiArrowRight,
  FiBarChart2, FiDatabase, FiActivity, FiArrowDownLeft, FiArrowUpRight,
  FiTruck, FiCheckCircle
} from "react-icons/fi";

const PAYMENT_METHODS_LIST = ["Cash", "Waafi", "CAC", "Saba", "Exim Bank"];
const METHOD_ICONS = { Cash: "💵", Waafi: "📱", CAC: "🏦", Saba: "🏧", "Exim Bank": "🏛️" };

const STATUS_CONFIG = {
  "PAYÉ":    { bg: "#10b981", label: "Payée" },
  "PARTIEL": { bg: "#f59e0b", label: "Partielle" },
  "NON PAYÉ":{ bg: "#ef4444", label: "Non payée" },
  "ANNULÉ":  { bg: "#9ca3af", label: "Annulée" },
};

export default function Dashboard() {
  const { state, formatFDJ } = useGrispella();
  const {
    invoices = [], products = [], expenses = [], creditPayments = [], customers = [],
    cashSessions = [], currentUser, movements = [], receipts = [], deliveries = [], suppliers = []
  } = state || {};

  const role = currentUser?.role || "caisse";
  const isAdmin = role === "admin";
  const isCaisse = role === "caisse";
  const isStock = role === "resp_stock" || role === "agent_stock";

  const [period, setPeriod] = useState("today");

  const dateFilter = (item) => {
    const d = (item.date || item.createdAt || "");
    const now = new Date();
    if (period === "today") return d.startsWith(now.toISOString().split("T")[0]);
    if (period === "week") return d >= new Date(now - 7 * 86400000).toISOString();
    if (period === "month") return d.startsWith(now.toISOString().substring(0, 7));
    return true;
  };

  const filteredInvoices = invoices.filter(dateFilter);
  const filteredCredits = creditPayments.filter(dateFilter);
  const filteredExpenses = expenses.filter(dateFilter);

  const totalSales = filteredInvoices.filter(i => i.status !== "ANNULÉ").reduce((s, i) => s + (i.total || 0), 0);
  const totalPaid = filteredInvoices.filter(i => i.status !== "ANNULÉ").reduce((s, i) => s + (i.paidAmount || 0), 0);
  const totalCredit = filteredInvoices.filter(i => i.status !== "ANNULÉ").reduce((s, i) => s + ((i.total || 0) - (i.paidAmount || 0)), 0);
  const totalCreditCollected = filteredCredits.reduce((s, p) => s + (p.amount || 0), 0);
  const totalExpensesAmt = filteredExpenses.filter(e => e.approvalStatus === "APPROUVÉ").reduce((s, e) => s + (e.amount || 0), 0);
  const totalCustomerDebt = customers.reduce((s, c) => s + (c.debtAmount || c.currentDebt || 0), 0);

  const methodTotals = {};
  PAYMENT_METHODS_LIST.forEach(m => { methodTotals[m] = 0; });
  filteredInvoices.forEach(inv => {
    (inv.payments || []).forEach(p => { if (methodTotals[p.method] !== undefined) methodTotals[p.method] += Number(p.amount) || 0; });
  });
  filteredCredits.forEach(cp => { if (methodTotals[cp.method] !== undefined) methodTotals[cp.method] += Number(cp.amount) || 0; });

  const getTotalStock = (p) => Object.values(p.stockByDepot || p.stocks || {}).reduce((s, d) => s + (typeof d === "object" ? (d.physical || 0) : (d || 0)), 0);
  const stockValue = products.reduce((s, p) => s + getTotalStock(p) * (p.purchasePrice || 0), 0);
  const totalStockUnits = products.reduce((s, p) => s + getTotalStock(p), 0);
  const lowStockProducts = products.filter(p => getTotalStock(p) <= (p.alertThreshold || p.stockAlertThreshold || 10));

  const countPaid = filteredInvoices.filter(i => i.status === "PAYÉ").length;
  const countPartial = filteredInvoices.filter(i => i.status === "PARTIEL").length;
  const countUnpaid = filteredInvoices.filter(i => i.status === "NON PAYÉ").length;
  const countCancelled = filteredInvoices.filter(i => i.status === "ANNULÉ").length;

  const activeSession = cashSessions?.find(s => s.status === "OUVERT" && s.userId === currentUser?.id);
  const netProfit = totalPaid + totalCreditCollected - totalExpensesAmt;

  const KpiCard = ({ icon: Icon, iconBg, value, label, sub, valueColor }) => (
    <div className="kpi-card">
      <div className="kpi-icon" style={{ background: iconBg }}>
        <Icon style={{ color: valueColor || "var(--accent)" }} />
      </div>
      <div className="kpi-value" style={{ color: valueColor || "var(--brand)" }}>{value}</div>
      <div className="kpi-label">{label}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );

  return (
    <div className="grispella-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Tableau de Bord</h1>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2 }}>
            Bonjour, <strong>{currentUser?.name || "Utilisateur"}</strong> — Espace {
              isAdmin ? "Direction Générale" : isCaisse ? "Caisse & Vente" : "Entrepôt & Logistique"
            }
          </p>
        </div>
        <div className="page-header-stats">
          {(isAdmin || isCaisse) && (
            <span className={`status-tag ${activeSession ? "status-green" : "status-red"}`}>
              {activeSession ? "● Caisse ouverte" : "○ Caisse fermée"}
            </span>
          )}
          {isStock && (
            <span className="status-tag status-info">
              🏬 Dépôt actif: {state.currentDepot}
            </span>
          )}
        </div>
        {(isAdmin || isCaisse) && (
          <div style={{ display: "flex", gap: 6, background: "var(--bg2)", padding: "4px", borderRadius: "var(--radius)" }}>
            {[
              { key: "today", label: "Aujourd'hui" },
              { key: "week",  label: "7 jours" },
              { key: "month", label: "Mois" },
              { key: "all",   label: "Tout" },
            ].map(p => (
              <button
                key={p.key}
                className={`btn btn-sm ${period === p.key ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setPeriod(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ───────────────── STOCK ROLES DASHBOARD ───────────────── */}
      {isStock && (
        <>
          <div className="kpi-grid">
            <KpiCard
              icon={FiPackage}
              iconBg="var(--accent-dim)"
              value={products.length}
              valueColor="var(--brand)"
              label="Articles au catalogue"
            />
            <KpiCard
              icon={FiDatabase}
              iconBg="var(--info-dim)"
              value={totalStockUnits.toLocaleString()}
              valueColor="var(--info)"
              label="Unités physiques en stock"
            />
            <KpiCard
              icon={FiAlertTriangle}
              iconBg={lowStockProducts.length > 0 ? "var(--warning-dim)" : "var(--accent-dim)"}
              value={lowStockProducts.length}
              valueColor={lowStockProducts.length > 0 ? "var(--warning)" : "var(--accent)"}
              label="Articles en alerte stock"
              sub={lowStockProducts.length > 0 ? "Réapprovisionnement nécessaire" : "Stocks optimaux"}
            />
            <KpiCard
              icon={FiArrowDownLeft}
              iconBg="var(--accent-dim)"
              value={receipts.length}
              valueColor="var(--brand-light)"
              label="Bons de Réception"
            />
            <KpiCard
              icon={FiArrowUpRight}
              iconBg="var(--purple-dim)"
              value={deliveries.length}
              valueColor="var(--purple)"
              label="Bons de Livraison"
            />
            <KpiCard
              icon={FiActivity}
              iconBg="var(--info-dim)"
              value={movements.length}
              valueColor="var(--info)"
              label="Mouvements enregistrés"
            />
          </div>

          <div className="two-col-layout">
            {/* Stock Alerts */}
            <div className="grispella-card">
              <div className="section-header">
                <h3>Articles en alerte ({lowStockProducts.length})</h3>
                <Link to="/stock" className="btn btn-xs btn-secondary">
                  Gérer les stocks <FiArrowRight size={11} />
                </Link>
              </div>
              <table className="grispella-table">
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>Réf.</th>
                    <th style={{ textAlign: "center" }}>Stock</th>
                    <th style={{ textAlign: "center" }}>Seuil</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.slice(0, 6).map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td><code>{p.ref || p.id}</code></td>
                      <td style={{ textAlign: "center", color: "var(--danger)", fontWeight: 800 }}>
                        {getTotalStock(p)}
                      </td>
                      <td style={{ textAlign: "center", color: "var(--text-muted)" }}>
                        {p.alertThreshold || p.stockAlertThreshold || 10}
                      </td>
                    </tr>
                  ))}
                  {lowStockProducts.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", color: "var(--accent)", padding: 20 }}>
                        <FiCheckCircle size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
                        Tous les stocks sont au-dessus des seuils de réapprovisionnement.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Recent Movements */}
            <div className="grispella-card">
              <div className="section-header">
                <h3>Derniers mouvements d'entrepôt</h3>
                <Link to="/movements" className="btn btn-xs btn-secondary">
                  Journal complet <FiArrowRight size={11} />
                </Link>
              </div>
              <table className="grispella-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Article</th>
                    <th style={{ textAlign: "center" }}>Qté</th>
                    <th>Dépôt</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.slice(0, 6).map((m, idx) => (
                    <tr key={m.id || idx}>
                      <td>
                        <span className={`status-tag ${m.type === "IN" ? "status-green" : "status-red"}`}>
                          {m.type === "IN" ? "↓ ENTRÉE" : "↑ SORTIE"}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, fontSize: "0.8rem" }}>{m.productName}</td>
                      <td style={{ textAlign: "center", fontWeight: 700 }}>{m.quantity}</td>
                      <td style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{m.depotId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ───────────────── CAISSE ROLE DASHBOARD ───────────────── */}
      {isCaisse && (
        <>
          <div className="kpi-grid">
            <KpiCard
              icon={FiBarChart2}
              iconBg="var(--accent-dim)"
              value={formatFDJ(totalSales)}
              valueColor="var(--brand)"
              label="Chiffre d'affaires Ventes"
              sub={`${filteredInvoices.filter(i => i.status !== "ANNULÉ").length} factures`}
            />
            <KpiCard
              icon={FiDollarSign}
              iconBg="var(--accent-dim)"
              value={formatFDJ(totalPaid)}
              valueColor="var(--accent)"
              label="Espèces & Règlements perçus"
            />
            <KpiCard
              icon={FiCreditCard}
              iconBg="var(--info-dim)"
              value={formatFDJ(totalCreditCollected)}
              valueColor="var(--info)"
              label="Crédits encaissés"
            />
            <KpiCard
              icon={FiTrendingDown}
              iconBg="var(--danger-dim)"
              value={formatFDJ(totalCredit)}
              valueColor="var(--danger)"
              label="Ventes à crédit"
            />
          </div>

          <div className="two-col-layout">
            {/* Invoice Status */}
            <div className="grispella-card">
              <div className="section-header">
                <h3>Statuts des factures ({filteredInvoices.length})</h3>
                <Link to="/invoices" className="btn btn-xs btn-secondary">
                  Toutes les factures <FiArrowRight size={11} />
                </Link>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[
                  { label: "Payées",     count: countPaid,      color: "#10b981" },
                  { label: "Partielles", count: countPartial,   color: "#f59e0b" },
                  { label: "Non payées", count: countUnpaid,    color: "#ef4444" },
                  { label: "Annulées",   count: countCancelled, color: "#9ca3af" },
                ].map(({ label, count, color }) => (
                  <div key={label} style={{
                    flex: 1, minWidth: 80, textAlign: "center",
                    padding: "14px 8px", background: color + "14",
                    borderRadius: "var(--radius)", border: `1px solid ${color}33`,
                  }}>
                    <div style={{ fontSize: "1.75rem", fontWeight: 800, color, lineHeight: 1 }}>{count}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 5, fontWeight: 600 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cash & Payment Breakdowns */}
            <div className="grispella-card">
              <div className="section-header">
                <h3>Encaissements par mode de paiement</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {PAYMENT_METHODS_LIST.map(m => {
                  const amount = methodTotals[m] || 0;
                  const maxAmount = Math.max(...Object.values(methodTotals), 1);
                  const pct = (amount / maxAmount) * 100;
                  return (
                    <div key={m} style={{ padding: "7px 0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: "0.84rem" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
                          {METHOD_ICONS[m]} {m}
                        </span>
                        <strong style={{ color: amount > 0 ? "var(--brand)" : "var(--text-faint)" }}>
                          {formatFDJ(amount)}
                        </strong>
                      </div>
                      <div style={{ height: 4, background: "var(--bg2)", borderRadius: 10, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", width: `${pct}%`,
                          background: "linear-gradient(90deg, var(--accent), var(--accent-hover))",
                          borderRadius: 10,
                          transition: "width 0.6s ease",
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ───────────────── ADMIN EXECUTIVE DASHBOARD ───────────────── */}
      {isAdmin && (
        <>
          <div className="kpi-grid">
            <KpiCard
              icon={FiBarChart2}
              iconBg="var(--accent-dim)"
              value={formatFDJ(totalSales)}
              valueColor="var(--brand)"
              label="Chiffre d'affaires"
              sub={`${filteredInvoices.filter(i => i.status !== "ANNULÉ").length} factures`}
            />
            <KpiCard
              icon={FiDollarSign}
              iconBg="var(--accent-dim)"
              value={formatFDJ(totalPaid)}
              valueColor="var(--accent)"
              label="Encaissements"
            />
            <KpiCard
              icon={FiCreditCard}
              iconBg="var(--info-dim)"
              value={formatFDJ(totalCreditCollected)}
              valueColor="var(--info)"
              label="Crédits recouvrés"
            />
            <KpiCard
              icon={FiTrendingDown}
              iconBg="var(--danger-dim)"
              value={formatFDJ(totalCredit)}
              valueColor="var(--danger)"
              label="Nouvelles créances"
            />
            <KpiCard
              icon={FiUsers}
              iconBg="var(--danger-dim)"
              value={formatFDJ(totalCustomerDebt)}
              valueColor="var(--danger)"
              label="Créances clients totales"
              sub={`${customers.filter(c => (c.debtAmount || c.currentDebt || 0) > 0).length} débiteurs`}
            />
            <KpiCard
              icon={FiTrendingDown}
              iconBg="var(--warning-dim)"
              value={formatFDJ(totalExpensesAmt)}
              valueColor="var(--warning)"
              label="Dépenses approuvées"
            />
            <KpiCard
              icon={FiPackage}
              iconBg="var(--accent-dim)"
              value={formatFDJ(stockValue)}
              valueColor="var(--brand)"
              label="Valeur du stock"
              sub={lowStockProducts.length > 0 ? `⚠ ${lowStockProducts.length} alertes` : null}
            />
            <KpiCard
              icon={FiTrendingUp}
              iconBg="var(--purple-dim)"
              value={formatFDJ(netProfit)}
              valueColor={netProfit >= 0 ? "var(--accent)" : "var(--danger)"}
              label="Bénéfice net estimé"
            />
          </div>

          <div className="two-col-layout">
            <div className="grispella-card">
              <div className="section-header">
                <h3>Statuts des factures</h3>
                <Link to="/invoices" className="btn btn-xs btn-secondary">
                  Voir tout <FiArrowRight size={11} />
                </Link>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[
                  { label: "Payées",     count: countPaid,      color: "#10b981" },
                  { label: "Partielles", count: countPartial,   color: "#f59e0b" },
                  { label: "Non payées", count: countUnpaid,    color: "#ef4444" },
                  { label: "Annulées",   count: countCancelled, color: "#9ca3af" },
                ].map(({ label, count, color }) => (
                  <div key={label} style={{
                    flex: 1, minWidth: 80, textAlign: "center",
                    padding: "14px 8px", background: color + "14",
                    borderRadius: "var(--radius)", border: `1px solid ${color}33`,
                  }}>
                    <div style={{ fontSize: "1.75rem", fontWeight: 800, color, lineHeight: 1 }}>{count}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 5, fontWeight: 600 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grispella-card">
              <div className="section-header">
                <h3>Encaissements par mode</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {PAYMENT_METHODS_LIST.map(m => {
                  const amount = methodTotals[m] || 0;
                  const maxAmount = Math.max(...Object.values(methodTotals), 1);
                  const pct = (amount / maxAmount) * 100;
                  return (
                    <div key={m} style={{ padding: "7px 0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: "0.84rem" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
                          {METHOD_ICONS[m]} {m}
                        </span>
                        <strong style={{ color: amount > 0 ? "var(--brand)" : "var(--text-faint)" }}>
                          {formatFDJ(amount)}
                        </strong>
                      </div>
                      <div style={{ height: 4, background: "var(--bg2)", borderRadius: 10, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", width: `${pct}%`,
                          background: "linear-gradient(90deg, var(--accent), var(--accent-hover))",
                          borderRadius: 10,
                          transition: "width 0.6s ease",
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Recent Invoices table for Caisse & Admin */}
      {(isAdmin || isCaisse) && (
        <div className="grispella-card">
          <div className="section-header" style={{ marginBottom: 14 }}>
            <h3>Dernières factures émises</h3>
            <Link to="/invoices" className="btn btn-xs btn-secondary">
              Voir tout <FiArrowRight size={11} />
            </Link>
          </div>
          <table className="grispella-table">
            <thead>
              <tr>
                <th>N° Facture</th>
                <th>Date</th>
                <th>Client</th>
                <th style={{ textAlign: "right" }}>Total</th>
                <th style={{ textAlign: "right" }}>Payé</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.slice(0, 8).map(inv => {
                const customer = customers.find(c => c.id === inv.customerId);
                const cfg = STATUS_CONFIG[inv.status] || { bg: "#ccc", label: inv.status };
                return (
                  <tr key={inv.id}>
                    <td><code style={{ fontSize: "0.78rem" }}>{inv.id}</code></td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                      {new Date(inv.date || inv.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td style={{ fontWeight: 600 }}>{customer?.name || inv.customerName || "—"}</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{formatFDJ(inv.total || inv.totalAmount)}</td>
                    <td style={{ textAlign: "right", color: "var(--accent)", fontWeight: 600 }}>
                      {formatFDJ(inv.paidAmount || inv.amountPaid)}
                    </td>
                    <td>
                      <span className="status-tag" style={{ background: cfg.bg, color: "#fff" }}>
                        {cfg.label || inv.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-state-icon"><FiShoppingCart /></div>
                      <div className="empty-state-text">Aucune facture pour cette période</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { useGrispella } from '../context/GrispellaContext';
import { toast } from 'react-toastify';
import { DEPOTS } from '../constants/grispella';
import {
  FiDatabase, FiSearch, FiFilter, FiPlus, FiX, FiAlertTriangle,
  FiCheckCircle, FiPackage, FiTrendingUp, FiTrendingDown,
} from 'react-icons/fi';

export default function Stock() {
  const { state, dispatch, formatFDJ, adjustStock } = useGrispella();
  const { products = [], currentUser } = state || {};
  const [search, setSearch] = useState('');
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjForm, setAdjForm] = useState({ productId: '', depotId: '', quantity: '', type: 'ADJUSTMENT', reason: '' });
  const [filterLow, setFilterLow] = useState(false);

  const canAdjust = currentUser?.role === 'admin' || currentUser?.role === 'resp_stock' || currentUser?.role === 'stock_resp';
  const canViewFinancials = currentUser?.role === 'admin' || currentUser?.role === 'resp_stock';

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.ref || '').toLowerCase().includes(search.toLowerCase());
    if (filterLow) {
      const totalStock = Object.values(p.stockByDepot || {}).reduce((s, d) => s + (d.physical || 0), 0);
      return matchSearch && totalStock <= (p.stockAlertThreshold || 10);
    }
    return matchSearch;
  });

  const handleAdjust = () => {
    if (!adjForm.productId || !adjForm.depotId || !adjForm.quantity) {
      toast.error('Tous les champs sont requis'); return;
    }
    if (adjustStock) {
      adjustStock({
        productId: adjForm.productId,
        depotId: adjForm.depotId,
        quantity: parseInt(adjForm.quantity),
        type: adjForm.type,
        reason: adjForm.reason,
      });
    } else {
      dispatch({
        type: 'ADJUST_STOCK',
        payload: {
          productId: adjForm.productId,
          depotId: adjForm.depotId,
          quantity: parseInt(adjForm.quantity),
          type: adjForm.type,
          reason: adjForm.reason,
          userId: currentUser?.id,
          date: new Date().toISOString(),
        }
      });
    }
    toast.success('Ajustement enregistré avec succès');
    setShowAdjust(false);
    setAdjForm({ productId: '', depotId: '', quantity: '', type: 'ADJUSTMENT', reason: '' });
  };

  const totalStockValue = products.reduce((sum, p) => {
    const totalQty = Object.values(p.stockByDepot || {}).reduce((s, d) => s + (d.physical || 0), 0);
    return sum + totalQty * (p.purchasePrice || 0);
  }, 0);

  const lowStockCount = products.filter(p => {
    const total = Object.values(p.stockByDepot || {}).reduce((s, d) => s + (d.physical || 0), 0);
    return total <= (p.stockAlertThreshold || 10);
  }).length;

  const totalProducts = products.length;
  const totalUnits = products.reduce((sum, p) => {
    return sum + Object.values(p.stockByDepot || {}).reduce((s, d) => s + (d.physical || 0), 0);
  }, 0);

  return (
    <div className="grispella-page">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 40, height: 40,
            background: "linear-gradient(135deg, var(--info), #2563eb)",
            borderRadius: "var(--radius)", display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: "1.2rem", boxShadow: "0 2px 10px rgba(59,130,246,0.3)"
          }}>
            <FiDatabase />
          </div>
          <div>
            <h1 style={{ marginBottom: 0, fontSize: "1.2rem" }}>Inventaire par Dépôt</h1>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: 0 }}>Suivi des stocks en temps réel</p>
          </div>
        </div>
        <div className="page-header-stats">
          <span className="stat-pill">
            Valeur: <strong style={{ marginLeft: 4 }}>{formatFDJ(totalStockValue)}</strong>
          </span>
          {lowStockCount > 0 && (
            <span className="stat-pill red">
              <FiAlertTriangle size={12} /> {lowStockCount} en alerte
            </span>
          )}
        </div>
        {canAdjust && (
          <button className="btn btn-primary" onClick={() => setShowAdjust(true)}>
            <FiPlus /> Ajustement
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="stock-summary-bar">
        <div className="stock-summary-card">
          <div className="stock-summary-icon" style={{ background: "var(--accent-dim)" }}>
            <FiPackage style={{ color: "var(--accent)" }} />
          </div>
          <div className="stock-summary-data">
            <div className="stock-summary-value">{totalProducts}</div>
            <div className="stock-summary-label">Références</div>
          </div>
        </div>

        <div className="stock-summary-card">
          <div className="stock-summary-icon" style={{ background: "var(--info-dim)" }}>
            <FiDatabase style={{ color: "var(--info)" }} />
          </div>
          <div className="stock-summary-data">
            <div className="stock-summary-value">{totalUnits.toLocaleString()}</div>
            <div className="stock-summary-label">Unités totales</div>
          </div>
        </div>

        <div className="stock-summary-card">
          <div className="stock-summary-icon" style={{ background: "var(--warning-dim)" }}>
            <FiAlertTriangle style={{ color: "var(--warning)" }} />
          </div>
          <div className="stock-summary-data">
            <div className="stock-summary-value" style={{ color: lowStockCount > 0 ? "var(--warning)" : "var(--accent)" }}>
              {lowStockCount}
            </div>
            <div className="stock-summary-label">Alertes stock</div>
          </div>
        </div>

        <div className="stock-summary-card" style={{ flex: 1.5 }}>
          <div className="stock-summary-icon" style={{ background: "var(--accent-dim)" }}>
            <FiTrendingUp style={{ color: "var(--accent)" }} />
          </div>
          <div className="stock-summary-data">
            <div className="stock-summary-value">{formatFDJ(totalStockValue)}</div>
            <div className="stock-summary-label">Valeur totale du stock</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grispella-card" style={{ padding: "12px 16px" }}>
        <div className="filters-row">
          <div className="search-wrapper" style={{ flex: 2 }}>
            <FiSearch className="search-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Rechercher un produit par nom ou référence..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', whiteSpace: 'nowrap', fontSize: "0.84rem", fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={filterLow}
              onChange={e => setFilterLow(e.target.checked)}
              style={{ accentColor: "var(--warning)" }}
            />
            <FiAlertTriangle style={{ color: "var(--warning)" }} />
            Alertes stock uniquement
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="grispella-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="grispella-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Réf.</th>
                {DEPOTS.map(d => (
                  <th key={d.id} colSpan={3} style={{ textAlign: 'center', borderLeft: '2px solid var(--border)' }}>
                    <span className="badge-depot">{d.name}</span>
                  </th>
                ))}
                <th style={{ textAlign: 'center' }}>Total</th>
                <th style={{ textAlign: 'center' }}>Seuil</th>
                <th style={{ textAlign: 'right' }}>Valeur</th>
              </tr>
              <tr>
                <th></th><th></th>
                {DEPOTS.map(d => (
                  <React.Fragment key={d.id}>
                    <th style={{ fontSize: '0.68rem', color: 'var(--text-faint)', borderLeft: '2px solid var(--border)', fontWeight: 600, textAlign: 'center' }}>Physique</th>
                    <th style={{ fontSize: '0.68rem', color: 'var(--text-faint)', fontWeight: 600, textAlign: 'center' }}>Réservé</th>
                    <th style={{ fontSize: '0.68rem', color: 'var(--text-faint)', fontWeight: 600, textAlign: 'center' }}>Dispo.</th>
                  </React.Fragment>
                ))}
                <th></th><th></th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={2 + DEPOTS.length * 3 + 3}>
                    <div className="empty-state">
                      <div className="empty-state-icon"><FiPackage /></div>
                      <div className="empty-state-text">Aucun produit trouvé</div>
                      <div className="empty-state-sub">Modifiez vos critères de recherche</div>
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map(p => {
                const totalPhys = Object.values(p.stockByDepot || {}).reduce((s, d) => s + (d.physical || 0), 0);
                const isLow = totalPhys <= (p.stockAlertThreshold || 10);
                const stockValue = totalPhys * (p.purchasePrice || 0);
                const alertThreshold = p.stockAlertThreshold || 10;
                const fillPct = alertThreshold > 0 ? Math.min(100, (totalPhys / (alertThreshold * 3)) * 100) : 100;

                return (
                  <tr key={p.id} className={isLow ? 'row-alert' : ''}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>{p.name}</div>
                          {p.category && (
                            <span className="badge-pill" style={{ marginTop: 3, fontSize: '0.65rem' }}>{p.category}</span>
                          )}
                        </div>
                        {isLow && (
                          <span style={{ color: 'var(--warning)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 2 }}>
                            <FiAlertTriangle size={12} />
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <code>{p.ref || p.id}</code>
                    </td>
                    {DEPOTS.map(d => {
                      const depotStock = p.stockByDepot?.[d.id] || { physical: 0, reserved: 0 };
                      const available = (depotStock.physical || 0) - (depotStock.reserved || 0);
                      return (
                        <React.Fragment key={d.id}>
                          <td style={{ borderLeft: '2px solid var(--border)', textAlign: 'center', fontWeight: 600 }}>
                            {depotStock.physical || 0}
                          </td>
                          <td style={{ textAlign: 'center', color: 'var(--warning)', fontWeight: 500 }}>
                            {depotStock.reserved || 0}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>
                            <span style={{ color: available > 0 ? 'var(--accent)' : 'var(--danger)' }}>
                              {available}
                            </span>
                          </td>
                        </React.Fragment>
                      );
                    })}
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontWeight: 800, color: isLow ? 'var(--warning)' : 'var(--text)', fontSize: '0.95rem' }}>
                          {totalPhys}
                        </span>
                        <div className="stock-level-bar">
                          <div className="stock-level-fill" style={{
                            width: `${fillPct}%`,
                            background: isLow
                              ? 'var(--warning)'
                              : fillPct > 60
                                ? 'var(--accent)'
                                : 'var(--info)'
                          }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>{alertThreshold}</span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--brand)' }}>
                      {formatFDJ(stockValue)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={2 + DEPOTS.length * 3}><strong>TOTAL INVENTAIRE</strong></td>
                  <td style={{ textAlign: 'center' }}>
                    <strong>{filtered.reduce((s, p) => s + Object.values(p.stockByDepot || {}).reduce((a, d) => a + (d.physical || 0), 0), 0)}</strong>
                  </td>
                  <td></td>
                  <td style={{ textAlign: 'right' }}>
                    <strong style={{ color: 'var(--brand)' }}>
                      {formatFDJ(filtered.reduce((s, p) => {
                        const qty = Object.values(p.stockByDepot || {}).reduce((a, d) => a + (d.physical || 0), 0);
                        return s + qty * (p.purchasePrice || 0);
                      }, 0))}
                    </strong>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Adjust Modal */}
      {showAdjust && (
        <div className="detail-modal-overlay" onClick={() => setShowAdjust(false)}>
          <div className="detail-modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="detail-modal-header">
              <h2>⚖️ Ajustement de stock</h2>
              <button className="btn btn-sm btn-ghost" onClick={() => setShowAdjust(false)}>
                <FiX />
              </button>
            </div>

            <div style={{ display: 'grid', gap: 14 }}>
              <div className="form-group">
                <label>Produit *</label>
                <select className="form-select" value={adjForm.productId} onChange={e => setAdjForm(f => ({ ...f, productId: e.target.value }))}>
                  <option value="">— Sélectionner un produit —</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Dépôt *</label>
                <select className="form-select" value={adjForm.depotId} onChange={e => setAdjForm(f => ({ ...f, depotId: e.target.value }))}>
                  <option value="">— Sélectionner un dépôt —</option>
                  {DEPOTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Quantité <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(+ entrée / − sortie)</span></label>
                <input
                  type="number"
                  className="form-input"
                  value={adjForm.quantity}
                  onChange={e => setAdjForm(f => ({ ...f, quantity: e.target.value }))}
                  placeholder="ex: +50 ou -10"
                />
              </div>

              <div className="form-group">
                <label>Type d'ajustement</label>
                <select className="form-select" value={adjForm.type} onChange={e => setAdjForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="ADJUSTMENT">Ajustement inventaire</option>
                  <option value="RETURN">Retour client</option>
                </select>
              </div>

              <div className="form-group">
                <label>Motif / Remarque</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Raison de l'ajustement..."
                  value={adjForm.reason}
                  onChange={e => setAdjForm(f => ({ ...f, reason: e.target.value }))}
                />
              </div>
            </div>

            <div className="detail-actions">
              <button className="btn btn-secondary" onClick={() => setShowAdjust(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleAdjust}>
                <FiCheckCircle /> Confirmer l'ajustement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

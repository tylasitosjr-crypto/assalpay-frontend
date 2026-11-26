import React, { useState } from 'react';
import { useGrispella } from '../context/GrispellaContext';
import { toast } from 'react-toastify';
import {
  FiPackage, FiSearch, FiPlus, FiEdit2, FiX, FiCheckCircle,
  FiAlertTriangle, FiBarChart2, FiTag, FiTrash2,
} from 'react-icons/fi';

const CATEGORIES = ['Alimentaire', 'Boissons', 'Hygiène', 'Ménage', 'Textile', 'Autre'];
const UNITS_BASE = ['pièce', 'kg', 'litre', 'carton', 'sac', 'paquet', 'boite'];

export default function Products() {
  const { state, dispatch, formatFDJ } = useGrispella();
  const { products = [], currentUser } = state || {};

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', ref: '', category: 'Alimentaire', barcode: '',
    purchasePrice: '', stockAlertThreshold: 10,
    saleUnits: [{ unit: 'carton', factor: 1, priceGross: '' }],
  });

  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'resp_stock' || currentUser?.role === 'stock_resp';
  const canViewCosts = currentUser?.role === 'admin';

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.ref || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode || '').includes(search);
    const matchCat = !filterCat || p.category === filterCat;
    return matchSearch && matchCat;
  });

  const resetForm = () => setForm({
    name: '', ref: '', category: 'Alimentaire', barcode: '',
    purchasePrice: '', stockAlertThreshold: 10,
    saleUnits: [{ unit: 'carton', factor: 1, priceGross: '' }],
  });

  const openAdd = () => { resetForm(); setEditing(null); setShowForm(true); };

  const openEdit = (p) => {
    setForm({
      name: p.name, ref: p.ref || '', category: p.category || 'Alimentaire',
      barcode: p.barcode || '', purchasePrice: p.purchasePrice || '',
      stockAlertThreshold: p.stockAlertThreshold || 10,
      saleUnits: p.saleUnits || [{ unit: 'carton', factor: 1, priceGross: '' }],
    });
    setEditing(p);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Le nom du produit est requis'); return; }
    if (!form.saleUnits.length) { toast.error('Au moins une unité de vente est requise'); return; }
    const payload = {
      ...form,
      purchasePrice: parseFloat(form.purchasePrice) || 0,
      stockAlertThreshold: parseInt(form.stockAlertThreshold) || 10,
      saleUnits: form.saleUnits.map(u => ({
        ...u,
        factor: parseFloat(u.factor) || 1,
        priceGross: parseFloat(u.priceGross) || 0,
      })),
    };
    if (editing) {
      dispatch({ type: 'UPDATE_PRODUCT', payload: { id: editing.id, ...payload } });
      toast.success('Produit modifié avec succès');
    } else {
      dispatch({ type: 'ADD_PRODUCT', payload: { id: `PRD-${Date.now()}`, ...payload, stockByDepot: {} } });
      toast.success('Produit ajouté avec succès');
    }
    setShowForm(false);
    resetForm();
  };

  const addUnit = () => setForm(f => ({ ...f, saleUnits: [...f.saleUnits, { unit: 'pièce', factor: 1, priceGross: '' }] }));
  const removeUnit = (i) => setForm(f => ({ ...f, saleUnits: f.saleUnits.filter((_, idx) => idx !== i) }));
  const updateUnit = (i, key, val) => setForm(f => ({
    ...f,
    saleUnits: f.saleUnits.map((u, idx) => idx === i ? { ...u, [key]: val } : u),
  }));

  const totalStockValue = products.reduce((sum, p) => {
    const totalStock = Object.values(p.stockByDepot || {}).reduce((s, d) => s + (d.physical || 0), 0);
    return sum + totalStock * (p.purchasePrice || 0);
  }, 0);

  const lowCount = products.filter(p => {
    const t = Object.values(p.stockByDepot || {}).reduce((s, d) => s + (d.physical || 0), 0);
    return t <= (p.stockAlertThreshold || 10);
  }).length;

  const CAT_COLORS = {
    Alimentaire: '#10b981', Boissons: '#3b82f6', Hygiène: '#8b5cf6',
    Ménage: '#f59e0b', Textile: '#ec4899', Autre: '#6b7280',
  };

  return (
    <div className="grispella-page">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 40, height: 40,
            background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
            borderRadius: "var(--radius)", display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: "1.2rem", boxShadow: "0 2px 10px rgba(139,92,246,0.3)"
          }}>
            <FiPackage />
          </div>
          <div>
            <h1 style={{ marginBottom: 0, fontSize: "1.2rem" }}>Articles & Prix</h1>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: 0 }}>Catalogue produits & unités de vente</p>
          </div>
        </div>
        <div className="page-header-stats">
          <span className="stat-pill">
            <FiPackage size={12} /> {products.length} produits
          </span>
          <span className="stat-pill">
            Valeur stock: <strong style={{ marginLeft: 4 }}>{formatFDJ(totalStockValue)}</strong>
          </span>
          {lowCount > 0 && (
            <span className="stat-pill red">
              <FiAlertTriangle size={12} /> {lowCount} en alerte
            </span>
          )}
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={openAdd}>
            <FiPlus /> Nouveau produit
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="grispella-card" style={{ padding: "12px 16px" }}>
        <div className="filters-row">
          <div className="search-wrapper" style={{ flex: 2 }}>
            <FiSearch className="search-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Rechercher par nom, référence ou code-barres..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-select"
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            style={{ width: "auto", minWidth: 160 }}
          >
            <option value="">Toutes les catégories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          <button
            className={`btn btn-xs ${!filterCat ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterCat('')}
          >
            Tous ({products.length})
          </button>
          {CATEGORIES.map(cat => {
            const count = products.filter(p => p.category === cat).length;
            if (count === 0) return null;
            return (
              <button
                key={cat}
                className={`btn btn-xs ${filterCat === cat ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterCat(filterCat === cat ? '' : cat)}
                style={filterCat === cat ? {} : { borderColor: CAT_COLORS[cat] + '44', color: CAT_COLORS[cat] }}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="grispella-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="grispella-table">
            <thead>
              <tr>
                <th>Réf.</th>
                <th>Produit</th>
                <th>Catégorie</th>
                {canViewCosts && <th style={{ textAlign: 'right' }}>Prix d'achat</th>}
                <th>Unités de vente</th>
                <th style={{ textAlign: 'center' }}>Stock total</th>
                <th style={{ textAlign: 'center' }}>Seuil</th>
                {canEdit && <th style={{ textAlign: 'center' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={canEdit ? 8 : 7}>
                    <div className="empty-state">
                      <div className="empty-state-icon"><FiPackage /></div>
                      <div className="empty-state-text">Aucun produit trouvé</div>
                      <div className="empty-state-sub">
                        {search || filterCat ? 'Essayez d\'autres critères' : 'Ajoutez votre premier produit'}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map(p => {
                const totalStock = Object.values(p.stockByDepot || {}).reduce((s, d) => s + (d.physical || 0), 0);
                const isLow = totalStock <= (p.stockAlertThreshold || 10);
                const catColor = CAT_COLORS[p.category] || '#6b7280';

                return (
                  <tr key={p.id} className={isLow ? 'row-alert' : ''}>
                    <td><code>{p.ref || p.id}</code></td>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text)' }}>{p.name}</div>
                      {p.barcode && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginTop: 2 }}>
                          🔖 {p.barcode}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge-pill" style={{
                        background: catColor + '18',
                        color: catColor,
                        borderColor: catColor + '33'
                      }}>
                        {p.category || '—'}
                      </span>
                    </td>
                    {canViewCosts && (
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        {formatFDJ(p.purchasePrice || 0)}
                      </td>
                    )}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {(p.saleUnits || []).map((u, i) => (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            fontSize: '0.78rem', background: 'var(--bg2)',
                            padding: '3px 7px', borderRadius: 4
                          }}>
                            <span style={{ color: 'var(--text-muted)' }}>{u.unit}</span>
                            <span style={{ color: 'var(--text-faint)' }}>×{u.factor}</span>
                            <span style={{ marginLeft: 2, fontWeight: 700, color: 'var(--brand-light)' }}>
                              {formatFDJ(u.priceGross)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <span style={{
                          fontWeight: 800, fontSize: '1rem',
                          color: isLow ? 'var(--warning)' : 'var(--accent)'
                        }}>
                          {totalStock}
                        </span>
                        {isLow && (
                          <span style={{ fontSize: '0.68rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 2 }}>
                            <FiAlertTriangle size={10} /> Alerte
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 500 }}>
                      {p.stockAlertThreshold || 10}
                    </td>
                    {canEdit && (
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn btn-xs btn-outline"
                          onClick={() => openEdit(p)}
                          title="Modifier"
                        >
                          <FiEdit2 size={12} /> Modifier
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={3}><strong>{filtered.length} produit(s) affichés</strong></td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--brand)' }}>
                    {formatFDJ(filtered.reduce((s, p) => s + (p.purchasePrice || 0), 0))}
                  </td>
                  <td colSpan={canEdit ? 4 : 3}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="detail-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="detail-modal" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
            <div className="detail-modal-header">
              <h2>{editing ? '✏️ Modifier le produit' : '➕ Nouveau produit'}</h2>
              <button className="btn btn-sm btn-ghost" onClick={() => setShowForm(false)}>
                <FiX />
              </button>
            </div>

            {/* Basic info grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Nom du produit *</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Nom du produit..."
                />
              </div>
              {[
                { label: 'Référence', key: 'ref', placeholder: 'REF-001' },
                { label: 'Code-barres', key: 'barcode', placeholder: '1234567890123' },
              ].map(f => (
                <div key={f.key} className="form-group">
                  <label>{f.label}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                  />
                </div>
              ))}
              <div className="form-group">
                <label>Catégorie</label>
                <select
                  className="form-select"
                  value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                >
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Prix d'achat (FDJ)</label>
                <input
                  type="number"
                  className="form-input"
                  value={form.purchasePrice}
                  onChange={e => setForm(p => ({ ...p, purchasePrice: e.target.value }))}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Seuil d'alerte stock</label>
                <input
                  type="number"
                  className="form-input"
                  value={form.stockAlertThreshold}
                  onChange={e => setForm(p => ({ ...p, stockAlertThreshold: e.target.value }))}
                  placeholder="10"
                  min="0"
                />
              </div>
            </div>

            {/* Sale units */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h4 style={{ margin: 0, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', fontWeight: 700 }}>
                  Unités de vente
                </h4>
                <button className="btn btn-xs btn-outline" onClick={addUnit}>
                  <FiPlus /> Ajouter unité
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {form.saleUnits.map((u, i) => (
                  <div key={i} style={{
                    display: 'grid', gridTemplateColumns: '2fr 1fr 2fr auto',
                    gap: 8, background: 'var(--bg2)', padding: '10px 12px',
                    borderRadius: 'var(--radius)', border: '1px solid var(--border2)'
                  }}>
                    <div className="form-group" style={{ gap: 2 }}>
                      {i === 0 && <label style={{ fontSize: '0.65rem' }}>Unité</label>}
                      <select className="form-select" value={u.unit} onChange={e => updateUnit(i, 'unit', e.target.value)}>
                        {UNITS_BASE.map(b => <option key={b}>{b}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ gap: 2 }}>
                      {i === 0 && <label style={{ fontSize: '0.65rem' }}>Facteur</label>}
                      <input
                        type="number"
                        className="form-input"
                        placeholder="1"
                        value={u.factor}
                        onChange={e => updateUnit(i, 'factor', e.target.value)}
                        min="1"
                      />
                    </div>
                    <div className="form-group" style={{ gap: 2 }}>
                      {i === 0 && <label style={{ fontSize: '0.65rem' }}>Prix vente (FDJ)</label>}
                      <input
                        type="number"
                        className="form-input"
                        placeholder="Prix de vente"
                        value={u.priceGross}
                        onChange={e => updateUnit(i, 'priceGross', e.target.value)}
                        min="0"
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: i === 0 ? 'flex-end' : 'center', paddingBottom: i === 0 ? 1 : 0 }}>
                      <button
                        className="btn btn-xs btn-danger"
                        onClick={() => removeUnit(i)}
                        disabled={form.saleUnits.length === 1}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="detail-actions">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSave}>
                <FiCheckCircle /> {editing ? 'Enregistrer les modifications' : 'Créer le produit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

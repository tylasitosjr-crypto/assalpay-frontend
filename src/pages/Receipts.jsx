import React, { useState } from 'react';
import { useGrispella } from '../context/GrispellaContext';
import { toast } from 'react-toastify';
import { DEPOTS } from '../constants/grispella';

const STATUS_STEPS = ['BROUILLON', 'CONTRÔLE', 'VALIDÉ'];
const STATUS_COLORS = { BROUILLON: '#f39c12', 'CONTRÔLE': '#3498db', 'VALIDÉ': '#27ae60' };

export default function Receipts() {
  const { state, dispatch, validateReceipt, formatFDJ } = useGrispella();
  const { receipts = [], suppliers, products, currentUser } = state;

  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    supplierId: '',
    depotId: DEPOTS[0]?.id || '',
    invoiceRef: '',
    items: [{ productId: '', quantity: '', costPrice: '', unit: 'carton', lot: '', expiryDate: '' }],
  });

  const resetForm = () => setForm({
    supplierId: '', depotId: DEPOTS[0]?.id || '', invoiceRef: '',
    items: [{ productId: '', quantity: '', costPrice: '', unit: 'carton', lot: '', expiryDate: '' }],
  });

  const addItem = () => setForm(f => ({
    ...f, items: [...f.items, { productId: '', quantity: '', costPrice: '', unit: 'carton', lot: '', expiryDate: '' }]
  }));
  const removeItem = i => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, key, val) => setForm(f => ({
    ...f, items: f.items.map((item, idx) => idx === i ? { ...item, [key]: val } : item)
  }));

  const handleCreate = () => {
    if (!form.supplierId || !form.depotId) { toast.error('Fournisseur et dépôt requis'); return; }
    if (form.items.some(it => !it.productId || !it.quantity)) { toast.error('Remplissez tous les articles'); return; }
    dispatch({
      type: 'ADD_RECEIPT',
      payload: {
        id: `BR-${Date.now()}`,
        supplierId: form.supplierId,
        depotId: form.depotId,
        invoiceRef: form.invoiceRef,
        items: form.items.map(it => ({
          ...it,
          quantity: parseInt(it.quantity) || 0,
          costPrice: parseFloat(it.costPrice) || 0,
          productName: products.find(p => p.id === it.productId)?.name || it.productId,
        })),
        status: 'BROUILLON',
        createdAt: new Date().toISOString(),
        createdBy: currentUser.id,
        totalCost: form.items.reduce((s, it) => s + (parseInt(it.quantity) || 0) * (parseFloat(it.costPrice) || 0), 0),
      }
    });
    toast.success('Bon de réception créé');
    setShowForm(false);
    resetForm();
  };

  const handleAdvanceStatus = (receipt) => {
    const currentIdx = STATUS_STEPS.indexOf(receipt.status);
    if (currentIdx === STATUS_STEPS.length - 1) return;
    const nextStatus = STATUS_STEPS[currentIdx + 1];
    if (nextStatus === 'VALIDÉ') {
      if (currentUser.role === 'agent_stock') {
        toast.warning("Validation finale réservée au Responsable Stock ou Administrateur");
        return;
      }
      if (!window.confirm('Valider ce bon de réception ? Le stock sera mis à jour automatiquement.')) return;
      validateReceipt(receipt.id);
      toast.success('Réception validée — stock mis à jour');
    } else {
      dispatch({ type: 'UPDATE_RECEIPT_STATUS', payload: { receiptId: receipt.id, status: nextStatus, userId: currentUser.id } });
      toast.success(`Statut mis à jour: ${nextStatus}`);
    }
  };

  const sortedReceipts = [...receipts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="grispella-page">
      <div className="page-header">
        <h1>📥 Bons de réception</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>+ Nouveau bon</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 16 }}>
        <div className="grispella-card" style={{ padding: 0 }}>
          <table className="grispella-table">
            <thead>
              <tr>
                <th>N° BR</th>
                <th>Date</th>
                <th>Fournisseur</th>
                <th>Dépôt</th>
                <th>Articles</th>
                <th>Coût total</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedReceipts.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#888' }}>Aucun bon de réception</td></tr>
              )}
              {sortedReceipts.map(r => {
                const supplier = suppliers?.find(s => s.id === r.supplierId);
                const currentIdx = STATUS_STEPS.indexOf(r.status);
                const nextStatus = STATUS_STEPS[currentIdx + 1];
                return (
                  <tr key={r.id} className={selected?.id === r.id ? 'row-selected' : ''} onClick={() => setSelected(r)}>
                    <td><code style={{ fontSize: '0.8rem' }}>{r.id}</code></td>
                    <td>{new Date(r.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td>{supplier?.name || r.supplierId}</td>
                    <td><span className="badge-depot">{r.depotId}</span></td>
                    <td>{r.items?.length || 0}</td>
                    <td>{formatFDJ(r.totalCost || 0)}</td>
                    <td>
                      <span className="status-tag" style={{ background: STATUS_COLORS[r.status] || '#ccc', color: '#fff' }}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      {r.status !== 'VALIDÉ' && (currentUser.role === 'admin' || currentUser.role === 'stock_resp') && (
                        <button className="btn btn-sm btn-primary" onClick={e => { e.stopPropagation(); handleAdvanceStatus(r); }}>
                          → {nextStatus}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="grispella-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0 }}>{selected.id}</h3>
                <p style={{ color: '#666', margin: '4px 0' }}>
                  {suppliers?.find(s => s.id === selected.supplierId)?.name} · {selected.depotId}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="status-tag" style={{ background: STATUS_COLORS[selected.status], color: '#fff' }}>
                  {selected.status}
                </span>
                <button className="btn btn-secondary" onClick={() => setSelected(null)}>✕</button>
              </div>
            </div>
            {/* Workflow progress */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
              {STATUS_STEPS.map((s, i) => (
                <div key={s} style={{
                  flex: 1, textAlign: 'center', padding: '4px',
                  background: STATUS_STEPS.indexOf(selected.status) >= i ? STATUS_COLORS[s] : '#eee',
                  color: STATUS_STEPS.indexOf(selected.status) >= i ? '#fff' : '#aaa',
                  borderRadius: 4, fontSize: '0.75rem', fontWeight: 600,
                }}>{s}</div>
              ))}
            </div>
            <table className="grispella-table">
              <thead>
                <tr><th>Produit</th><th>Qté</th><th>Unité</th><th>Coût/u</th><th>Lot</th><th>DLC</th></tr>
              </thead>
              <tbody>
                {(selected.items || []).map((it, i) => (
                  <tr key={i}>
                    <td>{it.productName}</td>
                    <td>{it.quantity}</td>
                    <td>{it.unit}</td>
                    <td>{formatFDJ(it.costPrice || 0)}</td>
                    <td>{it.lot || '—'}</td>
                    <td>{it.expiryDate ? new Date(it.expiryDate).toLocaleDateString('fr-FR') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="detail-totals" style={{ marginTop: 12 }}>
              <div className="total-row total-final"><span>Coût total</span><span>{formatFDJ(selected.totalCost || 0)}</span></div>
            </div>
            {selected.status !== 'VALIDÉ' && (currentUser.role === 'admin' || currentUser.role === 'stock_resp') && (
              <button className="btn btn-primary" style={{ marginTop: 12, width: '100%' }} onClick={() => handleAdvanceStatus(selected)}>
                → Passer à {STATUS_STEPS[STATUS_STEPS.indexOf(selected.status) + 1]}
              </button>
            )}
          </div>
        )}
      </div>

      {/* New Receipt Form */}
      {showForm && (
        <div className="detail-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="detail-modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="detail-modal-header">
              <h2>+ Nouveau bon de réception</h2>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Fournisseur *</label>
                <select className="form-select" value={form.supplierId} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}>
                  <option value="">— Sélectionner —</option>
                  {(suppliers || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Dépôt *</label>
                <select className="form-select" value={form.depotId} onChange={e => setForm(f => ({ ...f, depotId: e.target.value }))}>
                  {DEPOTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Réf. facture fournisseur</label>
                <input type="text" className="form-input" value={form.invoiceRef}
                  onChange={e => setForm(f => ({ ...f, invoiceRef: e.target.value }))} />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h4 style={{ margin: 0 }}>Articles</h4>
                <button className="btn btn-sm btn-outline" onClick={addItem}>+ Article</button>
              </div>
              {form.items.map((it, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto', gap: 6, marginBottom: 8 }}>
                  <select className="form-select" value={it.productId} onChange={e => updateItem(i, 'productId', e.target.value)}>
                    <option value="">— Produit —</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input type="number" className="form-input" placeholder="Qté" value={it.quantity}
                    onChange={e => updateItem(i, 'quantity', e.target.value)} />
                  <input type="text" className="form-input" placeholder="Unité" value={it.unit}
                    onChange={e => updateItem(i, 'unit', e.target.value)} />
                  <input type="number" className="form-input" placeholder="Coût/u" value={it.costPrice}
                    onChange={e => updateItem(i, 'costPrice', e.target.value)} />
                  <input type="text" className="form-input" placeholder="Lot" value={it.lot}
                    onChange={e => updateItem(i, 'lot', e.target.value)} />
                  <input type="date" className="form-input" value={it.expiryDate}
                    onChange={e => updateItem(i, 'expiryDate', e.target.value)} />
                  <button className="btn btn-sm btn-danger" onClick={() => removeItem(i)}>✕</button>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'right', marginTop: 8, fontWeight: 600 }}>
              Coût total: {formatFDJ(form.items.reduce((s, it) => s + (parseInt(it.quantity) || 0) * (parseFloat(it.costPrice) || 0), 0))}
            </div>
            <div className="detail-actions">
              <button className="btn btn-primary" onClick={handleCreate}>✅ Créer le bon</button>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

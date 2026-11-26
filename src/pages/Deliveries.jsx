import React, { useState } from 'react';
import { useGrispella } from '../context/GrispellaContext';
import { toast } from 'react-toastify';

const STATUS_STEPS = ['À_PRÉPARER', 'PRÉPARÉ', 'EN_ATTENTE', 'VALIDÉ', 'LIVRÉ'];
const STATUS_COLORS = {
  'À_PRÉPARER': '#e67e22', 'PRÉPARÉ': '#f39c12', 'EN_ATTENTE': '#3498db',
  'VALIDÉ': '#8e44ad', 'LIVRÉ': '#27ae60', 'ANNULÉ': '#95a5a6',
};

export default function Deliveries() {
  const { state, dispatch, formatFDJ } = useGrispella();
  const { deliveries = [], invoices, customers, currentUser } = state;

  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ invoiceId: '', driver: '', note: '' });
  const [filterStatus, setFilterStatus] = useState('');

  const filtered = deliveries
    .filter(d => !filterStatus || d.status === filterStatus)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const handleCreate = () => {
    if (!form.invoiceId) { toast.error('Facture requise'); return; }
    const invoice = invoices.find(i => i.id === form.invoiceId);
    if (!invoice) { toast.error('Facture introuvable'); return; }
    dispatch({
      type: 'ADD_DELIVERY',
      payload: {
        id: `BL-${Date.now()}`,
        invoiceId: form.invoiceId,
        customerId: invoice.customerId,
        depotId: invoice.depotId,
        items: invoice.items,
        driver: form.driver,
        note: form.note,
        status: 'À_PRÉPARER',
        createdAt: new Date().toISOString(),
        createdBy: currentUser.id,
      }
    });
    toast.success('Bon de livraison créé');
    setShowForm(false);
    setForm({ invoiceId: '', driver: '', note: '' });
  };

  const handleAdvance = (delivery) => {
    const currentIdx = STATUS_STEPS.indexOf(delivery.status);
    if (currentIdx === STATUS_STEPS.length - 1 || delivery.status === 'ANNULÉ') return;
    const nextStatus = STATUS_STEPS[currentIdx + 1];
    dispatch({ type: 'UPDATE_DELIVERY_STATUS', payload: { deliveryId: delivery.id, status: nextStatus, userId: currentUser.id } });
    toast.success(`Statut → ${nextStatus}`);
    if (selected?.id === delivery.id) setSelected({ ...delivery, status: nextStatus });
  };

  const handleCancel = (delivery) => {
    if (!window.confirm('Annuler ce bon de livraison ?')) return;
    dispatch({ type: 'UPDATE_DELIVERY_STATUS', payload: { deliveryId: delivery.id, status: 'ANNULÉ', userId: currentUser.id } });
    toast.success('Bon de livraison annulé');
    if (selected?.id === delivery.id) setSelected({ ...delivery, status: 'ANNULÉ' });
  };

  const pendingInvoices = invoices.filter(i =>
    i.status !== 'ANNULÉ' &&
    !deliveries.some(d => d.invoiceId === i.id && d.status !== 'ANNULÉ')
  );

  return (
    <div className="grispella-page">
      <div className="page-header">
        <h1>🚚 Bons de livraison</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Nouveau BL</button>
      </div>

      <div className="grispella-card filters-row">
        <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Tous les statuts</option>
          {[...STATUS_STEPS, 'ANNULÉ'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <div className="stat-pill">{filtered.length} bon(s)</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 16 }}>
        <div className="grispella-card" style={{ padding: 0 }}>
          <table className="grispella-table">
            <thead>
              <tr>
                <th>N° BL</th>
                <th>Date</th>
                <th>Facture</th>
                <th>Client</th>
                <th>Livreur</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#888' }}>Aucun bon de livraison</td></tr>
              )}
              {filtered.map(d => {
                const customer = customers.find(c => c.id === d.customerId);
                const currentIdx = STATUS_STEPS.indexOf(d.status);
                const nextStatus = STATUS_STEPS[currentIdx + 1];
                return (
                  <tr key={d.id} className={selected?.id === d.id ? 'row-selected' : ''} onClick={() => setSelected(d)}>
                    <td><code style={{ fontSize: '0.8rem' }}>{d.id}</code></td>
                    <td>{new Date(d.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td><code style={{ fontSize: '0.75rem' }}>{d.invoiceId}</code></td>
                    <td>{customer?.name || '—'}</td>
                    <td>{d.driver || '—'}</td>
                    <td>
                      <span className="status-tag" style={{ background: STATUS_COLORS[d.status] || '#ccc', color: '#fff' }}>
                        {d.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        {d.status !== 'LIVRÉ' && d.status !== 'ANNULÉ' && nextStatus && (
                          <button className="btn btn-sm btn-primary" onClick={e => { e.stopPropagation(); handleAdvance(d); }}>
                            → {nextStatus.replace('_', ' ')}
                          </button>
                        )}
                        {d.status !== 'ANNULÉ' && d.status !== 'LIVRÉ' && (
                          <button className="btn btn-sm btn-danger" onClick={e => { e.stopPropagation(); handleCancel(d); }}>✕</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className="grispella-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0 }}>{selected.id}</h3>
                <p style={{ color: '#666', margin: '4px 0' }}>
                  Livreur: {selected.driver || '—'} · Dépôt: {selected.depotId}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="status-tag" style={{ background: STATUS_COLORS[selected.status], color: '#fff' }}>
                  {selected.status?.replace('_', ' ')}
                </span>
                <button className="btn btn-secondary" onClick={() => setSelected(null)}>✕</button>
              </div>
            </div>
            {/* Progress bar */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
              {STATUS_STEPS.map((s, i) => (
                <div key={s} style={{
                  flex: 1, textAlign: 'center', padding: '4px 2px',
                  background: STATUS_STEPS.indexOf(selected.status) >= i ? STATUS_COLORS[s] : '#eee',
                  color: STATUS_STEPS.indexOf(selected.status) >= i ? '#fff' : '#aaa',
                  borderRadius: 4, fontSize: '0.65rem', fontWeight: 600,
                }}>{s.replace('_', ' ')}</div>
              ))}
            </div>
            <table className="grispella-table">
              <thead><tr><th>Produit</th><th>Qté</th><th>Unité</th></tr></thead>
              <tbody>
                {(selected.items || []).map((it, i) => (
                  <tr key={i}>
                    <td>{it.productName}</td>
                    <td>{it.quantity}</td>
                    <td>{it.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="detail-actions" style={{ marginTop: 12 }}>
              <button className="btn btn-outline" onClick={() => window.print()}>🖨️ Imprimer BL</button>
            </div>
          </div>
        )}
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="detail-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="detail-modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="detail-modal-header">
              <h2>+ Nouveau bon de livraison</h2>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="form-group">
              <label>Facture *</label>
              <select className="form-select" value={form.invoiceId} onChange={e => setForm(f => ({ ...f, invoiceId: e.target.value }))}>
                <option value="">— Sélectionner une facture —</option>
                {pendingInvoices.map(i => {
                  const c = customers.find(c => c.id === i.customerId);
                  return <option key={i.id} value={i.id}>{i.id} — {c?.name}</option>;
                })}
              </select>
            </div>
            <div className="form-group">
              <label>Livreur</label>
              <input type="text" className="form-input" placeholder="Nom du livreur"
                value={form.driver} onChange={e => setForm(f => ({ ...f, driver: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Note</label>
              <input type="text" className="form-input" placeholder="Instruction de livraison..."
                value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
            </div>
            <div className="detail-actions">
              <button className="btn btn-primary" onClick={handleCreate}>✅ Créer</button>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

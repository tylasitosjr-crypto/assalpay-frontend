import React, { useState } from 'react';
import { useGrispella } from '../context/GrispellaContext';
import { toast } from 'react-toastify';

const CATEGORIES = ['Loyer', 'Transport', 'Carburant', 'Fournitures', 'Salaires', 'Maintenance', 'Autre'];
const PAYMENT_METHODS = ['Cash', 'Waafi', 'CAC', 'Saba', 'Exim Bank'];
const APPROVAL_STATUS = ['EN_ATTENTE', 'APPROUVÉ', 'REJETÉ'];
const APPROVAL_COLORS = { 'EN_ATTENTE': '#f39c12', 'APPROUVÉ': '#27ae60', 'REJETÉ': '#e74c3c' };

export default function Expenses() {
  const { state, dispatch, formatFDJ } = useGrispella();
  const { expenses = [], currentUser } = state;

  const [showForm, setShowForm] = useState(false);
  const [filterCat, setFilterCat] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [form, setForm] = useState({
    category: 'Autre', beneficiary: '', amount: '', paymentMethod: 'Cash', description: '', date: new Date().toISOString().split('T')[0],
  });

  const filtered = expenses
    .filter(e => {
      const matchCat = !filterCat || e.category === filterCat;
      const matchStatus = !filterStatus || e.approvalStatus === filterStatus;
      const matchDate = !filterDate || (e.date || '').startsWith(filterDate);
      return matchCat && matchStatus && matchDate;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalAmount = filtered.reduce((s, e) => s + (e.amount || 0), 0);
  const totalApproved = filtered.filter(e => e.approvalStatus === 'APPROUVÉ').reduce((s, e) => s + (e.amount || 0), 0);

  const handleAdd = () => {
    if (!form.beneficiary.trim() || !form.amount) { toast.error('Bénéficiaire et montant requis'); return; }
    dispatch({
      type: 'ADD_EXPENSE',
      payload: {
        id: `EXP-${Date.now()}`,
        ...form,
        amount: parseFloat(form.amount) || 0,
        approvalStatus: currentUser.role === 'admin' ? 'APPROUVÉ' : 'EN_ATTENTE',
        createdBy: currentUser.id,
        createdAt: new Date().toISOString(),
        sessionId: null,
      }
    });
    toast.success('Dépense enregistrée');
    setShowForm(false);
    setForm({ category: 'Autre', beneficiary: '', amount: '', paymentMethod: 'Cash', description: '', date: new Date().toISOString().split('T')[0] });
  };

  const handleApproval = (expId, status) => {
    dispatch({ type: 'UPDATE_EXPENSE_STATUS', payload: { expenseId: expId, status, userId: currentUser.id } });
    toast.success(`Dépense ${status.toLowerCase()}`);
  };

  return (
    <div className="grispella-page">
      <div className="page-header">
        <h1>💸 Dépenses</h1>
        <div className="page-header-stats">
          <span className="stat-pill">Total: <strong>{formatFDJ(totalAmount)}</strong></span>
          <span className="stat-pill green">Approuvé: <strong>{formatFDJ(totalApproved)}</strong></span>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Nouvelle dépense</button>
      </div>

      <div className="grispella-card filters-row">
        <select className="form-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">Toutes catégories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Tous statuts</option>
          {APPROVAL_STATUS.map(s => <option key={s}>{s}</option>)}
        </select>
        <input type="month" className="form-input" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
        <button className="btn btn-secondary" onClick={() => { setFilterCat(''); setFilterStatus(''); setFilterDate(''); }}>
          Réinitialiser
        </button>
      </div>

      <div className="grispella-card" style={{ padding: 0 }}>
        <table className="grispella-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Catégorie</th>
              <th>Bénéficiaire</th>
              <th>Montant</th>
              <th>Mode paiement</th>
              <th>Description</th>
              <th>Statut</th>
              {currentUser.role === 'admin' && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#888' }}>Aucune dépense</td></tr>
            )}
            {filtered.map(e => (
              <tr key={e.id}>
                <td>{new Date(e.date).toLocaleDateString('fr-FR')}</td>
                <td><span className="badge-pill">{e.category}</span></td>
                <td>{e.beneficiary}</td>
                <td><strong>{formatFDJ(e.amount)}</strong></td>
                <td>{e.paymentMethod}</td>
                <td style={{ maxWidth: 180, fontSize: '0.85rem', color: '#555' }}>{e.description || '—'}</td>
                <td>
                  <span className="status-tag" style={{ background: APPROVAL_COLORS[e.approvalStatus] || '#ccc', color: '#fff' }}>
                    {e.approvalStatus?.replace('_', ' ')}
                  </span>
                </td>
                {currentUser.role === 'admin' && (
                  <td>
                    {e.approvalStatus === 'EN_ATTENTE' && (
                      <div className="action-btns">
                        <button className="btn btn-sm btn-primary" onClick={() => handleApproval(e.id, 'APPROUVÉ')}>✅</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleApproval(e.id, 'REJETÉ')}>✕</button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Expense Modal */}
      {showForm && (
        <div className="detail-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="detail-modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="detail-modal-header">
              <h2>+ Nouvelle dépense</h2>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>✕</button>
            </div>
            {[
              { label: 'Bénéficiaire *', key: 'beneficiary', type: 'text', placeholder: 'Nom du bénéficiaire' },
              { label: 'Montant (FDJ) *', key: 'amount', type: 'number', placeholder: '0' },
              { label: 'Date', key: 'date', type: 'date', placeholder: '' },
              { label: 'Description', key: 'description', type: 'text', placeholder: 'Détails...' },
            ].map(f => (
              <div key={f.key} className="form-group">
                <label>{f.label}</label>
                <input type={f.type} className="form-input" placeholder={f.placeholder}
                  value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
            <div className="form-group">
              <label>Catégorie</label>
              <select className="form-select" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Mode de paiement</label>
              <select className="form-select" value={form.paymentMethod} onChange={e => setForm(p => ({ ...p, paymentMethod: e.target.value }))}>
                {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="detail-actions">
              <button className="btn btn-primary" onClick={handleAdd}>✅ Enregistrer</button>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

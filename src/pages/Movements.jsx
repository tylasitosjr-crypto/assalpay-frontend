import React, { useState } from 'react';
import { useGrispella } from '../context/GrispellaContext';
import { DEPOTS } from '../constants/grispella';

const MOVEMENT_TYPES = { IN: '🟢', OUT: '🔴', ADJUSTMENT: '🔵', RETURN: '🟡' };
const MOVEMENT_LABELS = { IN: 'Entrée', OUT: 'Sortie', ADJUSTMENT: 'Ajustement', RETURN: 'Retour' };

export default function Movements() {
  const { state, formatFDJ } = useGrispella();
  const { movements, products } = state;

  const [filterType, setFilterType] = useState('');
  const [filterDepot, setFilterDepot] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [search, setSearch] = useState('');

  const filtered = (movements || [])
    .filter(m => {
      const matchType = !filterType || m.type === filterType;
      const matchDepot = !filterDepot || m.depotId === filterDepot;
      const matchProduct = !filterProduct || m.productId === filterProduct;
      const matchDate = !filterDate || (m.date || m.createdAt || '').startsWith(filterDate);
      const matchSearch = !search || (m.productName || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.documentRef || '').toLowerCase().includes(search.toLowerCase());
      return matchType && matchDepot && matchProduct && matchDate && matchSearch;
    })
    .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

  return (
    <div className="grispella-page">
      <div className="page-header">
        <h1>📊 Journal des mouvements</h1>
        <div className="page-header-stats">
          <span className="stat-pill">{filtered.length} mouvement(s)</span>
        </div>
      </div>

      <div className="grispella-card filters-row" style={{ flexWrap: 'wrap' }}>
        <input type="text" className="form-input" placeholder="🔍 Rechercher..."
          value={search} onChange={e => setSearch(e.target.value)} style={{ flex: '1 1 180px' }} />
        <select className="form-select" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ flex: '1 1 140px' }}>
          <option value="">Tous types</option>
          {Object.keys(MOVEMENT_TYPES).map(t => <option key={t} value={t}>{MOVEMENT_LABELS[t]}</option>)}
        </select>
        <select className="form-select" value={filterDepot} onChange={e => setFilterDepot(e.target.value)} style={{ flex: '1 1 140px' }}>
          <option value="">Tous dépôts</option>
          {DEPOTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="form-select" value={filterProduct} onChange={e => setFilterProduct(e.target.value)} style={{ flex: '1 1 180px' }}>
          <option value="">Tous produits</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input type="month" className="form-input" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ flex: '1 1 140px' }} />
        <button className="btn btn-secondary" onClick={() => { setFilterType(''); setFilterDepot(''); setFilterProduct(''); setFilterDate(''); setSearch(''); }}>
          Réinitialiser
        </button>
      </div>

      <div className="grispella-card" style={{ padding: 0 }}>
        <table className="grispella-table">
          <thead>
            <tr>
              <th>Date / Heure</th>
              <th>Type</th>
              <th>Produit</th>
              <th>Dépôt</th>
              <th>Qté</th>
              <th>Unité</th>
              <th>Lot</th>
              <th>Réf. document</th>
              <th>Utilisateur</th>
              <th>Motif</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: '32px', color: '#888' }}>Aucun mouvement</td></tr>
            )}
            {filtered.map((m, i) => (
              <tr key={m.id || i}>
                <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                  {new Date(m.date || m.createdAt).toLocaleString('fr-FR')}
                </td>
                <td>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: { IN: '#d5f5e3', OUT: '#fde8e8', ADJUSTMENT: '#d6eaf8', RETURN: '#fef9e7' }[m.type] || '#eee',
                    color: { IN: '#1e8449', OUT: '#c0392b', ADJUSTMENT: '#1a5276', RETURN: '#d35400' }[m.type] || '#333',
                  }}>
                    {MOVEMENT_TYPES[m.type]} {MOVEMENT_LABELS[m.type] || m.type}
                  </span>
                </td>
                <td>{m.productName || products.find(p => p.id === m.productId)?.name || m.productId}</td>
                <td><span className="badge-depot">{m.depotId}</span></td>
                <td style={{ fontWeight: 700, color: m.quantity > 0 ? '#27ae60' : '#e74c3c' }}>
                  {m.quantity > 0 ? '+' : ''}{m.quantity}
                </td>
                <td>{m.unit || '—'}</td>
                <td>{m.lot || '—'}</td>
                <td><code style={{ fontSize: '0.75rem' }}>{m.documentRef || '—'}</code></td>
                <td>{m.userName || m.userId || '—'}</td>
                <td style={{ maxWidth: 120, fontSize: '0.8rem', color: '#666' }}>{m.reason || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

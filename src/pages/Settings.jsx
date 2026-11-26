import React, { useState, useEffect } from 'react';
import { useGrispella } from '../context/GrispellaContext';
import { COMPANY, PAYMENT_METHODS, ROLES } from '../constants/grispella';
import grispellaApi from '../api/grispellaApi';
import { toast } from 'react-toastify';

export default function Settings() {
  const { state, dispatch, depots: ctxDepots } = useGrispella();
  const { currentUser } = state || {};

  const [companyForm, setCompanyForm] = useState({
    name: COMPANY.name,
    phone: COMPANY.phone,
    address: COMPANY.address,
    email: COMPANY.email || '',
    nif: COMPANY.nif || '',
  });

  // ── Depot management state ──────────────────────────────────────────────
  const [depots, setDepots] = useState(ctxDepots || []);
  const [showAddDepot, setShowAddDepot] = useState(false);
  const [addDepotForm, setAddDepotForm] = useState({ name: '', location: '', manager: '', capacity: '' });
  const [depotSaving, setDepotSaving] = useState(false);

  const refreshDepots = async () => {
    try {
      const res = await grispellaApi.getDepots();
      if (res?.depots) {
        setDepots(res.depots);
        dispatch({ type: 'HYDRATE_FROM_API', payload: { depots: res.depots } });
      }
    } catch (err) {
      console.warn('[Settings] Could not refresh depots:', err.message);
    }
  };

  useEffect(() => {
    refreshDepots();
  }, []);

  // Keep local list in sync with context (e.g. if another page adds a depot)
  useEffect(() => {
    if (ctxDepots?.length) setDepots(ctxDepots);
  }, [ctxDepots]);

  const handleAddDepot = async () => {
    if (!addDepotForm.name.trim()) {
      toast.error('Le nom du dépôt est requis');
      return;
    }
    setDepotSaving(true);
    try {
      await grispellaApi.createDepot(addDepotForm);
      toast.success('✅ Dépôt créé avec succès');
      setShowAddDepot(false);
      setAddDepotForm({ name: '', location: '', manager: '', capacity: '' });
      await refreshDepots();
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la création du dépôt');
    } finally {
      setDepotSaving(false);
    }
  };

  const handleDeleteDepot = async (depot) => {
    if (depots.length <= 1) {
      toast.error('Impossible de supprimer le dernier dépôt');
      return;
    }
    if (!window.confirm(`Supprimer le dépôt "${depot.name}" ?\n\nCette action est réversible (soft-delete). Les données historiques sont conservées.`)) return;
    try {
      await grispellaApi.deleteDepot(depot.id);
      toast.success(`🗑️ Dépôt "${depot.name}" supprimé`);
      dispatch({ type: 'REMOVE_DEPOT', payload: depot.id });
      await refreshDepots();
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la suppression');
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="grispella-page">
        <div className="page-header"><h1>⚙️ Paramètres</h1></div>
        <div className="grispella-card" style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ color: '#888', fontSize: '1.1rem' }}>🔒 Accès réservé aux administrateurs</p>
        </div>
      </div>
    );
  }

  const handleSaveCompany = () => {
    dispatch({ type: 'UPDATE_COMPANY_SETTINGS', payload: companyForm });
    toast.success('Informations de la société enregistrées');
  };

  const handleClearData = () => {
    if (!window.confirm('⚠️ Effacer TOUTES les données locales ? Cette action est irréversible !')) return;
    if (!window.confirm('Dernière confirmation : toutes les factures, mouvements et clients seront supprimés. Continuer ?')) return;
    localStorage.removeItem('grispella_state');
    window.location.reload();
  };

  return (
    <div className="grispella-page">
      <div className="page-header">
        <h1>⚙️ Paramètres système</h1>
      </div>

      {/* Company Info */}
      <div className="grispella-card">
        <h3 style={{ marginTop: 0 }}>🏢 Informations de la société</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Nom de la société', key: 'name' },
            { label: 'Téléphone', key: 'phone' },
            { label: 'Adresse', key: 'address' },
            { label: 'Email', key: 'email' },
            { label: 'NIF', key: 'nif' },
          ].map(f => (
            <div key={f.key} className="form-group">
              <label>{f.label}</label>
              <input type="text" className="form-input" value={companyForm[f.key]}
                onChange={e => setCompanyForm(p => ({ ...p, [f.key]: e.target.value }))} />
            </div>
          ))}
        </div>
        <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={handleSaveCompany}>✅ Enregistrer</button>
      </div>

      {/* Depots — FULLY MANAGEABLE */}
      <div className="grispella-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ margin: 0 }}>🏭 Dépôts configurés ({depots.length})</h3>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddDepot(true)}
            style={{ padding: '7px 16px', fontSize: '0.85rem' }}
          >
            + Ajouter un dépôt
          </button>
        </div>

        <table className="grispella-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Localisation</th>
              <th>Responsable</th>
              <th>Capacité</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {depots.map(d => (
              <tr key={d.id}>
                <td><code>{d.id}</code></td>
                <td><strong>{d.name}</strong></td>
                <td>{d.location || '—'}</td>
                <td>{d.manager || '—'}</td>
                <td>{d.capacity || '—'}</td>
                <td>
                  <button
                    onClick={() => handleDeleteDepot(d)}
                    disabled={depots.length <= 1}
                    title={depots.length <= 1 ? 'Impossible de supprimer le dernier dépôt' : `Supprimer ${d.name}`}
                    style={{
                      background: depots.length <= 1 ? 'rgba(255,255,255,0.05)' : 'rgba(239,68,68,0.12)',
                      color: depots.length <= 1 ? '#555' : '#fca5a5',
                      border: `1px solid ${depots.length <= 1 ? 'rgba(255,255,255,0.1)' : 'rgba(239,68,68,0.3)'}`,
                      borderRadius: 'var(--radius-sm, 6px)',
                      padding: '4px 12px',
                      cursor: depots.length <= 1 ? 'not-allowed' : 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                  >
                    🗑️ Supprimer
                  </button>
                </td>
              </tr>
            ))}
            {depots.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#666', padding: 24 }}>
                  Aucun dépôt configuré
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Depot Modal */}
      {showAddDepot && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000,
          }}
          onClick={() => setShowAddDepot(false)}
        >
          <div
            style={{
              background: 'var(--bg-card, #1e2535)', borderRadius: 'var(--radius, 10px)',
              padding: 28, maxWidth: 460, width: '92%', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              border: '1px solid var(--border, rgba(255,255,255,0.1))',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>🏭 Nouveau dépôt</h3>
              <button
                onClick={() => setShowAddDepot(false)}
                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.3rem', lineHeight: 1 }}
              >✕</button>
            </div>

            {[
              { label: 'Nom du dépôt *', key: 'name', placeholder: 'Ex: Entrepôt Balbala' },
              { label: 'Localisation', key: 'location', placeholder: 'Ex: Zone Industrielle, Djibouti' },
              { label: 'Responsable', key: 'manager', placeholder: 'Ex: Mohamed Ali' },
              { label: 'Capacité', key: 'capacity', placeholder: 'Ex: 2000 m³' },
            ].map(f => (
              <div key={f.key} className="form-group" style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 5, fontSize: '0.85rem', color: '#aaa' }}>{f.label}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={f.placeholder}
                  value={addDepotForm[f.key]}
                  onChange={e => setAddDepotForm(p => ({ ...p, [f.key]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && f.key === 'capacity' && handleAddDepot()}
                  style={{ width: '100%' }}
                />
              </div>
            ))}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={() => setShowAddDepot(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleAddDepot} disabled={depotSaving}>
                {depotSaving ? '⏳ Enregistrement...' : '✅ Créer le dépôt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods */}
      <div className="grispella-card">
        <h3 style={{ marginTop: 0 }}>💳 Modes de paiement</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {PAYMENT_METHODS.map(m => (
            <span key={m.id} className="badge-pill" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
              {m.icon} {m.label}
            </span>
          ))}
        </div>
      </div>

      {/* Roles */}
      <div className="grispella-card">
        <h3 style={{ marginTop: 0 }}>👤 Rôles utilisateurs</h3>
        <table className="grispella-table">
          <thead><tr><th>ID</th><th>Libellé</th><th>Permissions</th></tr></thead>
          <tbody>
            {Object.entries(ROLES).map(([key, roleObj]) => {
              const roleId = typeof roleObj === 'object' ? roleObj.id : key;
              const roleLabel = typeof roleObj === 'object' ? roleObj.label : roleObj;
              const roleDesc = typeof roleObj === 'object' ? roleObj.desc : '—';
              return (
                <tr key={roleId}>
                  <td><code>{roleId}</code></td>
                  <td>{roleLabel}</td>
                  <td style={{ color: '#888', fontSize: '0.85rem' }}>{roleDesc}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Danger Zone */}
      <div className="grispella-card" style={{ borderColor: '#e74c3c', borderWidth: 2 }}>
        <h3 style={{ marginTop: 0, color: '#e74c3c' }}>⚠️ Zone dangereuse</h3>
        <p style={{ color: '#666' }}>Ces actions sont irréversibles. Utilisez avec extrême prudence.</p>
        <button className="btn btn-danger" onClick={handleClearData}>
          🗑️ Effacer toutes les données locales
        </button>
      </div>
    </div>
  );
}

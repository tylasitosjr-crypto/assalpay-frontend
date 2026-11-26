import React, { useState, useEffect } from 'react';
import { useGrispella } from '../context/GrispellaContext';
import { COMPANY, PAYMENT_METHODS, ROLES } from '../constants/grispella';
import grispellaApi from '../api/grispellaApi';
import { toast } from 'react-toastify';
import {
  FiMapPin,
  FiUser,
  FiBox,
  FiPlus,
  FiTrash2,
  FiCheck,
  FiAlertTriangle,
  FiLayers,
  FiSettings,
  FiBriefcase,
  FiCreditCard,
  FiShield,
  FiX,
  FiCheckCircle,
  FiGrid,
  FiList
} from 'react-icons/fi';

export default function Settings() {
  const { state, dispatch, depots: ctxDepots } = useGrispella();
  const { currentUser, currentDepot } = state || {};

  const [activeTab, setActiveTab] = useState('depots');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

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
  const [depotToDelete, setDepotToDelete] = useState(null);
  const [addDepotForm, setAddDepotForm] = useState({ name: '', location: '', manager: '', capacity: '' });
  const [depotSaving, setDepotSaving] = useState(false);
  const [depotDeleting, setDepotDeleting] = useState(false);

  const refreshDepots = async () => {
    try {
      const res = await grispellaApi.getDepots();
      if (res?.depots && Array.isArray(res.depots)) {
        setDepots(res.depots);
        dispatch({ type: 'HYDRATE_FROM_API', payload: { depots: res.depots } });
      }
    } catch (err) {
      console.warn('[Settings] Note refresh depots:', err.message);
    }
  };

  useEffect(() => {
    refreshDepots();
  }, []);

  useEffect(() => {
    if (ctxDepots?.length) setDepots(ctxDepots);
  }, [ctxDepots]);

  if (currentUser?.role !== 'admin') {
    return (
      <div className="grispella-page">
        <div className="page-header">
          <h1>⚙️ Paramètres</h1>
        </div>
        <div className="grispella-card" style={{ textAlign: 'center', padding: '48px 20px' }}>
          <FiShield style={{ fontSize: '2.5rem', color: '#f59e0b', marginBottom: 12 }} />
          <h2 style={{ margin: '0 0 8px 0', fontSize: '1.25rem' }}>Accès Restreint</h2>
          <p style={{ color: '#888', margin: 0 }}>
            Cette section est exclusivement réservée aux administrateurs du système.
          </p>
        </div>
      </div>
    );
  }

  const handleAddDepot = async (e) => {
    if (e) e.preventDefault();
    if (!addDepotForm.name.trim()) {
      toast.error('Le nom du dépôt est obligatoire');
      return;
    }
    setDepotSaving(true);
    try {
      const res = await grispellaApi.createDepot(addDepotForm);
      toast.success(res?.message || '✅ Dépôt créé avec succès');
      setShowAddDepot(false);
      setAddDepotForm({ name: '', location: '', manager: '', capacity: '' });
      await refreshDepots();
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la création du dépôt');
    } finally {
      setDepotSaving(false);
    }
  };

  const confirmDeleteDepot = async () => {
    if (!depotToDelete) return;
    if (depots.length <= 1) {
      toast.error('Impossible de supprimer le dernier dépôt actif. Au moins un dépôt doit être conservé.');
      setDepotToDelete(null);
      return;
    }

    setDepotDeleting(true);
    const targetId = depotToDelete.id;
    const targetName = depotToDelete.name;

    try {
      await grispellaApi.deleteDepot(targetId);
      toast.success(`🗑️ Dépôt "${targetName}" retiré avec succès`);
    } catch (err) {
      console.warn('API delete note:', err.message);
      toast.info(`Dépôt "${targetName}" retiré de la configuration`);
    } finally {
      // Always update local context and storage immediately
      dispatch({ type: 'REMOVE_DEPOT', payload: targetId });
      setDepots((prev) => prev.filter((d) => d.id !== targetId));
      setDepotToDelete(null);
      setDepotDeleting(false);
      await refreshDepots();
    }
  };

  const handleSetCurrentDepot = (depotId) => {
    dispatch({ type: 'SET_DEPOT', payload: depotId });
    toast.success(`Dépôt actif changé : ${depotId}`);
  };

  const handleSaveCompany = () => {
    dispatch({ type: 'UPDATE_COMPANY_SETTINGS', payload: companyForm });
    toast.success('Informations de la société enregistrées');
  };

  const handleClearData = () => {
    if (!window.confirm('⚠️ Effacer TOUTES les données locales ? Cette action est irréversible !')) return;
    if (!window.confirm('Dernière confirmation : toutes les factures, mouvements et clients locaux seront supprimés. Continuer ?')) return;
    localStorage.removeItem('grispella_state');
    localStorage.removeItem('grispella_depots');
    window.location.reload();
  };

  return (
    <div className="grispella-page">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
            <span>⚙️ Paramètres & Configuration</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>
            Gestion centralisée des dépôts, informations légales, paiements et sécurité.
          </p>
        </div>
      </div>

      {/* Responsive Navigation Tabs (Touch-friendly scrollable bar on phone & tablet) */}
      <div
        className="settings-tabs-bar"
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 10,
          marginBottom: 18,
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {[
          { id: 'depots', label: `Dépôts (${depots.length})`, icon: FiLayers },
          { id: 'company', label: 'Société & Légal', icon: FiBriefcase },
          { id: 'payments', label: 'Paiements', icon: FiCreditCard },
          { id: 'roles', label: 'Rôles & Accès', icon: FiShield },
          { id: 'danger', label: 'Zone Critique', icon: FiAlertTriangle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 'var(--radius, 10px)',
                background: isActive ? 'var(--brand, #059669)' : 'var(--surface, #1e2535)',
                color: isActive ? '#ffffff' : 'var(--text-muted, #94a3b8)',
                border: isActive
                  ? '1px solid var(--brand, #059669)'
                  : '1px solid var(--border, rgba(255,255,255,0.08))',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                flexShrink: 0,
                minHeight: 42,
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: DÉPÔTS CONFIGURÉS (Responsive Phone / Tablet / PC) ──────────────── */}
      {activeTab === 'depots' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Header Action Card */}
          <div
            className="grispella-card"
            style={{
              padding: '18px 20px',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🏭 Dépôts configurés</span>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 12,
                  }}
                >
                  {depots.length} actif{depots.length > 1 ? 's' : ''}
                </span>
              </h2>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Dépôt actuellement sélectionné : <strong style={{ color: '#38bdf8' }}>{currentDepot}</strong>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {/* PC View Toggle */}
              <div
                style={{
                  display: 'none',
                  background: 'var(--surface2, #252e42)',
                  borderRadius: 8,
                  padding: 3,
                  border: '1px solid var(--border)',
                }}
                className="desktop-view-toggle"
              >
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  style={{
                    background: viewMode === 'cards' ? 'var(--brand)' : 'transparent',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: '0.8rem',
                  }}
                >
                  <FiGrid /> Grille
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  style={{
                    background: viewMode === 'table' ? 'var(--brand)' : 'transparent',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: '0.8rem',
                  }}
                >
                  <FiList /> Tableau
                </button>
              </div>

              {/* Add Depot Button */}
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowAddDepot(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 18px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  minHeight: 44,
                }}
              >
                <FiPlus size={18} />
                <span>Nouveau dépôt</span>
              </button>
            </div>
          </div>

          {/* Cards Grid — Fully Responsive for Mobile Phone (1 col), Tablet (2 cols), Desktop (3 cols) */}
          {viewMode === 'cards' ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
                gap: 16,
              }}
            >
              {depots.map((d) => {
                const isSelected = currentDepot === d.id;
                const canDelete = depots.length > 1;

                return (
                  <div
                    key={d.id}
                    className="grispella-card"
                    style={{
                      padding: 18,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      border: isSelected ? '2px solid #10b981' : '1px solid var(--border)',
                      boxShadow: isSelected ? '0 0 16px rgba(16, 185, 129, 0.2)' : 'none',
                      borderRadius: 'var(--radius, 12px)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Card Top */}
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 10,
                          marginBottom: 12,
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <span
                              style={{
                                background: 'rgba(56, 189, 248, 0.15)',
                                color: '#38bdf8',
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                padding: '2px 8px',
                                borderRadius: 6,
                              }}
                            >
                              {d.id}
                            </span>
                            {isSelected && (
                              <span
                                style={{
                                  background: 'rgba(16, 185, 129, 0.18)',
                                  color: '#34d399',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: 12,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <FiCheckCircle size={12} /> Actif en cours
                              </span>
                            )}
                          </div>
                          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f1f5f9' }}>{d.name}</h3>
                        </div>
                      </div>

                      {/* Card Details */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                          padding: '12px 0',
                          borderTop: '1px solid rgba(255,255,255,0.06)',
                          borderBottom: '1px solid rgba(255,255,255,0.06)',
                          marginBottom: 14,
                          fontSize: '0.85rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
                          <FiMapPin style={{ color: '#38bdf8', flexShrink: 0 }} />
                          <span style={{ color: '#cbd5e1' }}>{d.location || 'Localisation non définie'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
                          <FiUser style={{ color: '#a78bfa', flexShrink: 0 }} />
                          <span>
                            Responsable : <strong style={{ color: '#cbd5e1' }}>{d.manager || 'Non assigné'}</strong>
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
                          <FiBox style={{ color: '#f59e0b', flexShrink: 0 }} />
                          <span>
                            Capacité : <strong style={{ color: '#cbd5e1' }}>{d.capacity || 'Standard'}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions (Large touch targets for phones & tablets) */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      {!isSelected && (
                        <button
                          type="button"
                          onClick={() => handleSetCurrentDepot(d.id)}
                          style={{
                            flex: 1,
                            minHeight: 42,
                            background: 'rgba(56, 189, 248, 0.1)',
                            border: '1px solid rgba(56, 189, 248, 0.25)',
                            color: '#38bdf8',
                            borderRadius: 'var(--radius-sm, 8px)',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                          }}
                        >
                          <FiCheck size={14} /> Sélectionner
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setDepotToDelete(d)}
                        disabled={!canDelete}
                        title={!canDelete ? 'Impossible de supprimer le dernier dépôt actif' : `Supprimer ${d.name}`}
                        style={{
                          minHeight: 42,
                          flex: isSelected ? 1 : '0 0 auto',
                          background: canDelete ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                          border: `1px solid ${canDelete ? 'rgba(239, 68, 68, 0.35)' : 'rgba(255, 255, 255, 0.08)'}`,
                          color: canDelete ? '#fca5a5' : '#64748b',
                          borderRadius: 'var(--radius-sm, 8px)',
                          padding: '8px 16px',
                          cursor: canDelete ? 'pointer' : 'not-allowed',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        <FiTrash2 size={15} />
                        <span>Supprimer</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View (Available for PC / Large Screens) */
            <div className="grispella-card" style={{ padding: 0, overflowX: 'auto' }}>
              <table className="grispella-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nom du Dépôt</th>
                    <th>Localisation</th>
                    <th>Responsable</th>
                    <th>Capacité</th>
                    <th>Statut</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {depots.map((d) => {
                    const isSelected = currentDepot === d.id;
                    const canDelete = depots.length > 1;

                    return (
                      <tr key={d.id} className={isSelected ? 'row-selected' : ''}>
                        <td>
                          <code style={{ color: '#38bdf8', fontWeight: 700 }}>{d.id}</code>
                        </td>
                        <td>
                          <strong>{d.name}</strong>
                        </td>
                        <td>{d.location || '—'}</td>
                        <td>{d.manager || '—'}</td>
                        <td>{d.capacity || '—'}</td>
                        <td>
                          {isSelected ? (
                            <span className="badge-pill" style={{ background: '#10b981', color: '#fff' }}>
                              ⭐ Actif
                            </span>
                          ) : (
                            <span className="badge-pill" style={{ background: 'rgba(255,255,255,0.08)', color: '#aaa' }}>
                              Disponible
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            {!isSelected && (
                              <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                onClick={() => handleSetCurrentDepot(d.id)}
                              >
                                Activer
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setDepotToDelete(d)}
                              disabled={!canDelete}
                              className="btn btn-sm"
                              style={{
                                background: canDelete ? 'rgba(239,68,68,0.15)' : 'transparent',
                                border: '1px solid rgba(239,68,68,0.3)',
                                color: canDelete ? '#fca5a5' : '#666',
                                cursor: canDelete ? 'pointer' : 'not-allowed',
                              }}
                            >
                              🗑️ Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: INFORMATIONS DE LA SOCIÉTÉ ────────────────────────────────────── */}
      {activeTab === 'company' && (
        <div className="grispella-card">
          <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiBriefcase /> Informations Générales & Légal
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
            Ces coordonnées apparaissent sur les factures, bons de livraison et rapports officiels en Francs Djibouti (FDJ).
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 14,
            }}
          >
            {[
              { label: 'Nom commercial de la société', key: 'name' },
              { label: 'Numéro de téléphone principal', key: 'phone' },
              { label: 'Adresse physique / Siège', key: 'address' },
              { label: 'Adresse email professionnelle', key: 'email' },
              { label: 'Numéro d’Identification Fiscale (NIF)', key: 'nif' },
            ].map((f) => (
              <div key={f.key} className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.82rem', marginBottom: 6, display: 'block', color: 'var(--text-muted)' }}>
                  {f.label}
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%', minHeight: 42, fontSize: '0.9rem' }}
                  value={companyForm[f.key]}
                  onChange={(e) => setCompanyForm((p) => ({ ...p, [f.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20 }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ minHeight: 44, padding: '0 24px' }}
              onClick={handleSaveCompany}
            >
              <FiCheck size={16} /> Enregistrer les modifications
            </button>
          </div>
        </div>
      )}

      {/* ── TAB 3: MODES DE PAIEMENT ────────────────────────────────────────────── */}
      {activeTab === 'payments' && (
        <div className="grispella-card">
          <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiCreditCard /> Modes de règlement acceptés
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
            Circuits financiers configurés pour les ventes comptoir, encaissements POS et crédits clients.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {PAYMENT_METHODS.map((m) => (
              <div
                key={m.id}
                style={{
                  background: 'var(--surface2, #252e42)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius, 10px)',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span style={{ fontSize: '1.6rem' }}>{m.icon}</span>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem' }}>{m.label}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Actif · Réception FDJ</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: RÔLES & ACCÈS ────────────────────────────────────────────────── */}
      {activeTab === 'roles' && (
        <div className="grispella-card">
          <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiShield /> Matrice des rôles utilisateurs
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
            Cloisonnement strict des accès par fonction pour garantir la sécurité des stocks et des flux de caisse.
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table className="grispella-table">
              <thead>
                <tr>
                  <th>Code Rôle</th>
                  <th>Intitulé du Poste</th>
                  <th>Droits & Permissions</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(ROLES).map(([key, roleObj]) => {
                  const roleId = typeof roleObj === 'object' ? roleObj.id : key;
                  const roleLabel = typeof roleObj === 'object' ? roleObj.label : roleObj;
                  const roleDesc = typeof roleObj === 'object' ? roleObj.desc : '—';
                  return (
                    <tr key={roleId}>
                      <td>
                        <code style={{ color: '#34d399', fontWeight: 700 }}>{roleId}</code>
                      </td>
                      <td>
                        <strong>{roleLabel}</strong>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{roleDesc}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 5: ZONE DANGEREUSE ──────────────────────────────────────────────── */}
      {activeTab === 'danger' && (
        <div className="grispella-card" style={{ borderColor: '#ef4444', borderWidth: 2 }}>
          <h3 style={{ marginTop: 0, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiAlertTriangle /> Zone de réinitialisation critique
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Cette opération efface les données mises en mémoire cache locale de ce navigateur et réinitialise l'application.
          </p>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleClearData}
            style={{ minHeight: 44, padding: '0 20px', fontWeight: 700 }}
          >
            🗑️ Réinitialiser le cache local
          </button>
        </div>
      )}

      {/* ── MODAL: CONFIRMATION SUPPRESSION DÉPÔT (Sleek Mobile & PC In-App Dialog) ── */}
      {depotToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
          onClick={() => !depotDeleting && setDepotToDelete(null)}
        >
          <div
            style={{
              background: 'var(--bg-card, #1e2535)',
              borderRadius: 'var(--radius, 14px)',
              padding: '24px 22px',
              maxWidth: 440,
              width: '100%',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  borderRadius: '50%',
                  width: 44,
                  height: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <FiTrash2 size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f87171' }}>Supprimer le dépôt ?</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Action sur le dépôt {depotToDelete.id}</span>
              </div>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.5, margin: '0 0 16px' }}>
              Êtes-vous certain de vouloir supprimer le dépôt <strong>"{depotToDelete.name}"</strong> ?
            </p>

            <div
              style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: '0.8rem',
                color: '#fbbf24',
                marginBottom: 20,
              }}
            >
              ℹ️ <strong>Sécurité intégrité :</strong> Si ce dépôt possède des factures ou mouvements historiques, il sera désactivé sans perte d'historique comptable.
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={depotDeleting}
                onClick={() => setDepotToDelete(null)}
                style={{ flex: 1, minHeight: 44 }}
              >
                Annuler
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={depotDeleting}
                onClick={confirmDeleteDepot}
                style={{ flex: 1.3, minHeight: 44, fontWeight: 700 }}
              >
                {depotDeleting ? 'Suppression...' : 'Oui, supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: AJOUTER UN NOUVEAU DÉPÔT (Adaptive Mobile Bottom-sheet / Dialog) ─ */}
      {showAddDepot && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
          onClick={() => !depotSaving && setShowAddDepot(false)}
        >
          <div
            style={{
              background: 'var(--bg-card, #1e2535)',
              borderRadius: 'var(--radius, 14px)',
              padding: '24px 22px',
              maxWidth: 480,
              width: '100%',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
              border: '1px solid var(--border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiPlus style={{ color: '#10b981' }} />
                <span>Nouveau Dépôt de Stock</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddDepot(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  padding: 4,
                }}
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleAddDepot}>
              {[
                { label: 'Nom du dépôt *', key: 'name', placeholder: 'ex: Entrepôt Balbala 2', required: true },
                { label: 'Localisation / Ville', key: 'location', placeholder: 'ex: PK12, Balbala, Djibouti' },
                { label: 'Responsable logistique', key: 'manager', placeholder: 'ex: Mohamed Ali Hassan' },
                { label: 'Capacité estimée', key: 'capacity', placeholder: 'ex: 2 500 m³' },
              ].map((f) => (
                <div key={f.key} className="form-group" style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {f.label}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={f.placeholder}
                    required={f.required}
                    value={addDepotForm[f.key]}
                    onChange={(e) => setAddDepotForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: '100%', minHeight: 44, fontSize: '16px' }} // 16px prevents iOS zoom
                  />
                </div>
              ))}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={depotSaving}
                  onClick={() => setShowAddDepot(false)}
                  style={{ flex: 1, minHeight: 44 }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={depotSaving}
                  style={{ flex: 1.5, minHeight: 44, fontWeight: 700 }}
                >
                  {depotSaving ? 'Création en cours...' : '✅ Créer le dépôt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

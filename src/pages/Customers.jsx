import React, { useState, useEffect, useMemo } from 'react';
import { useGrispella } from '../context/GrispellaContext';
import grispellaApi from '../api/grispellaApi';
import { toast } from 'react-toastify';
import {
  FiUser,
  FiPhone,
  FiMail,
  FiMapPin,
  FiEdit2,
  FiStar,
  FiSlash,
  FiFileText,
  FiDollarSign,
  FiChevronDown,
  FiChevronUp,
  FiX,
  FiTrendingUp,
} from 'react-icons/fi';

const PAYMENT_METHODS = ['Cash', 'Waafi', 'CAC', 'Saba', 'Exim Bank'];

export default function Customers() {
  const { state, dispatch, formatFDJ, collectCredit } = useGrispella();
  const { customers = [], invoices = [], products = [], creditPayments = [] } = state || {};

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [profileTab, setProfileTab] = useState('overview');
  const [apiProfile, setApiProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState(null);
  const [notBoughtSearch, setNotBoughtSearch] = useState('');

  // Modals
  const [showCredit, setShowCredit] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const [creditForm, setCreditForm] = useState({ amount: '', method: 'Cash', note: '' });
  const [addForm, setAddForm] = useState({ name: '', phone: '', email: '', address: '', creditLimit: 0 });
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', address: '', creditLimit: 0 });

  const filtered = customers
    .filter(
      (c) =>
        (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.phone || '').includes(search) ||
        (c.id || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => (b.debtAmount || 0) - (a.debtAmount || 0));

  // Fetch live profile from backend when a customer is selected
  useEffect(() => {
    if (!selected?.id) {
      setApiProfile(null);
      return;
    }
    let active = true;
    setLoadingProfile(true);
    setExpandedInvoiceId(null);
    grispellaApi
      .getCustomerProfile(selected.id)
      .then((res) => {
        if (active && res?.success && res.profile) {
          setApiProfile(res.profile);
        }
      })
      .catch(() => {
        if (active) setApiProfile(null);
      })
      .finally(() => {
        if (active) setLoadingProfile(false);
      });
    return () => {
      active = false;
    };
  }, [selected?.id]);

  // Compute local profile fallback so it works seamlessly offline too
  const localProfile = useMemo(() => {
    if (!selected) return null;
    const custInvoices = invoices
      .filter((i) => i.customerId === selected.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const activeInvoices = custInvoices.filter((i) => i.status !== 'ANNULÉ');
    const productMap = new Map(products.map((p) => [p.id, p]));

    const productStatsMap = {};
    const categoryStatsMap = {};
    const paymentMethodCount = {};

    activeInvoices.forEach((inv) => {
      (inv.payments || []).forEach((p) => {
        paymentMethodCount[p.method] = (paymentMethodCount[p.method] || 0) + (p.amount || 0);
      });

      (inv.items || []).forEach((item) => {
        const prod = productMap.get(item.productId);
        const category = prod?.category || 'Autre';
        const key = item.productId || item.productName;
        const lineTotal = (item.quantity || 0) * (item.unitPrice || 0);
        const baseQty = (item.quantity || 0) * (item.unitFactor || 1);

        if (!productStatsMap[key]) {
          productStatsMap[key] = {
            productId: item.productId,
            productName: item.productName,
            category,
            totalQty: 0,
            totalBaseUnits: 0,
            totalSpent: 0,
            orderCount: 0,
            lastBoughtAt: inv.date,
          };
        }
        productStatsMap[key].totalQty += item.quantity || 0;
        productStatsMap[key].totalBaseUnits += baseQty;
        productStatsMap[key].totalSpent += lineTotal;
        productStatsMap[key].orderCount += 1;
        if (new Date(inv.date) > new Date(productStatsMap[key].lastBoughtAt)) {
          productStatsMap[key].lastBoughtAt = inv.date;
        }

        if (!categoryStatsMap[category]) {
          categoryStatsMap[category] = { category, totalSpent: 0, itemsCount: 0 };
        }
        categoryStatsMap[category].totalSpent += lineTotal;
        categoryStatsMap[category].itemsCount += 1;
      });
    });

    const topProducts = Object.values(productStatsMap).sort(
      (a, b) => b.totalSpent - a.totalSpent || b.totalBaseUnits - a.totalBaseUnits
    );
    const boughtIds = new Set(topProducts.map((p) => p.productId).filter(Boolean));
    const notBoughtProducts = products.filter((p) => !boughtIds.has(p.id));
    const categoryInterests = Object.values(categoryStatsMap).sort((a, b) => b.totalSpent - a.totalSpent);

    const totalSpent = activeInvoices.reduce((s, i) => s + (i.total || 0), 0);
    const totalPaid = activeInvoices.reduce((s, i) => s + (i.paidAmount || 0), 0);
    const orderCount = activeInvoices.length;
    const avgOrderValue = orderCount > 0 ? Math.round(totalSpent / orderCount) : 0;
    const lastOrderDate = activeInvoices[0]?.date || null;
    const preferredPaymentMethod =
      Object.entries(paymentMethodCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

    const custPayments = creditPayments
      .filter((cp) => cp.customerId === selected.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      customer: selected,
      stats: {
        totalSpent,
        totalPaid,
        orderCount,
        avgOrderValue,
        lastOrderDate,
        preferredPaymentMethod,
        uniqueProductsCount: topProducts.length,
        catalogProductsCount: products.length,
      },
      topProducts,
      notBoughtProducts,
      categoryInterests,
      invoices: custInvoices,
      creditPayments: custPayments,
    };
  }, [selected, invoices, products, creditPayments]);

  const profile = apiProfile || localProfile;

  const handleCollect = () => {
    const amount = parseFloat(creditForm.amount);
    if (!amount || amount <= 0) {
      toast.error('Montant invalide');
      return;
    }
    if (amount > (selected.debtAmount || 0)) {
      toast.error('Montant supérieur à la dette');
      return;
    }
    collectCredit(selected.id, amount, creditForm.method, creditForm.note);
    toast.success(`Encaissement de ${formatFDJ(amount)} enregistré`);
    setShowCredit(false);
    setCreditForm({ amount: '', method: 'Cash', note: '' });
    setSelected((prev) => ({ ...prev, debtAmount: Math.max(0, (prev.debtAmount || 0) - amount) }));
    if (apiProfile) {
      setApiProfile((prev) =>
        prev
          ? {
              ...prev,
              customer: {
                ...prev.customer,
                debtAmount: Math.max(0, (prev.customer.debtAmount || 0) - amount),
              },
              creditPayments: [
                {
                  id: `CP-${Date.now()}`,
                  date: new Date().toISOString(),
                  amount,
                  method: creditForm.method,
                  note: creditForm.note,
                  collectedBy: 'Caisse',
                },
                ...(prev.creditPayments || []),
              ],
            }
          : prev
      );
    }
  };

  const handleAddCustomer = async () => {
    if (!addForm.name.trim()) {
      toast.error('Nom requis');
      return;
    }
    const payload = {
      id: `CLI-${Date.now()}`,
      name: addForm.name.trim(),
      phone: addForm.phone.trim(),
      email: addForm.email.trim(),
      address: addForm.address.trim(),
      creditLimit: parseFloat(addForm.creditLimit) || 0,
      debtAmount: 0,
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_CUSTOMER', payload });
    try {
      const res = await grispellaApi.createCustomer(payload);
      if (res?.customer) {
        dispatch({ type: 'UPDATE_CUSTOMER', payload: { ...payload, ...res.customer } });
      }
    } catch {
      // offline fallback already handled
    }
    toast.success('Client ajouté');
    setShowAdd(false);
    setAddForm({ name: '', phone: '', email: '', address: '', creditLimit: 0 });
  };

  const openEditModal = () => {
    if (!selected) return;
    setEditForm({
      name: selected.name || '',
      phone: selected.phone || '',
      email: selected.email || '',
      address: selected.address || '',
      creditLimit: selected.creditLimit || 0,
    });
    setShowEdit(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm.name.trim()) {
      toast.error('Nom requis');
      return;
    }
    const updated = {
      ...selected,
      name: editForm.name.trim(),
      phone: editForm.phone.trim(),
      email: editForm.email.trim(),
      address: editForm.address.trim(),
      creditLimit: parseFloat(editForm.creditLimit) || 0,
    };
    dispatch({ type: 'UPDATE_CUSTOMER', payload: updated });
    setSelected(updated);
    if (apiProfile) {
      setApiProfile((prev) => (prev ? { ...prev, customer: { ...prev.customer, ...updated } } : prev));
    }
    try {
      await grispellaApi.updateCustomer(selected.id, updated);
    } catch {
      // local update still kept
    }
    toast.success('Profil client mis à jour');
    setShowEdit(false);
  };

  const filteredNotBought = useMemo(() => {
    if (!profile?.notBoughtProducts) return [];
    const q = notBoughtSearch.trim().toLowerCase();
    if (!q) return profile.notBoughtProducts;
    return profile.notBoughtProducts.filter(
      (p) =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.ref || '').toLowerCase().includes(q)
    );
  }, [profile?.notBoughtProducts, notBoughtSearch]);

  const maxProductSpent = profile?.topProducts?.[0]?.totalSpent || 1;
  const maxCategorySpent = profile?.categoryInterests?.[0]?.totalSpent || 1;

  return (
    <div className="grispella-page">
      <div className="page-header">
        <h1>👥 Clients & Profils</h1>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          + Nouveau client
        </button>
      </div>

      <div className="grispella-card filters-row">
        <input
          type="text"
          className="form-input"
          placeholder="🔍 Rechercher par nom, ID ou téléphone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <div className="stat-pill">
          Total clients: <strong>{customers.length}</strong>
        </div>
        <div className="stat-pill red">
          Créances totales: <strong>{formatFDJ(customers.reduce((s, c) => s + (c.debtAmount || 0), 0))}</strong>
        </div>
      </div>

      <div className="two-col-layout" style={{ gridTemplateColumns: selected ? '1fr 1.45fr' : '1fr' }}>
        {/* Customer List */}
        <div className="grispella-card" style={{ padding: 0 }}>
          <table className="grispella-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Téléphone</th>
                <th>Limite crédit</th>
                <th>Dette actuelle</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#888' }}>
                    Aucun client
                  </td>
                </tr>
              )}
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className={selected?.id === c.id ? 'row-selected' : ''}
                  onClick={() => {
                    setSelected(c);
                    setProfileTab('overview');
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div style={{ fontWeight: 700 }}>{c.name}</div>
                    <small style={{ color: 'var(--text-muted)' }}>{c.id}</small>
                  </td>
                  <td>{c.phone || '—'}</td>
                  <td>{formatFDJ(c.creditLimit || 0)}</td>
                  <td>
                    <span style={{ color: (c.debtAmount || 0) > 0 ? '#e74c3c' : '#27ae60', fontWeight: 600 }}>
                      {formatFDJ(c.debtAmount || 0)}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(c);
                          setProfileTab('overview');
                        }}
                      >
                        Profil
                      </button>
                      {(c.debtAmount || 0) > 0 && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(c);
                            setShowCredit(true);
                          }}
                        >
                          Encaisser
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rich Client Profile Panel */}
        {selected && profile && (
          <div className="grispella-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Profile Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'var(--brand-dim)',
                    color: 'var(--brand)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.3rem',
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {profile.customer.name?.charAt(0)?.toUpperCase() || <FiUser />}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{profile.customer.name}</h2>
                    <code style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: 4, background: 'var(--bg2)' }}>
                      {profile.customer.id}
                    </code>
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 4 }}>
                    <span><FiPhone size={12} /> {profile.customer.phone || 'Sans téléphone'}</span>
                    {profile.customer.email && <span><FiMail size={12} /> {profile.customer.email}</span>}
                    <span><FiMapPin size={12} /> {profile.customer.address || 'Adresse non renseignée'}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-sm btn-secondary" onClick={openEditModal} title="Modifier le client">
                  <FiEdit2 size={13} /> Modifier
                </button>
                <button className="btn btn-sm btn-secondary" onClick={() => setSelected(null)} title="Fermer">
                  <FiX size={14} />
                </button>
              </div>
            </div>

            {/* Profile Tabs */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
              {[
                { id: 'overview', label: 'Infos & Résumé', icon: FiUser },
                { id: 'interests', label: `Produits & Intérêts (${profile.topProducts.length})`, icon: FiStar },
                { id: 'invoices', label: `Historique Achats (${profile.invoices.length})`, icon: FiFileText },
                { id: 'credits', label: `Paiements Crédit (${profile.creditPayments.length})`, icon: FiDollarSign },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setProfileTab(t.id)}
                  className={`btn btn-sm ${profileTab === t.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ gap: 6 }}
                >
                  <t.icon size={13} />
                  {t.label}
                </button>
              ))}
            </div>

            {loadingProfile && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Synchronisation du profil depuis la base de données...
              </div>
            )}

            {/* TAB 1: OVERVIEW */}
            {profileTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                  <div className="kpi-card">
                    <div className="kpi-value" style={{ color: '#27ae60', fontSize: '1.1rem' }}>
                      {formatFDJ(profile.stats.totalSpent)}
                    </div>
                    <div className="kpi-label">Total achats</div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-value" style={{ fontSize: '1.1rem' }}>{profile.stats.orderCount}</div>
                    <div className="kpi-label">Commandes</div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-value" style={{ fontSize: '1.1rem' }}>
                      {formatFDJ(profile.stats.avgOrderValue)}
                    </div>
                    <div className="kpi-label">Panier moyen</div>
                  </div>
                  <div className="kpi-card">
                    <div
                      className="kpi-value"
                      style={{ color: (profile.customer.debtAmount || 0) > 0 ? '#e74c3c' : '#27ae60', fontSize: '1.1rem' }}
                    >
                      {formatFDJ(profile.customer.debtAmount || 0)}
                    </div>
                    <div className="kpi-label">Dette actuelle</div>
                  </div>
                </div>

                {/* Credit Limit Progress */}
                <div style={{ background: 'var(--bg2)', padding: 12, borderRadius: 'var(--radius)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: 6 }}>
                    <span>Utilisation du crédit (Limite : {formatFDJ(profile.customer.creditLimit || 0)})</span>
                    <strong>
                      {profile.customer.creditLimit > 0
                        ? Math.min(100, Math.round(((profile.customer.debtAmount || 0) / profile.customer.creditLimit) * 100))
                        : 0}
                      %
                    </strong>
                  </div>
                  <div style={{ height: 8, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${
                          profile.customer.creditLimit > 0
                            ? Math.min(100, Math.round(((profile.customer.debtAmount || 0) / profile.customer.creditLimit) * 100))
                            : 0
                        }%`,
                        background:
                          (profile.customer.debtAmount || 0) > (profile.customer.creditLimit || 0) * 0.8
                            ? '#e74c3c'
                            : 'var(--brand)',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>
                    <span>Dernier achat : {profile.stats.lastOrderDate ? new Date(profile.stats.lastOrderDate).toLocaleDateString('fr-FR') : 'Aucun'}</span>
                    <span>Paiement favori : <strong>{profile.stats.preferredPaymentMethod}</strong></span>
                  </div>
                </div>

                {(profile.customer.debtAmount || 0) > 0 && (
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowCredit(true)}>
                    💰 Encaisser un paiement crédit
                  </button>
                )}

                {/* Top 3 Best Selling Products Preview */}
                <div>
                  <h4 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FiTrendingUp color="#27ae60" /> Produits les plus achetés par ce client
                  </h4>
                  {profile.topProducts.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Aucun produit acheté pour le moment.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {profile.topProducts.slice(0, 3).map((p, idx) => (
                        <div
                          key={p.productId || p.productName}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'var(--bg2)',
                            padding: '8px 12px',
                            borderRadius: 'var(--radius)',
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 800, color: 'var(--brand)', marginRight: 8 }}>#{idx + 1}</span>
                            <strong>{p.productName}</strong>
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                              {p.category} · {p.totalQty} unités · {p.orderCount} commande(s)
                            </div>
                          </div>
                          <strong style={{ color: '#27ae60' }}>{formatFDJ(p.totalSpent)}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Category Interests */}
                {profile.categoryInterests.length > 0 && (
                  <div>
                    <h4 style={{ margin: '0 0 8px' }}>Catégories d'intérêt</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {profile.categoryInterests.map((cat) => (
                        <div key={cat.category}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 3 }}>
                            <span>{cat.category}</span>
                            <strong>{formatFDJ(cat.totalSpent)}</strong>
                          </div>
                          <div style={{ height: 6, background: 'var(--bg2)', borderRadius: 99, overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${Math.round((cat.totalSpent / maxCategorySpent) * 100)}%`,
                                background: '#3b82f6',
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PRODUCTS & INTERESTS */}
            {profileTab === 'interests' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Interested / Best Selling Products */}
                <div>
                  <h4 style={{ margin: '0 0 8px', color: '#27ae60', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FiStar /> Ce qui l'intéresse — Produits achetés ({profile.topProducts.length})
                  </h4>
                  {profile.topProducts.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Aucun achat enregistré.</p>
                  ) : (
                    <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                      <table className="grispella-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Produit</th>
                            <th>Qté</th>
                            <th>Cmds</th>
                            <th>Total acheté</th>
                            <th>Dernier achat</th>
                          </tr>
                        </thead>
                        <tbody>
                          {profile.topProducts.map((p, idx) => (
                            <tr key={p.productId || p.productName}>
                              <td><strong>#{idx + 1}</strong></td>
                              <td>
                                <div style={{ fontWeight: 600 }}>{p.productName}</div>
                                <div style={{ width: '100%', height: 4, background: 'var(--bg2)', borderRadius: 4, marginTop: 4 }}>
                                  <div
                                    style={{
                                      width: `${Math.round((p.totalSpent / maxProductSpent) * 100)}%`,
                                      height: '100%',
                                      background: '#27ae60',
                                      borderRadius: 4,
                                    }}
                                  />
                                </div>
                              </td>
                              <td>{p.totalQty}</td>
                              <td>{p.orderCount}</td>
                              <td><strong>{formatFDJ(p.totalSpent)}</strong></td>
                              <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {p.lastBoughtAt ? new Date(p.lastBoughtAt).toLocaleDateString('fr-FR') : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Not Interested / Never Bought Products */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <h4 style={{ margin: 0, color: '#e67e22', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FiSlash /> Jamais achetés / Non intéressé ({profile.notBoughtProducts.length})
                    </h4>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Filtrer produits..."
                      value={notBoughtSearch}
                      onChange={(e) => setNotBoughtSearch(e.target.value)}
                      style={{ maxWidth: 200, padding: '4px 10px', fontSize: '0.8rem' }}
                    />
                  </div>
                  {filteredNotBought.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {profile.notBoughtProducts.length === 0
                        ? 'Ce client a acheté tous les produits du catalogue !'
                        : 'Aucun produit correspondant au filtre.'}
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 180, overflowY: 'auto', padding: 8, background: 'var(--bg2)', borderRadius: 'var(--radius)' }}>
                      {filteredNotBought.map((p) => (
                        <span
                          key={p.id}
                          style={{
                            fontSize: '0.78rem',
                            padding: '4px 10px',
                            borderRadius: 99,
                            background: 'var(--bg)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-sec)',
                          }}
                        >
                          {p.name} <small style={{ color: 'var(--text-muted)' }}>({p.category})</small>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: INVOICES HISTORY */}
            {profileTab === 'invoices' && (
              <div style={{ maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {profile.invoices.length === 0 && (
                  <p style={{ color: '#888', textAlign: 'center' }}>Aucune facture</p>
                )}
                {profile.invoices.map((inv) => {
                  const isOpen = expandedInvoiceId === inv.id;
                  return (
                    <div
                      key={inv.id}
                      style={{
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        padding: '10px 12px',
                        background: 'var(--bg2)',
                      }}
                    >
                      <div
                        onClick={() => setExpandedInvoiceId(isOpen ? null : inv.id)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                      >
                        <div>
                          <code>{inv.id}</code>
                          <span style={{ marginLeft: 8, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                            {new Date(inv.date).toLocaleString('fr-FR')}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <strong>{formatFDJ(inv.total)}</strong>
                          <span
                            className="status-tag"
                            style={{
                              background:
                                { PAYÉ: '#27ae60', PARTIEL: '#f39c12', 'NON PAYÉ': '#e74c3c', ANNULÉ: '#95a5a6' }[inv.status] || '#ccc',
                              color: '#fff',
                              fontSize: '0.7rem',
                            }}
                          >
                            {inv.status}
                          </span>
                          {isOpen ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                        </div>
                      </div>

                      {isOpen && (
                        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--border)', fontSize: '0.82rem' }}>
                          {(inv.items || []).length === 0 ? (
                            <span style={{ color: 'var(--text-muted)' }}>Aucun article détaillé</span>
                          ) : (
                            <table className="grispella-table" style={{ fontSize: '0.8rem' }}>
                              <thead>
                                <tr><th>Produit</th><th>Qté</th><th>Prix U.</th><th>Total</th></tr>
                              </thead>
                              <tbody>
                                {inv.items.map((item, i) => (
                                  <tr key={i}>
                                    <td>{item.productName}</td>
                                    <td>{item.quantity} {item.unit}</td>
                                    <td>{formatFDJ(item.unitPrice)}</td>
                                    <td><strong>{formatFDJ((item.quantity || 0) * (item.unitPrice || 0))}</strong></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, color: 'var(--text-muted)' }}>
                            <span>Payé : {formatFDJ(inv.paidAmount || 0)}</span>
                            <span>Reste : {formatFDJ(Math.max(0, (inv.total || 0) - (inv.paidAmount || 0)))}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 4: CREDIT PAYMENTS HISTORY */}
            {profileTab === 'credits' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(profile.customer.debtAmount || 0) > 0 && (
                  <button className="btn btn-primary" onClick={() => setShowCredit(true)}>
                    💰 Encaisser un paiement ({formatFDJ(profile.customer.debtAmount)} dû)
                  </button>
                )}
                {profile.creditPayments.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 16 }}>
                    Aucun encaissement de crédit enregistré pour ce client.
                  </p>
                ) : (
                  <table className="grispella-table">
                    <thead>
                      <tr><th>Date</th><th>Montant</th><th>Mode</th><th>Note</th></tr>
                    </thead>
                    <tbody>
                      {profile.creditPayments.map((cp) => (
                        <tr key={cp.id}>
                          <td>{new Date(cp.date).toLocaleString('fr-FR')}</td>
                          <td><strong style={{ color: '#27ae60' }}>{formatFDJ(cp.amount)}</strong></td>
                          <td>{cp.method}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{cp.note || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Credit Collection Modal */}
      {showCredit && selected && (
        <div className="detail-modal-overlay" onClick={() => setShowCredit(false)}>
          <div className="detail-modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="detail-modal-header">
              <h2>💰 Encaissement crédit</h2>
              <button className="btn btn-secondary" onClick={() => setShowCredit(false)}>✕</button>
            </div>
            <div className="detail-section">
              <p><strong>Client:</strong> {selected.name}</p>
              <p><strong>Dette actuelle:</strong> <span style={{ color: '#e74c3c' }}>{formatFDJ(selected.debtAmount || 0)}</span></p>
            </div>
            <div className="form-group">
              <label>Montant encaissé (FDJ)</label>
              <input
                type="number"
                className="form-input"
                placeholder="0"
                value={creditForm.amount}
                onChange={(e) => setCreditForm((f) => ({ ...f, amount: e.target.value }))}
                max={selected.debtAmount || 0}
              />
            </div>
            <div className="form-group">
              <label>Mode de paiement</label>
              <select
                className="form-select"
                value={creditForm.method}
                onChange={(e) => setCreditForm((f) => ({ ...f, method: e.target.value }))}
              >
                {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Note (optionnel)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Note..."
                value={creditForm.note}
                onChange={(e) => setCreditForm((f) => ({ ...f, note: e.target.value }))}
              />
            </div>
            <div className="detail-actions">
              <button className="btn btn-primary" onClick={handleCollect}>✅ Confirmer l'encaissement</button>
              <button className="btn btn-secondary" onClick={() => setShowCredit(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAdd && (
        <div className="detail-modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="detail-modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="detail-modal-header">
              <h2>+ Nouveau client</h2>
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            {[
              { label: 'Nom *', key: 'name', type: 'text', placeholder: 'Nom du client' },
              { label: 'Téléphone', key: 'phone', type: 'tel', placeholder: '+253 77 ...' },
              { label: 'Email', key: 'email', type: 'email', placeholder: 'client@exemple.com' },
              { label: 'Adresse', key: 'address', type: 'text', placeholder: 'Quartier, ville' },
              { label: 'Limite de crédit (FDJ)', key: 'creditLimit', type: 'number', placeholder: '0' },
            ].map((f) => (
              <div key={f.key} className="form-group">
                <label>{f.label}</label>
                <input
                  type={f.type}
                  className="form-input"
                  placeholder={f.placeholder}
                  value={addForm[f.key]}
                  onChange={(e) => setAddForm((p) => ({ ...p, [f.key]: e.target.value }))}
                />
              </div>
            ))}
            <div className="detail-actions">
              <button className="btn btn-primary" onClick={handleAddCustomer}>✅ Enregistrer</button>
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEdit && selected && (
        <div className="detail-modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="detail-modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="detail-modal-header">
              <h2>✏️ Modifier le profil client</h2>
              <button className="btn btn-secondary" onClick={() => setShowEdit(false)}>✕</button>
            </div>
            {[
              { label: 'Nom *', key: 'name', type: 'text' },
              { label: 'Téléphone', key: 'phone', type: 'tel' },
              { label: 'Email', key: 'email', type: 'email' },
              { label: 'Adresse', key: 'address', type: 'text' },
              { label: 'Limite de crédit (FDJ)', key: 'creditLimit', type: 'number' },
            ].map((f) => (
              <div key={f.key} className="form-group">
                <label>{f.label}</label>
                <input
                  type={f.type}
                  className="form-input"
                  value={editForm[f.key]}
                  onChange={(e) => setEditForm((p) => ({ ...p, [f.key]: e.target.value }))}
                />
              </div>
            ))}
            <div className="detail-actions">
              <button className="btn btn-primary" onClick={handleSaveEdit}>✅ Enregistrer</button>
              <button className="btn btn-secondary" onClick={() => setShowEdit(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

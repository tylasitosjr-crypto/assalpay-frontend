import React, { useState, useEffect, useMemo } from 'react';
import { useGrispella } from '../context/GrispellaContext';
import grispellaApi from '../api/grispellaApi';
import {
  exportReportToExcel,
  exportReportToCSV,
  exportReportToJSON,
  buildShareableText,
} from '../utils/reportExport';
import { toast } from 'react-toastify';
import {
  FiDownload,
  FiFileText,
  FiPrinter,
  FiCopy,
  FiCode,
  FiRefreshCw,
  FiCalendar,
} from 'react-icons/fi';

const PAYMENT_METHODS = ['Cash', 'Waafi', 'CAC', 'Saba', 'Exim Bank'];

export default function Reports() {
  const { state, formatFDJ, COMPANY } = useGrispella();
  const {
    invoices = [],
    creditPayments = [],
    expenses = [],
    products = [],
    movements = [],
  } = state || {};

  const today = new Date().toISOString().split('T')[0];
  const thisMonth = today.substring(0, 7);
  const [period, setPeriod] = useState('day');
  const [date, setDate] = useState(today);
  const [month, setMonth] = useState(thisMonth);
  const [apiReport, setApiReport] = useState(null);
  const [loadingApi, setLoadingApi] = useState(false);

  const loadDailyFromBackend = async (targetDate) => {
    setLoadingApi(true);
    try {
      const res = await grispellaApi.getDailyReport(targetDate);
      if (res?.success) {
        setApiReport(res);
      }
    } catch {
      setApiReport(null);
    } finally {
      setLoadingApi(false);
    }
  };

  useEffect(() => {
    if (period === 'day') {
      loadDailyFromBackend(date);
    } else {
      setApiReport(null);
    }
  }, [period, date]);

  // Compute local report (used for monthly view or offline fallback)
  const localReport = useMemo(() => {
    const dateFilter = (item) => {
      const d = item?.date || item?.createdAt || '';
      if (period === 'day') return d.startsWith(date);
      return d.startsWith(month);
    };

    const periodInvoices = invoices.filter((i) => i.status !== 'ANNULÉ' && dateFilter(i));
    const periodCredits = creditPayments.filter(dateFilter);
    const periodExpenses = expenses.filter((e) => e.approvalStatus === 'APPROUVÉ' && dateFilter(e));
    const periodMovements = movements.filter(dateFilter);

    const paymentBreakdown = {};
    PAYMENT_METHODS.forEach((m) => { paymentBreakdown[m] = 0; });

    periodInvoices.forEach((inv) => {
      (inv.payments || []).forEach((p) => {
        paymentBreakdown[p.method] = (paymentBreakdown[p.method] || 0) + (p.amount || 0);
      });
    });
    periodCredits.forEach((cp) => {
      paymentBreakdown[cp.method] = (paymentBreakdown[cp.method] || 0) + (cp.amount || 0);
    });

    const totalRevenue = Object.values(paymentBreakdown).reduce((s, v) => s + v, 0);
    const totalExpenses = periodExpenses.reduce((s, e) => s + (e.amount || 0), 0);
    const totalSales = periodInvoices.reduce((s, i) => s + (i.total || 0), 0);
    const totalPaidOnSales = periodInvoices.reduce((s, i) => s + (i.paidAmount || 0), 0);
    const totalCreditCreated = Math.max(0, totalSales - totalPaidOnSales);
    const totalCreditCollected = periodCredits.reduce((s, c) => s + (c.amount || 0), 0);

    const marginByProduct = {};
    periodInvoices.forEach((inv) => {
      (inv.items || []).forEach((item) => {
        const product = products.find((p) => p.id === item.productId);
        const purchasePrice = product?.purchasePrice || 0;
        const unitCost = purchasePrice * (item.unitFactor || 1);
        const revenue = (item.quantity || 0) * (item.unitPrice || 0);
        const cost = (item.quantity || 0) * unitCost;
        const margin = revenue - cost;
        if (!marginByProduct[item.productName]) {
          marginByProduct[item.productName] = { productName: item.productName, qty: 0, revenue: 0, cost: 0, margin: 0 };
        }
        marginByProduct[item.productName].qty += item.quantity || 0;
        marginByProduct[item.productName].revenue += revenue;
        marginByProduct[item.productName].cost += cost;
        marginByProduct[item.productName].margin += margin;
      });
    });

    const stockValue = products.reduce((sum, p) => {
      const qty = Object.values(p.stockByDepot || {}).reduce((s, d) => s + (d.physical || 0), 0);
      return sum + qty * (p.purchasePrice || 0);
    }, 0);

    return {
      date: period === 'day' ? date : month,
      periodLabel: period === 'day' ? date : month,
      summary: {
        totalSales,
        totalPaidOnSales,
        totalCreditCreated,
        totalCreditCollected,
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        invoicesCount: periodInvoices.length,
        movementsCount: periodMovements.length,
        stockValue,
      },
      paymentBreakdown,
      invoices: periodInvoices,
      expenses: periodExpenses,
      margins: Object.values(marginByProduct).sort((a, b) => b.margin - a.margin),
      movements: periodMovements,
    };
  }, [invoices, creditPayments, expenses, products, movements, period, date, month]);

  const activeReport = useMemo(() => {
    if (period === 'day' && apiReport) {
      return {
        ...apiReport,
        periodLabel: date,
      };
    }
    return localReport;
  }, [period, apiReport, localReport, date]);

  const { summary, paymentBreakdown, invoices: periodInvoices, expenses: periodExpenses, margins, movements: periodMovements } = activeReport;

  const allPaymentMethods = Array.from(
    new Set([...PAYMENT_METHODS, ...Object.keys(paymentBreakdown || {})])
  );

  const handleExportExcel = () => {
    try {
      exportReportToExcel(activeReport);
      toast.success('Rapport Excel (.xlsx) téléchargé !');
    } catch (err) {
      toast.error('Erreur export Excel: ' + err.message);
    }
  };

  const handleExportCSV = () => {
    try {
      exportReportToCSV(activeReport);
      toast.success('Rapport CSV (.csv) téléchargé !');
    } catch (err) {
      toast.error('Erreur export CSV: ' + err.message);
    }
  };

  const handleExportJSON = () => {
    try {
      exportReportToJSON(activeReport);
      toast.success('Rapport JSON (.json) téléchargé !');
    } catch (err) {
      toast.error('Erreur export JSON: ' + err.message);
    }
  };

  const handleCopySummary = async () => {
    try {
      const text = buildShareableText(activeReport, formatFDJ);
      await navigator.clipboard.writeText(text);
      toast.success('Résumé copié ! Prêt à coller sur WhatsApp / Email.');
    } catch {
      toast.error('Impossible de copier dans le presse-papiers');
    }
  };

  return (
    <div className="grispella-page">
      {/* Print-only company header */}
      <div className="print-only-header" style={{ marginBottom: 20, borderBottom: '2px solid #000', paddingBottom: 10 }}>
        <h2 style={{ margin: 0 }}>{COMPANY?.name || 'GRISPELLA GENERAL TRADING SARL'}</h2>
        <p style={{ margin: '4px 0' }}>
          Rapport {period === 'day' ? 'Journalier' : 'Mensuel'} — Période : <strong>{activeReport.periodLabel}</strong>
        </p>
        <small>Imprimé le {new Date().toLocaleString('fr-FR')}</small>
      </div>

      {/* Header */}
      <div className="page-header" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>
            📊 {period === 'day' ? 'Rapport Journalier Admin' : 'Rapport Mensuel'}
          </h1>
          <small style={{ color: 'var(--text-muted)' }}>
            {period === 'day'
              ? apiReport
                ? 'Données en direct (PostgreSQL)'
                : 'Données locales'
              : 'Synthèse mensuelle'}
          </small>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <FiCalendar style={{ color: 'var(--text-muted)' }} />
          <select className="form-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="day">Rapport Journalier (Par jour)</option>
            <option value="month">Rapport Mensuel (Par mois)</option>
          </select>
          {period === 'day' ? (
            <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} />
          ) : (
            <input type="month" className="form-input" value={month} onChange={(e) => setMonth(e.target.value)} />
          )}
          {period === 'day' && (
            <button
              className="btn btn-secondary"
              onClick={() => loadDailyFromBackend(date)}
              disabled={loadingApi}
              title="Actualiser depuis le serveur"
            >
              <FiRefreshCw size={14} style={loadingApi ? { animation: 'spin 1s linear infinite' } : {}} />
            </button>
          )}
        </div>
      </div>

      {/* Export Toolbar */}
      <div
        className="grispella-card no-print"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          padding: '12px 16px',
          marginBottom: 16,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>
          Exporter / Partager le rapport ({activeReport.periodLabel}) :
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={handleExportExcel}
            style={{ background: '#16a34a', borderColor: '#16a34a', gap: 6 }}
          >
            <FiDownload size={14} /> Excel (.xlsx)
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleExportCSV}
            style={{ gap: 6 }}
          >
            <FiFileText size={14} /> CSV (.csv)
          </button>
          <button
            className="btn btn-outline"
            onClick={() => window.print()}
            style={{ gap: 6 }}
          >
            <FiPrinter size={14} /> PDF / Imprimer
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleExportJSON}
            style={{ gap: 6 }}
          >
            <FiCode size={14} /> JSON
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleCopySummary}
            style={{ gap: 6 }}
          >
            <FiCopy size={14} /> Copier (WhatsApp / Email)
          </button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-value" style={{ color: '#27ae60' }}>{formatFDJ(summary.totalRevenue)}</div>
          <div className="kpi-label">Encaissements totaux</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{formatFDJ(summary.totalSales)}</div>
          <div className="kpi-label">Chiffre d'affaires</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value" style={{ color: '#e74c3c' }}>{formatFDJ(summary.totalCreditCreated)}</div>
          <div className="kpi-label">Créances générées</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value" style={{ color: '#e74c3c' }}>{formatFDJ(summary.totalExpenses)}</div>
          <div className="kpi-label">Dépenses approuvées</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value" style={{ color: '#8e44ad' }}>{formatFDJ(summary.netProfit)}</div>
          <div className="kpi-label">Bénéfice net estimé</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{summary.invoicesCount}</div>
          <div className="kpi-label">Ventes ({period === 'day' ? 'jour' : 'mois'})</div>
        </div>
      </div>

      {/* Payments & Expenses */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <div className="grispella-card">
          <h3>Encaissements par mode de paiement</h3>
          <table className="grispella-table">
            <thead>
              <tr><th>Mode</th><th>Montant</th><th>%</th></tr>
            </thead>
            <tbody>
              {allPaymentMethods.map((m) => {
                const amt = paymentBreakdown?.[m] || 0;
                return (
                  <tr key={m}>
                    <td>{m}</td>
                    <td><strong>{formatFDJ(amt)}</strong></td>
                    <td style={{ color: '#888' }}>
                      {summary.totalRevenue > 0 ? Math.round((amt / summary.totalRevenue) * 100) : 0}%
                    </td>
                  </tr>
                );
              })}
              <tr style={{ borderTop: '2px solid var(--border)' }}>
                <td><strong>TOTAL</strong></td>
                <td><strong>{formatFDJ(summary.totalRevenue)}</strong></td>
                <td>100%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grispella-card">
          <h3>Dépenses par catégorie</h3>
          {periodExpenses.length === 0 ? (
            <p style={{ color: '#888' }}>Aucune dépense approuvée</p>
          ) : (
            <table className="grispella-table">
              <thead>
                <tr><th>Catégorie</th><th>Montant</th></tr>
              </thead>
              <tbody>
                {Object.entries(
                  periodExpenses.reduce((acc, e) => ({ ...acc, [e.category]: (acc[e.category] || 0) + (e.amount || 0) }), {})
                )
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, amt]) => (
                    <tr key={cat}>
                      <td>{cat}</td>
                      <td><strong>{formatFDJ(amt)}</strong></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Daily Invoices Table */}
      <div className="grispella-card">
        <h3>Détail des ventes ({periodInvoices.length})</h3>
        {periodInvoices.length === 0 ? (
          <p style={{ color: '#888' }}>Aucune vente enregistrée pour cette période</p>
        ) : (
          <table className="grispella-table">
            <thead>
              <tr>
                <th>N° Facture</th>
                <th>Heure</th>
                <th>Client</th>
                <th>Total</th>
                <th>Payé</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {periodInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td><code>{inv.id}</code></td>
                  <td>{inv.date ? new Date(inv.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td>{inv.customerName || 'Client'}</td>
                  <td><strong>{formatFDJ(inv.total)}</strong></td>
                  <td>{formatFDJ(inv.paidAmount)}</td>
                  <td>
                    <span className={`badge ${inv.status === 'PAYÉ' ? 'badge-success' : inv.status === 'PARTIEL' ? 'badge-warning' : 'badge-danger'}`}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Margin table */}
      <div className="grispella-card">
        <h3>Marges par produit</h3>
        {margins.length === 0 ? (
          <p style={{ color: '#888' }}>Aucune vente pour cette période</p>
        ) : (
          <table className="grispella-table">
            <thead>
              <tr><th>Produit</th><th>Qté vendue</th><th>CA</th><th>Coût</th><th>Marge</th><th>% Marge</th></tr>
            </thead>
            <tbody>
              {margins.map((d) => (
                <tr key={d.productName}>
                  <td>{d.productName}</td>
                  <td>{d.qty}</td>
                  <td>{formatFDJ(d.revenue)}</td>
                  <td>{formatFDJ(d.cost)}</td>
                  <td style={{ color: d.margin >= 0 ? '#27ae60' : '#e74c3c', fontWeight: 600 }}>
                    {formatFDJ(d.margin)}
                  </td>
                  <td style={{ color: '#666' }}>
                    {d.revenue > 0 ? Math.round((d.margin / d.revenue) * 100) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Stock Movements of the period */}
      <div className="grispella-card">
        <h3>Mouvements de stock ({periodMovements.length})</h3>
        {periodMovements.length === 0 ? (
          <p style={{ color: '#888' }}>Aucun mouvement de stock pour cette période</p>
        ) : (
          <table className="grispella-table">
            <thead>
              <tr><th>Type</th><th>Produit</th><th>Dépôt</th><th>Quantité</th><th>Référence</th><th>Motif</th></tr>
            </thead>
            <tbody>
              {periodMovements.slice(0, 50).map((m) => (
                <tr key={m.id}>
                  <td><strong>{m.type}</strong></td>
                  <td>{m.productName}</td>
                  <td>{m.depotId}</td>
                  <td style={{ color: m.quantity >= 0 ? '#27ae60' : '#e74c3c', fontWeight: 700 }}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity} {m.unit}
                  </td>
                  <td><code>{m.documentRef || '—'}</code></td>
                  <td style={{ color: 'var(--text-muted)' }}>{m.reason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Stock valuation */}
      <div className="grispella-card">
        <h3>Valorisation du stock actuel: <strong style={{ color: '#1a5c2e' }}>{formatFDJ(summary.stockValue)}</strong></h3>
        <table className="grispella-table">
          <thead><tr><th>Produit</th><th>Stock total</th><th>Coût unitaire</th><th>Valeur</th></tr></thead>
          <tbody>
            {products
              .filter((p) => Object.values(p.stockByDepot || {}).reduce((s, d) => s + (d.physical || 0), 0) > 0)
              .map((p) => {
                const qty = Object.values(p.stockByDepot || {}).reduce((s, d) => s + (d.physical || 0), 0);
                return (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{qty}</td>
                    <td>{formatFDJ(p.purchasePrice || 0)}</td>
                    <td><strong>{formatFDJ(qty * (p.purchasePrice || 0))}</strong></td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

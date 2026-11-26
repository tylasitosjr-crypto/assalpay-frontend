import React, { useState } from 'react';
import { useGrispella } from '../context/GrispellaContext';
import { toast } from 'react-toastify';

const PAYMENT_METHODS = ['Cash', 'Waafi', 'CAC', 'Saba', 'Exim Bank'];

export default function CashRegister() {
  const { state, dispatch, formatFDJ } = useGrispella();
  const { cashSessions = [], invoices = [], creditPayments = [], expenses = [], currentUser } = state || {};

  const activeSession = cashSessions?.find(s => s.status === 'OUVERT' && s.userId === currentUser?.id);
  const [openAmount, setOpenAmount] = useState('');
  const [countForm, setCountForm] = useState({ Cash: '', Waafi: '', CAC: '', Saba: '', 'Exim Bank': '' });
  const [showClose, setShowClose] = useState(false);

  // Calculate expected amounts from invoices during session
  const sessionInvoices = activeSession
    ? invoices.filter(i => i.sessionId === activeSession.id && i.status !== 'ANNULÉ')
    : [];

  const sessionCreditPayments = activeSession
    ? (creditPayments || []).filter(p => p.sessionId === activeSession.id)
    : [];

  const sessionExpenses = activeSession
    ? (expenses || []).filter(e => e.sessionId === activeSession.id)
    : [];

  const expectedByMethod = {};
  PAYMENT_METHODS.forEach(m => {
    let total = 0;
    sessionInvoices.forEach(inv => {
      (inv.payments || []).filter(p => p.method === m).forEach(p => { total += p.amount; });
    });
    sessionCreditPayments.filter(p => p.method === m).forEach(p => { total += p.amount; });
    sessionExpenses.filter(e => e.paymentMethod === m).forEach(e => { total -= e.amount; });
    expectedByMethod[m] = total;
  });

  const totalExpected = Object.values(expectedByMethod).reduce((s, v) => s + v, 0);
  const totalCounted = Object.values(countForm).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const ecart = totalCounted - (parseFloat(openAmount || activeSession?.openAmount) || 0) - totalExpected;

  const handleOpen = () => {
    if (!openAmount || parseFloat(openAmount) < 0) { toast.error('Montant d\'ouverture requis'); return; }
    dispatch({
      type: 'OPEN_SESSION',
      payload: {
        id: `SES-${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        openAmount: parseFloat(openAmount),
        openedAt: new Date().toISOString(),
        status: 'OUVERT',
        depotId: state.currentDepot,
      }
    });
    toast.success('Session ouverte');
    setOpenAmount('');
  };

  const handleClose = () => {
    dispatch({
      type: 'CLOSE_SESSION',
      payload: {
        sessionId: activeSession.id,
        countedAmounts: countForm,
        expectedAmounts: expectedByMethod,
        ecart,
        closedAt: new Date().toISOString(),
        userId: currentUser.id,
      }
    });
    toast.success('Session clôturée');
    setShowClose(false);
  };

  const pastSessions = (cashSessions || [])
    .filter(s => s.status === 'FERMÉ')
    .sort((a, b) => new Date(b.closedAt) - new Date(a.closedAt))
    .slice(0, 10);

  return (
    <div className="grispella-page">
      <div className="page-header">
        <h1>🏧 Caisse</h1>
        <div className="page-header-stats">
          <span className={`status-tag ${activeSession ? 'status-green' : 'status-red'}`}>
            {activeSession ? '● SESSION OUVERTE' : '○ CAISSE FERMÉE'}
          </span>
        </div>
      </div>

      {!activeSession ? (
        /* Open Session */
        <div className="grispella-card" style={{ maxWidth: 480, margin: '0 auto' }}>
          <h2 style={{ marginTop: 0 }}>Ouvrir une session de caisse</h2>
          <p style={{ color: '#666' }}>Saisissez le montant en espèces présent dans la caisse au début de la journée.</p>
          <div className="form-group">
            <label>Fonds de caisse initial (FDJ)</label>
            <input
              type="number"
              className="form-input"
              placeholder="Ex: 50 000"
              value={openAmount}
              onChange={e => setOpenAmount(e.target.value)}
              style={{ fontSize: '1.2rem' }}
            />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', padding: '12px' }} onClick={handleOpen}>
            🔓 Ouvrir la caisse
          </button>
        </div>
      ) : (
        <>
          {/* Active Session Summary */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-value">{formatFDJ(activeSession.openAmount)}</div>
              <div className="kpi-label">Fonds d'ouverture</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value" style={{ color: '#27ae60' }}>{formatFDJ(totalExpected)}</div>
              <div className="kpi-label">Recettes nettes attendues</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value">{sessionInvoices.length}</div>
              <div className="kpi-label">Ventes effectuées</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value" style={{ color: '#e74c3c' }}>
                {formatFDJ(sessionExpenses.reduce((s, e) => s + e.amount, 0))}
              </div>
              <div className="kpi-label">Dépenses</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* By payment method */}
            <div className="grispella-card">
              <h3 style={{ marginTop: 0 }}>Recettes par mode de paiement</h3>
              <table className="grispella-table">
                <thead><tr><th>Mode</th><th>Montant attendu</th></tr></thead>
                <tbody>
                  {PAYMENT_METHODS.map(m => (
                    <tr key={m}>
                      <td>{m}</td>
                      <td><strong>{formatFDJ(expectedByMethod[m] || 0)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Recent invoices */}
            <div className="grispella-card">
              <h3 style={{ marginTop: 0 }}>Dernières ventes ({sessionInvoices.length})</h3>
              <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                {sessionInvoices.slice(0, 15).map(inv => (
                  <div key={inv.id} className="invoice-mini-card">
                    <code style={{ fontSize: '0.75rem' }}>{inv.id}</code>
                    <strong>{formatFDJ(inv.total)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grispella-card" style={{ marginTop: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, color: '#666' }}>Session ouverte par <strong>{activeSession.userName}</strong> le {new Date(activeSession.openedAt).toLocaleString('fr-FR')}</p>
              </div>
              <button className="btn btn-danger" onClick={() => setShowClose(true)}>🔒 Clôturer la session</button>
            </div>
          </div>
        </>
      )}

      {/* Close Session Modal */}
      {showClose && activeSession && (
        <div className="detail-modal-overlay" onClick={() => setShowClose(false)}>
          <div className="detail-modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="detail-modal-header">
              <h2>🔒 Clôture de session</h2>
              <button className="btn btn-secondary" onClick={() => setShowClose(false)}>✕</button>
            </div>
            <p style={{ color: '#666' }}>Comptez les espèces et saisissez les montants réels par mode de paiement.</p>
            <table className="grispella-table">
              <thead>
                <tr><th>Mode</th><th>Attendu</th><th>Compté</th><th>Écart</th></tr>
              </thead>
              <tbody>
                {PAYMENT_METHODS.map(m => {
                  const expected = expectedByMethod[m] || 0;
                  const counted = parseFloat(countForm[m]) || 0;
                  const diff = counted - expected;
                  return (
                    <tr key={m}>
                      <td>{m}</td>
                      <td>{formatFDJ(expected)}</td>
                      <td>
                        <input type="number" className="form-input" style={{ padding: '4px 8px', width: 100 }}
                          value={countForm[m]} onChange={e => setCountForm(f => ({ ...f, [m]: e.target.value }))} />
                      </td>
                      <td style={{ color: diff === 0 ? '#27ae60' : diff > 0 ? '#3498db' : '#e74c3c', fontWeight: 600 }}>
                        {diff >= 0 ? '+' : ''}{formatFDJ(diff)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td><strong>TOTAL</strong></td>
                  <td><strong>{formatFDJ(totalExpected)}</strong></td>
                  <td><strong>{formatFDJ(totalCounted)}</strong></td>
                  <td style={{ color: ecart === 0 ? '#27ae60' : '#e74c3c', fontWeight: 700 }}>
                    {ecart >= 0 ? '+' : ''}{formatFDJ(ecart)}
                  </td>
                </tr>
              </tfoot>
            </table>
            <div className="detail-actions">
              <button className="btn btn-danger" onClick={handleClose}>✅ Confirmer la clôture</button>
              <button className="btn btn-secondary" onClick={() => setShowClose(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Past Sessions */}
      {pastSessions.length > 0 && (
        <div className="grispella-card">
          <h3>Historique des sessions</h3>
          <table className="grispella-table">
            <thead>
              <tr><th>Date ouverture</th><th>Caissier</th><th>Fonds initial</th><th>Recettes</th><th>Écart</th><th>Fermé le</th></tr>
            </thead>
            <tbody>
              {pastSessions.map(s => (
                <tr key={s.id}>
                  <td>{new Date(s.openedAt).toLocaleDateString('fr-FR')}</td>
                  <td>{s.userName}</td>
                  <td>{formatFDJ(s.openAmount)}</td>
                  <td>{formatFDJ(s.totalRevenue || 0)}</td>
                  <td style={{ color: (s.ecart || 0) === 0 ? '#27ae60' : '#e74c3c', fontWeight: 600 }}>
                    {(s.ecart || 0) >= 0 ? '+' : ''}{formatFDJ(s.ecart || 0)}
                  </td>
                  <td>{s.closedAt ? new Date(s.closedAt).toLocaleDateString('fr-FR') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

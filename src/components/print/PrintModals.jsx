import React from "react";
import { useGrispella } from "../../context/GrispellaContext.jsx";
import { FiPrinter, FiX, FiCheckCircle } from "react-icons/fi";

// Modal wrapper
export function PrintModalWrapper({ title, onClose, children }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="print-modal-backdrop">
      <div className="print-modal-container">
        <div className="print-modal-header no-print">
          <h3>{title}</h3>
          <div className="print-actions">
            <button className="btn-print-primary" onClick={handlePrint}>
              <FiPrinter /> Imprimer le Document
            </button>
            <button className="btn-close-modal" onClick={onClose}>
              <FiX />
            </button>
          </div>
        </div>
        <div className="print-modal-body">{children}</div>
      </div>
    </div>
  );
}

// Facture Format A4
export function FactureA4({ invoice }) {
  const { COMPANY, formatFDJ } = useGrispella();
  if (!invoice) return null;

  return (
    <div className="printable-a4-invoice">
      <div className="invoice-header">
        <div className="company-info">
          <h2>{COMPANY.name}</h2>
          <p className="subtitle">{COMPANY.subtitle}</p>
          <p>{COMPANY.address}</p>
          <p>Tél : {COMPANY.phone} | Email : {COMPANY.email}</p>
          <p>NIF : <strong>{COMPANY.nif}</strong> | RC : <strong>{COMPANY.rc}</strong></p>
        </div>
        <div className="invoice-meta-box">
          <div className="invoice-tag">FACTURE DE VENTE</div>
          <div className="meta-row">
            <span>N° Facture :</span>
            <strong>{invoice.id}</strong>
          </div>
          <div className="meta-row">
            <span>Date :</span>
            <span>{new Date(invoice.createdAt).toLocaleDateString("fr-FR")} {new Date(invoice.createdAt).toLocaleTimeString("fr-FR")}</span>
          </div>
          <div className="meta-row">
            <span>Caissier :</span>
            <span>{invoice.cashier}</span>
          </div>
          <div className="meta-row">
            <span>Dépôt :</span>
            <span>{invoice.depotId}</span>
          </div>
        </div>
      </div>

      <div className="invoice-client-section">
        <div className="client-box">
          <span className="section-label">FACTURÉ À :</span>
          <h4>{invoice.customerName}</h4>
          <p>ID Client : {invoice.customerId}</p>
        </div>
        <div className="status-box">
          <span className="section-label">STATUT RÈGLEMENT :</span>
          <div className={`status-badge ${invoice.status?.toLowerCase()}`}>
            {invoice.status}
          </div>
        </div>
      </div>

      <table className="invoice-items-table">
        <thead>
          <tr>
            <th>Réf / Article</th>
            <th>Unité</th>
            <th className="text-center">Quantité</th>
            <th className="text-right">Prix Unitaire</th>
            <th className="text-right">Total (FDJ)</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items?.map((item, idx) => (
            <tr key={idx}>
              <td>
                <strong>{item.productName}</strong>
                {item.unitFactor > 1 && (
                  <span className="unit-desc"> (Facteur: 1 {item.unit} = {item.unitFactor} pièces)</span>
                )}
              </td>
              <td>{item.unit}</td>
              <td className="text-center">{item.quantity}</td>
              <td className="text-right">{formatFDJ(item.unitPrice)}</td>
              <td className="text-right font-bold">{formatFDJ(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="invoice-totals-section">
        <div className="payment-breakdown">
          <h5>Modes de Règlement enregistrés :</h5>
          <ul>
            {invoice.payments?.map((p, idx) => (
              <li key={idx}>
                <span>{p.method?.toUpperCase()} {p.ref ? `(${p.ref})` : ""} :</span>
                <strong>{formatFDJ(p.amount)}</strong>
              </li>
            ))}
          </ul>
        </div>
        <div className="totals-box">
          <div className="total-row">
            <span>Sous-Total Brut :</span>
            <span>{formatFDJ(invoice.subtotal)}</span>
          </div>
          {invoice.discount > 0 && (
            <div className="total-row discount">
              <span>Remise Accordée :</span>
              <span>- {formatFDJ(invoice.discount)}</span>
            </div>
          )}
          <div className="total-row net">
            <span>Net à Payer (FDJ) :</span>
            <strong>{formatFDJ(invoice.totalAmount)}</strong>
          </div>
          <div className="total-row paid">
            <span>Montant Encaissé :</span>
            <span>{formatFDJ(invoice.amountPaid)}</span>
          </div>
          <div className={`total-row due ${invoice.amountDue > 0 ? "has-debt" : ""}`}>
            <span>Reste Dû (Crédit) :</span>
            <strong>{formatFDJ(invoice.amountDue)}</strong>
          </div>
        </div>
      </div>

      <div className="invoice-footer">
        <div className="signatures">
          <div>
            <p>Visa Caissier / Vendeur</p>
            <div className="sign-box"></div>
          </div>
          <div>
            <p>Signature & Cachet Client</p>
            <div className="sign-box"></div>
          </div>
        </div>
        <p className="notice">
          Les marchandises vendues ne sont ni reprises ni échangées après sortie de magasin.
          Merci pour votre confiance.
        </p>
      </div>
    </div>
  );
}

// Ticket de caisse 80mm
export function TicketCaisse({ invoice }) {
  const { COMPANY, formatFDJ } = useGrispella();
  if (!invoice) return null;

  return (
    <div className="printable-ticket-80mm">
      <div className="ticket-header text-center">
        <h3>{COMPANY.name}</h3>
        <p>{COMPANY.address}</p>
        <p>Tél: {COMPANY.phone}</p>
        <hr className="ticket-divider" />
        <p><strong>TICKET DE CAISSE</strong></p>
        <p>Facture N° : {invoice.id}</p>
        <p>Date : {new Date(invoice.createdAt).toLocaleDateString("fr-FR")} {new Date(invoice.createdAt).toLocaleTimeString("fr-FR")}</p>
        <p>Client : {invoice.customerName}</p>
        <p>Caissier : {invoice.cashier}</p>
        <hr className="ticket-divider" />
      </div>

      <div className="ticket-items">
        {invoice.items?.map((it, idx) => (
          <div key={idx} className="ticket-item-row">
            <div className="item-title">{it.productName}</div>
            <div className="item-details">
              <span>{it.quantity} x {it.unit} @ {formatFDJ(it.unitPrice)}</span>
              <strong>{formatFDJ(it.total)}</strong>
            </div>
          </div>
        ))}
      </div>

      <hr className="ticket-divider" />

      <div className="ticket-totals">
        <div className="t-row">
          <span>Sous-total :</span>
          <span>{formatFDJ(invoice.subtotal)}</span>
        </div>
        {invoice.discount > 0 && (
          <div className="t-row">
            <span>Remise :</span>
            <span>-{formatFDJ(invoice.discount)}</span>
          </div>
        )}
        <div className="t-row t-total">
          <span>TOTAL :</span>
          <strong>{formatFDJ(invoice.totalAmount)}</strong>
        </div>
        <div className="t-row">
          <span>Payé :</span>
          <span>{formatFDJ(invoice.amountPaid)}</span>
        </div>
        {invoice.amountDue > 0 && (
          <div className="t-row t-due">
            <span>Reste Dû :</span>
            <strong>{formatFDJ(invoice.amountDue)}</strong>
          </div>
        )}
      </div>

      <hr className="ticket-divider" />

      <div className="ticket-payments">
        <p><strong>Règlements :</strong></p>
        {invoice.payments?.map((p, idx) => (
          <p key={idx}>
            {p.method?.toUpperCase()} : {formatFDJ(p.amount)}
          </p>
        ))}
      </div>

      <div className="ticket-footer text-center">
        <p>Statut : <strong>{invoice.status}</strong></p>
        <p>*** Merci de votre visite ***</p>
      </div>
    </div>
  );
}

// Reçu d'encaissement crédit
export function RecuCredit({ payment }) {
  const { COMPANY, formatFDJ } = useGrispella();
  if (!payment) return null;

  return (
    <div className="printable-receipt">
      <div className="receipt-header text-center">
        <h2>{COMPANY.name}</h2>
        <p>{COMPANY.address} · Tél: {COMPANY.phone}</p>
        <div className="receipt-badge">REÇU D'ENCAISSEMENT CRÉDIT CLIENT</div>
      </div>
      <div className="receipt-details">
        <div className="meta-row"><span>N° Reçu :</span><strong>{payment.id}</strong></div>
        <div className="meta-row"><span>Date :</span><span>{new Date(payment.createdAt).toLocaleDateString("fr-FR")} {new Date(payment.createdAt).toLocaleTimeString("fr-FR")}</span></div>
        <div className="meta-row"><span>Client Débiteur :</span><strong>{payment.customerName}</strong></div>
        <div className="meta-row"><span>Montant Encaissé :</span><h3 className="amount-highlight">{formatFDJ(payment.amount)}</h3></div>
        <div className="meta-row"><span>Moyen de Règlement :</span><span>{payment.method?.toUpperCase()} ({payment.ref})</span></div>
        <div className="meta-row"><span>Encaissé par :</span><span>{payment.collectedBy}</span></div>
        <div className="meta-row"><span>Motif / Note :</span><span>{payment.notes}</span></div>
      </div>
      <div className="receipt-signatures">
        <div><p>Signature Client</p><div className="sign-box"></div></div>
        <div><p>Signature Caissier / Recouvreur</p><div className="sign-box"></div></div>
      </div>
    </div>
  );
}

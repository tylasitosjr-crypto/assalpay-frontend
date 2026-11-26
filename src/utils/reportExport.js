import * as XLSX from "xlsx";

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeCsvCell(val) {
  const str = String(val ?? "");
  if (/[;"\n\r,]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Export full multi-sheet Excel (.xlsx) workbook for daily/monthly report
 */
export function exportReportToExcel(report) {
  const wb = XLSX.utils.book_new();
  const label = report.periodLabel || report.date;

  // Sheet 1: Résumé
  const summaryRows = [
    ["GRISPELLA GENERAL TRADING SARL — RAPPORT D'ACTIVITÉ"],
    ["Période", label],
    ["Généré le", new Date().toLocaleString("fr-FR")],
    [],
    ["INDICATEUR", "VALEUR (FDJ)"],
    ["Chiffre d'affaires (Factures)", report.summary.totalSales],
    ["Total Encaissements (Ventes + Crédits)", report.summary.totalRevenue],
    ["Créances générées", report.summary.totalCreditCreated],
    ["Crédits encaissés", report.summary.totalCreditCollected],
    ["Dépenses approuvées", report.summary.totalExpenses],
    ["Bénéfice net estimé", report.summary.netProfit],
    ["Nombre de ventes", report.summary.invoicesCount],
    ["Mouvements de stock", report.summary.movementsCount],
    ["Valorisation stock actuel", report.summary.stockValue],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary["!cols"] = [{ wch: 38 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Résumé");

  // Sheet 2: Encaissements par mode de paiement
  const totalRev = report.summary.totalRevenue || 0;
  const paymentRows = [
    ["Mode de paiement", "Montant (FDJ)", "Part (%)"],
    ...Object.entries(report.paymentBreakdown || {}).map(([method, amount]) => [
      method,
      amount,
      totalRev > 0 ? Math.round((amount / totalRev) * 100) : 0,
    ]),
    ["TOTAL", totalRev, totalRev > 0 ? 100 : 0],
  ];
  const wsPayments = XLSX.utils.aoa_to_sheet(paymentRows);
  wsPayments["!cols"] = [{ wch: 24 }, { wch: 18 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsPayments, "Paiements");

  // Sheet 3: Détail des Factures / Ventes
  const invoiceRows = [
    ["N° Facture", "Date / Heure", "Client", "Dépôt", "Sous-total", "Remise", "Total", "Payé", "Reste (Crédit)", "Statut", "Modes de paiement"],
    ...(report.invoices || []).map((inv) => [
      inv.id,
      inv.date ? new Date(inv.date).toLocaleString("fr-FR") : "",
      inv.customerName || "Client",
      inv.depotId || "",
      inv.subtotal || 0,
      inv.discount || 0,
      inv.total || 0,
      inv.paidAmount || 0,
      Math.max(0, (inv.total || 0) - (inv.paidAmount || 0)),
      inv.status || "",
      (inv.payments || []).map((p) => `${p.method}: ${p.amount}`).join(" | "),
    ]),
  ];
  const wsInvoices = XLSX.utils.aoa_to_sheet(invoiceRows);
  wsInvoices["!cols"] = [
    { wch: 18 }, { wch: 20 }, { wch: 24 }, { wch: 10 },
    { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 14 },
    { wch: 14 }, { wch: 12 }, { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, wsInvoices, "Ventes");

  // Sheet 4: Marges par Produit
  const marginRows = [
    ["Produit", "Quantité vendue", "CA (FDJ)", "Coût estimé (FDJ)", "Marge (FDJ)", "Marge (%)"],
    ...(report.margins || []).map((m) => [
      m.productName,
      m.qty,
      m.revenue,
      m.cost,
      m.margin,
      m.revenue > 0 ? Math.round((m.margin / m.revenue) * 100) : 0,
    ]),
  ];
  const wsMargins = XLSX.utils.aoa_to_sheet(marginRows);
  wsMargins["!cols"] = [{ wch: 32 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsMargins, "Marges");

  // Sheet 5: Dépenses
  const expenseRows = [
    ["ID", "Date", "Catégorie", "Bénéficiaire", "Mode", "Montant (FDJ)", "Description", "Statut"],
    ...(report.expenses || []).map((e) => [
      e.id,
      e.date ? new Date(e.date).toLocaleString("fr-FR") : "",
      e.category || "",
      e.beneficiary || "",
      e.paymentMethod || "",
      e.amount || 0,
      e.description || "",
      e.approvalStatus || "",
    ]),
  ];
  const wsExpenses = XLSX.utils.aoa_to_sheet(expenseRows);
  wsExpenses["!cols"] = [
    { wch: 16 }, { wch: 20 }, { wch: 18 }, { wch: 22 },
    { wch: 14 }, { wch: 16 }, { wch: 30 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsExpenses, "Dépenses");

  // Sheet 6: Mouvements de Stock
  const mvtRows = [
    ["ID", "Date", "Type", "Produit", "Dépôt", "Quantité", "Unité", "Référence", "Utilisateur", "Motif"],
    ...(report.movements || []).map((m) => [
      m.id,
      m.date ? new Date(m.date).toLocaleString("fr-FR") : "",
      m.type || "",
      m.productName || "",
      m.depotId || "",
      m.quantity || 0,
      m.unit || "",
      m.documentRef || "",
      m.userName || "",
      m.reason || "",
    ]),
  ];
  const wsMvts = XLSX.utils.aoa_to_sheet(mvtRows);
  wsMvts["!cols"] = [
    { wch: 18 }, { wch: 20 }, { wch: 12 }, { wch: 28 }, { wch: 10 },
    { wch: 12 }, { wch: 10 }, { wch: 18 }, { wch: 20 }, { wch: 26 },
  ];
  XLSX.utils.book_append_sheet(wb, wsMvts, "Mouvements Stock");

  XLSX.writeFile(wb, `Grispella_Rapport_${label}.xlsx`);
}

/**
 * Export complete daily/monthly report to UTF-8 BOM CSV (.csv)
 */
export function exportReportToCSV(report) {
  const label = report.periodLabel || report.date;
  const lines = [];

  lines.push(["GRISPELLA GENERAL TRADING SARL - RAPPORT", label].map(escapeCsvCell).join(";"));
  lines.push("");
  lines.push(["SECTION: RESUME", "Valeur (FDJ)"].map(escapeCsvCell).join(";"));
  lines.push(["Chiffre d'affaires", report.summary.totalSales].map(escapeCsvCell).join(";"));
  lines.push(["Encaissements totaux", report.summary.totalRevenue].map(escapeCsvCell).join(";"));
  lines.push(["Creances generees", report.summary.totalCreditCreated].map(escapeCsvCell).join(";"));
  lines.push(["Credits encaisses", report.summary.totalCreditCollected].map(escapeCsvCell).join(";"));
  lines.push(["Depenses approuvees", report.summary.totalExpenses].map(escapeCsvCell).join(";"));
  lines.push(["Benefice net estime", report.summary.netProfit].map(escapeCsvCell).join(";"));
  lines.push(["Nombre de ventes", report.summary.invoicesCount].map(escapeCsvCell).join(";"));
  lines.push("");

  lines.push(["SECTION: MODES DE PAIEMENT", "Montant (FDJ)"].map(escapeCsvCell).join(";"));
  Object.entries(report.paymentBreakdown || {}).forEach(([method, amount]) => {
    lines.push([method, amount].map(escapeCsvCell).join(";"));
  });
  lines.push("");

  lines.push(["SECTION: VENTES / FACTURES", "Date", "Client", "Total", "Paye", "Statut"].map(escapeCsvCell).join(";"));
  (report.invoices || []).forEach((inv) => {
    lines.push([
      inv.id,
      inv.date ? new Date(inv.date).toLocaleString("fr-FR") : "",
      inv.customerName || "",
      inv.total || 0,
      inv.paidAmount || 0,
      inv.status || "",
    ].map(escapeCsvCell).join(";"));
  });
  lines.push("");

  lines.push(["SECTION: DEPENSES", "Date", "Categorie", "Beneficiaire", "Montant", "Description"].map(escapeCsvCell).join(";"));
  (report.expenses || []).forEach((e) => {
    lines.push([
      e.id,
      e.date ? new Date(e.date).toLocaleString("fr-FR") : "",
      e.category || "",
      e.beneficiary || "",
      e.amount || 0,
      e.description || "",
    ].map(escapeCsvCell).join(";"));
  });

  const csvContent = "\uFEFF" + lines.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `Grispella_Rapport_${label}.csv`);
}

/**
 * Export structured JSON (.json)
 */
export function exportReportToJSON(report) {
  const label = report.periodLabel || report.date;
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json;charset=utf-8;" });
  triggerDownload(blob, `Grispella_Rapport_${label}.json`);
}

/**
 * Build a clean text summary for WhatsApp / Email / SMS sharing
 */
export function buildShareableText(report, formatFDJ) {
  const label = report.periodLabel || report.date;
  const s = report.summary;
  const paymentsLines = Object.entries(report.paymentBreakdown || {})
    .filter(([, amt]) => amt > 0)
    .map(([m, amt]) => `  • ${m}: ${formatFDJ(amt)}`)
    .join("\n");

  return [
    `📊 *RAPPORT GRISPELLA — ${label}*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `💰 Chiffre d'affaires : ${formatFDJ(s.totalSales)}`,
    `✅ Encaissements : ${formatFDJ(s.totalRevenue)}`,
    `⚠️ Créances générées : ${formatFDJ(s.totalCreditCreated)}`,
    `💸 Dépenses approuvées : ${formatFDJ(s.totalExpenses)}`,
    `📈 Bénéfice net estimé : ${formatFDJ(s.netProfit)}`,
    `🧾 Ventes : ${s.invoicesCount} | 📦 Mouvements : ${s.movementsCount}`,
    paymentsLines ? `\n💳 *Par mode de paiement :*\n${paymentsLines}` : "",
    `\n🏭 Valeur stock actuel : ${formatFDJ(s.stockValue)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

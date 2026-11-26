import React, { createContext, useContext, useReducer, useEffect } from "react";
import grispellaApi from "../api/grispellaApi.js";
import {
  COMPANY,
  DEPOTS,
  PAYMENT_METHODS,
  ROLES,
  STAFF_USERS,
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_SUPPLIERS,
} from "../constants/grispella.js";

const GrispellaContext = createContext(null);

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatFDJ = (amount) => {
  const val = Number(amount) || 0;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "DJF",
    maximumFractionDigits: 0,
  })
    .format(val)
    .replace("DJF", "FDJ");
};

// ── Initial State ─────────────────────────────────────────────────────────────
const SAMPLE_INVOICES = [
  {
    id: "FACT-2026-0001",
    date: new Date(Date.now() - 3600000 * 4).toISOString(),
    customerId: "CLI-001",
    customerName: "Supermarché Al-Baraka",
    depotId: "DEP-01",
    items: [
      { productId: "prod-1", productName: "Huile Végétale Raffinée 5L", unit: "carton", unitFactor: 4, quantity: 10, unitPrice: 9600 },
      { productId: "prod-2", productName: "Riz Basmati Super Qualité 25kg", unit: "sac", unitFactor: 1, quantity: 15, unitPrice: 7800 },
    ],
    subtotal: 213000, discount: 3000, total: 210000,
    payments: [{ method: "Waafi", amount: 150000 }, { method: "Cash", amount: 35000 }],
    paidAmount: 185000, status: "PARTIEL",
  },
  {
    id: "FACT-2026-0002",
    date: new Date(Date.now() - 3600000 * 2).toISOString(),
    customerId: "CLI-000",
    customerName: "Client Comptoir",
    depotId: "DEP-03",
    items: [{ productId: "prod-4", productName: "Pâtes Alimentaires 500g", unit: "carton", unitFactor: 24, quantity: 5, unitPrice: 4800 }],
    subtotal: 24000, discount: 0, total: 24000,
    payments: [{ method: "Cash", amount: 24000 }],
    paidAmount: 24000, status: "PAYÉ",
  },
];

const SAMPLE_MOVEMENTS = [
  {
    id: "MVT-0001", date: new Date(Date.now() - 86400000).toISOString(),
    type: "IN", productId: "prod-1", productName: "Huile Végétale Raffinée 5L",
    depotId: "DEP-01", quantity: 160, unit: "pièce", documentRef: "REC-2026-001",
    lot: "LOT-2026-A1", userName: "Responsable Stock", reason: "Réception conteneur",
  },
  {
    id: "MVT-0002", date: new Date(Date.now() - 3600000 * 4).toISOString(),
    type: "OUT", productId: "prod-1", productName: "Huile Végétale Raffinée 5L",
    depotId: "DEP-01", quantity: 40, unit: "pièce", documentRef: "FACT-2026-0001",
    userName: "Caisse", reason: "Vente",
  },
];

const SAMPLE_RECEIPTS = [
  {
    id: "REC-2026-001", createdAt: new Date(Date.now() - 86400000).toISOString(),
    supplierId: "FOU-001", depotId: "DEP-01", invoiceRef: "INV-DXB-9982",
    status: "VALIDÉ", totalCost: 1250000,
    items: [{ productId: "prod-1", productName: "Huile Végétale Raffinée 5L", quantity: 200, unit: "pièce", costPrice: 2100, lot: "LOT-2026-A1", expiryDate: "2027-12-31" }],
  },
];

const SAMPLE_DELIVERIES = [
  {
    id: "BL-2026-001", createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    invoiceId: "FACT-2026-0001", customerId: "CLI-001", depotId: "DEP-01",
    driver: "Hassan Liban", status: "LIVRÉ",
    items: [{ productName: "Huile Végétale 5L", quantity: 10, unit: "carton" }],
  },
];

const SAMPLE_EXPENSES = [
  {
    id: "EXP-001", date: new Date(Date.now() - 3600000 * 5).toISOString(),
    category: "Transport", beneficiary: "Équipe Déchargeurs", amount: 15000,
    paymentMethod: "Cash", description: "Déchargement conteneur",
    approvalStatus: "APPROUVÉ", createdBy: "USR-01", createdAt: new Date().toISOString(),
  },
];

const SAMPLE_AUDIT = [
  {
    id: "LOG-001", timestamp: new Date(Date.now() - 86400000).toISOString(),
    userId: "USR-01", userName: "Abdourahman Hassan (admin)",
    action: "SESSION_OPENED", details: { note: "Ouverture standard du matin" },
  },
];

function loadOrDefault(key, defaultVal) {
  try {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function buildInitialState() {
  return {
    currentUser: loadOrDefault("grispella_user", null),
    currentDepot: loadOrDefault("grispella_depot", "DEP-01"),
    depots: loadOrDefault("grispella_depots", DEPOTS),
    roles: loadOrDefault("grispella_roles", []),
    products: loadOrDefault("grispella_products", INITIAL_PRODUCTS),
    customers: loadOrDefault("grispella_customers", INITIAL_CUSTOMERS),
    suppliers: loadOrDefault("grispella_suppliers", INITIAL_SUPPLIERS),
    invoices: loadOrDefault("grispella_invoices", SAMPLE_INVOICES),
    movements: loadOrDefault("grispella_movements", SAMPLE_MOVEMENTS),
    receipts: loadOrDefault("grispella_receipts", SAMPLE_RECEIPTS),
    deliveries: loadOrDefault("grispella_deliveries", SAMPLE_DELIVERIES),
    expenses: loadOrDefault("grispella_expenses", SAMPLE_EXPENSES),
    creditPayments: loadOrDefault("grispella_credit_payments", []),
    auditLogs: loadOrDefault("grispella_audit_logs", SAMPLE_AUDIT),
    cashSessions: loadOrDefault("grispella_cash_sessions", []),
  };
}

// ── Reducer ───────────────────────────────────────────────────────────────────
function grispellaReducer(state, action) {
  const { type, payload } = action;

  switch (type) {
    // ── User / Depot / Auth ──────────────────────────────────────────────
    case "SET_USER":
    case "LOGIN":
      return { ...state, currentUser: payload };
    case "LOGOUT":
      return { ...state, currentUser: null };
    case "SET_DEPOT":
      return { ...state, currentDepot: payload };
    case "ADD_DEPOT":
      return { ...state, depots: [...(state.depots || []), payload] };
    case "REMOVE_DEPOT": {
      const remaining = (state.depots || []).filter((d) => d.id !== payload);
      const nextDepot = state.currentDepot === payload ? (remaining[0]?.id || "") : state.currentDepot;
      return { ...state, depots: remaining, currentDepot: nextDepot };
    }

    // ── Products ──────────────────────────────────────────────────────────
    case "ADD_PRODUCT":
      return { ...state, products: [payload, ...state.products] };
    case "UPDATE_PRODUCT":
      return {
        ...state,
        products: state.products.map((p) => (p.id === payload.id ? { ...p, ...payload } : p)),
      };

    // ── Customers ─────────────────────────────────────────────────────────
    case "ADD_CUSTOMER":
      return { ...state, customers: [payload, ...state.customers] };
    case "UPDATE_CUSTOMER":
      return {
        ...state,
        customers: state.customers.map((c) => (c.id === payload.id ? { ...c, ...payload } : c)),
      };

    // ── Suppliers ─────────────────────────────────────────────────────────
    case "ADD_SUPPLIER":
      return { ...state, suppliers: [payload, ...state.suppliers] };

    // ── Invoices ──────────────────────────────────────────────────────────
    case "ADD_INVOICE":
      return { ...state, invoices: [payload, ...state.invoices] };
    case "VOID_INVOICE": {
      const updated = state.invoices.map((inv) =>
        inv.id === payload.invoiceId ? { ...inv, status: "ANNULÉ", voidedBy: payload.userId, voidedAt: new Date().toISOString() } : inv
      );
      const log = {
        id: `LOG-${Date.now()}`, timestamp: new Date().toISOString(),
        userId: payload.userId, userName: state.currentUser?.name || "—",
        action: "VOID_INVOICE", details: { invoiceId: payload.invoiceId },
      };
      return { ...state, invoices: updated, auditLogs: [log, ...state.auditLogs] };
    }
    case "UPDATE_INVOICE":
      return {
        ...state,
        invoices: state.invoices.map((i) => (i.id === payload.id ? { ...i, ...payload } : i)),
      };

    // ── Stock movements ───────────────────────────────────────────────────
    case "ADD_MOVEMENT":
      return { ...state, movements: [payload, ...state.movements] };

    case "ADJUST_STOCK": {
      const { productId, depotId, quantity, type: mvtType, reason, userId, date } = payload;
      const prod = state.products.find((p) => p.id === productId);
      if (!prod) return state;
      const currentQty = (prod.stockByDepot?.[depotId]?.physical) || 0;
      const newQty = Math.max(0, currentQty + quantity);
      const updatedProducts = state.products.map((p) =>
        p.id === productId
          ? { ...p, stockByDepot: { ...p.stockByDepot, [depotId]: { ...(p.stockByDepot?.[depotId] || {}), physical: newQty } } }
          : p
      );
      const mvt = {
        id: `MVT-${Date.now()}`, date: date || new Date().toISOString(),
        type: mvtType || "ADJUSTMENT", productId, productName: prod.name, depotId,
        quantity, unit: prod.baseUnit || "pièce", documentRef: `ADJ-${Date.now()}`,
        userName: state.currentUser?.name || "—", reason,
      };
      const log = {
        id: `LOG-${Date.now()}`, timestamp: new Date().toISOString(),
        userId, userName: state.currentUser?.name || "—",
        action: "STOCK_ADJUSTED", details: { productId, depotId, quantity, reason },
      };
      return { ...state, products: updatedProducts, movements: [mvt, ...state.movements], auditLogs: [log, ...state.auditLogs] };
    }

    // ── Receipts ──────────────────────────────────────────────────────────
    case "ADD_RECEIPT":
      return { ...state, receipts: [payload, ...state.receipts] };
    case "UPDATE_RECEIPT_STATUS": {
      const { receiptId, status, userId } = payload;
      const updated = state.receipts.map((r) =>
        r.id === receiptId ? { ...r, status, updatedAt: new Date().toISOString(), updatedBy: userId } : r
      );
      return { ...state, receipts: updated };
    }
    case "VALIDATE_RECEIPT": {
      const { receiptId, userId } = payload;
      const target = state.receipts.find((r) => r.id === receiptId);
      if (!target || target.status === "VALIDÉ") return state;
      // Update products stock
      const updatedProducts = state.products.map((prod) => {
        const item = target.items?.find((i) => i.productId === prod.id);
        if (!item) return prod;
        const depotId = target.depotId;
        const currentQty = prod.stockByDepot?.[depotId]?.physical || 0;
        return {
          ...prod,
          purchasePrice: item.costPrice || prod.purchasePrice,
          stockByDepot: { ...prod.stockByDepot, [depotId]: { ...(prod.stockByDepot?.[depotId] || {}), physical: currentQty + item.quantity } },
        };
      });
      // Create movements
      const newMovements = (target.items || []).map((item) => ({
        id: `MVT-IN-${Date.now()}-${item.productId}`, date: new Date().toISOString(),
        type: "IN", productId: item.productId, productName: item.productName,
        depotId: target.depotId, quantity: item.quantity, unit: item.unit || "pièce",
        documentRef: receiptId, lot: item.lot, userName: state.currentUser?.name || "—",
        reason: `Réception fournisseur ${target.supplierId}`,
      }));
      const updatedReceipts = state.receipts.map((r) =>
        r.id === receiptId ? { ...r, status: "VALIDÉ", validatedBy: userId, validatedAt: new Date().toISOString() } : r
      );
      const log = {
        id: `LOG-${Date.now()}`, timestamp: new Date().toISOString(),
        userId, userName: state.currentUser?.name || "—",
        action: "RECEIPT_VALIDATED", details: { receiptId },
      };
      return { ...state, products: updatedProducts, receipts: updatedReceipts, movements: [...newMovements, ...state.movements], auditLogs: [log, ...state.auditLogs] };
    }

    // ── Deliveries ────────────────────────────────────────────────────────
    case "ADD_DELIVERY":
      return { ...state, deliveries: [payload, ...state.deliveries] };
    case "UPDATE_DELIVERY_STATUS": {
      const { deliveryId, status, userId } = payload;
      const updated = state.deliveries.map((d) =>
        d.id === deliveryId ? { ...d, status, updatedAt: new Date().toISOString(), updatedBy: userId } : d
      );
      return { ...state, deliveries: updated };
    }

    // ── Expenses ──────────────────────────────────────────────────────────
    case "ADD_EXPENSE":
      return { ...state, expenses: [payload, ...state.expenses] };
    case "UPDATE_EXPENSE_STATUS": {
      const { expenseId, status, userId } = payload;
      const updated = state.expenses.map((e) =>
        e.id === expenseId ? { ...e, approvalStatus: status, reviewedBy: userId, reviewedAt: new Date().toISOString() } : e
      );
      return { ...state, expenses: updated };
    }

    // ── Credit Payments ───────────────────────────────────────────────────
    case "ADD_CREDIT_PAYMENT": {
      const { customerId, amount, method, note, sessionId } = payload;
      const newPayment = {
        id: `CP-${Date.now()}`, date: new Date().toISOString(),
        customerId, amount: Number(amount), method, note: note || "", sessionId,
        collectedBy: state.currentUser?.name,
      };
      const updatedCustomers = state.customers.map((c) =>
        c.id === customerId ? { ...c, debtAmount: Math.max(0, (c.debtAmount || 0) - Number(amount)) } : c
      );
      const log = {
        id: `LOG-${Date.now()}`, timestamp: new Date().toISOString(),
        userId: state.currentUser?.id, userName: state.currentUser?.name,
        action: "CREDIT_COLLECTED", details: { customerId, amount, method },
      };
      return { ...state, creditPayments: [newPayment, ...state.creditPayments], customers: updatedCustomers, auditLogs: [log, ...state.auditLogs] };
    }

    // ── Cash Sessions ─────────────────────────────────────────────────────
    case "OPEN_SESSION": {
      const log = {
        id: `LOG-${Date.now()}`, timestamp: new Date().toISOString(),
        userId: payload.userId, userName: payload.userName,
        action: "SESSION_OPENED", details: { sessionId: payload.id, openAmount: payload.openAmount },
      };
      return { ...state, cashSessions: [payload, ...state.cashSessions], auditLogs: [log, ...state.auditLogs] };
    }
    case "CLOSE_SESSION": {
      const { sessionId, countedAmounts, expectedAmounts, ecart, closedAt, userId } = payload;
      const totalRevenue = Object.values(expectedAmounts || {}).reduce((s, v) => s + (v || 0), 0);
      const updated = state.cashSessions.map((s) =>
        s.id === sessionId
          ? { ...s, status: "FERMÉ", closedAt, closedBy: userId, countedAmounts, expectedAmounts, ecart, totalRevenue }
          : s
      );
      const log = {
        id: `LOG-${Date.now()}`, timestamp: new Date().toISOString(),
        userId, userName: state.currentUser?.name || "—",
        action: "SESSION_CLOSED", details: { sessionId, ecart, totalRevenue },
      };
      return { ...state, cashSessions: updated, auditLogs: [log, ...state.auditLogs] };
    }

    // ── SALE (atomic) ─────────────────────────────────────────────────────
    case "PROCESS_SALE": {
      const { invoice, movements: saleMvts, customerDebtDelta } = payload;
      const updatedProducts = state.products.map((prod) => {
        const item = invoice.items?.find((i) => i.productId === prod.id);
        if (!item) return prod;
        const depotId = invoice.depotId;
        const unitsSold = item.quantity * (item.unitFactor || 1);
        const currentQty = prod.stockByDepot?.[depotId]?.physical || 0;
        return {
          ...prod,
          stockByDepot: { ...prod.stockByDepot, [depotId]: { ...(prod.stockByDepot?.[depotId] || {}), physical: Math.max(0, currentQty - unitsSold) } },
        };
      });
      const updatedCustomers = customerDebtDelta > 0
        ? state.customers.map((c) =>
            c.id === invoice.customerId ? { ...c, debtAmount: (c.debtAmount || 0) + customerDebtDelta } : c
          )
        : state.customers;
      const log = {
        id: `LOG-${Date.now()}`, timestamp: new Date().toISOString(),
        userId: state.currentUser?.id, userName: state.currentUser?.name,
        action: "SALE", details: { invoiceId: invoice.id, total: invoice.total, status: invoice.status },
      };
      return {
        ...state,
        products: updatedProducts,
        customers: updatedCustomers,
        invoices: [invoice, ...state.invoices],
        movements: [...(saleMvts || []), ...state.movements],
        auditLogs: [log, ...state.auditLogs],
      };
    }

    // ── Settings ──────────────────────────────────────────────────────────
    case "UPDATE_COMPANY_SETTINGS":
      return state;

    case "HYDRATE_FROM_API":
      return {
        ...state,
        depots: payload.depots || state.depots,
        roles: payload.roles || state.roles,
        products: payload.products || state.products,
        customers: payload.customers || state.customers,
        suppliers: payload.suppliers || state.suppliers,
        invoices: payload.invoices || state.invoices,
        movements: payload.movements || state.movements,
        receipts: payload.receipts || state.receipts,
        deliveries: payload.deliveries || state.deliveries,
        expenses: payload.expenses || state.expenses,
        cashSessions: payload.cashSessions || state.cashSessions,
        auditLogs: payload.auditLogs || state.auditLogs,
      };

    default:
      console.warn("Unknown dispatch type:", type);
      return state;
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function GrispellaProvider({ children }) {
  const [state, dispatch] = useReducer(grispellaReducer, null, buildInitialState);

  // Live synchronization with Node.js + Prisma PostgreSQL Backend
  useEffect(() => {
    let isMounted = true;
    async function syncBackend() {
      try {
        const [
          prodRes,
          custRes,
          supRes,
          invRes,
          mvtRes,
          recRes,
          delRes,
          expRes,
          sesRes,
          audRes,
          rolesRes,
          depotsRes,
        ] = await Promise.allSettled([
          grispellaApi.getProducts(),
          grispellaApi.getCustomers(),
          grispellaApi.getSuppliers(),
          grispellaApi.getInvoices(),
          grispellaApi.getMovements(),
          grispellaApi.getReceipts(),
          grispellaApi.getDeliveries(),
          grispellaApi.getExpenses(),
          grispellaApi.getSessions(),
          grispellaApi.getAuditLogs(),
          grispellaApi.getRoles(),
          grispellaApi.getDepots(),
        ]);

        if (!isMounted) return;

        const payload = {};
        if (prodRes.status === "fulfilled" && prodRes.value?.products?.length > 0) {
          payload.products = prodRes.value.products;
        }
        if (custRes.status === "fulfilled" && custRes.value?.customers?.length > 0) {
          payload.customers = custRes.value.customers;
        }
        if (supRes.status === "fulfilled" && supRes.value?.suppliers?.length > 0) {
          payload.suppliers = supRes.value.suppliers;
        }
        if (invRes.status === "fulfilled" && invRes.value?.invoices?.length > 0) {
          payload.invoices = invRes.value.invoices;
        }
        if (mvtRes.status === "fulfilled" && mvtRes.value?.movements?.length > 0) {
          payload.movements = mvtRes.value.movements;
        }
        if (recRes.status === "fulfilled" && recRes.value?.receipts?.length > 0) {
          payload.receipts = recRes.value.receipts;
        }
        if (delRes.status === "fulfilled" && delRes.value?.deliveries?.length > 0) {
          payload.deliveries = delRes.value.deliveries;
        }
        if (expRes.status === "fulfilled" && expRes.value?.expenses?.length > 0) {
          payload.expenses = expRes.value.expenses;
        }
        if (sesRes.status === "fulfilled" && sesRes.value?.sessions?.length > 0) {
          payload.cashSessions = sesRes.value.sessions;
        }
        if (audRes.status === "fulfilled" && audRes.value?.logs?.length > 0) {
          payload.auditLogs = audRes.value.logs;
        }
        if (rolesRes.status === "fulfilled" && Array.isArray(rolesRes.value?.roles)) {
          payload.roles = rolesRes.value.roles;
          localStorage.setItem("grispella_roles", JSON.stringify(rolesRes.value.roles));
        }
        if (depotsRes.status === "fulfilled" && Array.isArray(depotsRes.value?.depots)) {
          payload.depots = depotsRes.value.depots;
          localStorage.setItem("grispella_depots", JSON.stringify(depotsRes.value.depots));
        }

        if (Object.keys(payload).length > 0) {
          dispatch({ type: "HYDRATE_FROM_API", payload });
        }
      } catch (err) {
        console.info("[Grispella] Local/offline fallback active:", err.message);
      }
    }

    syncBackend();
    return () => {
      isMounted = false;
    };
  }, []);

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem("grispella_roles", JSON.stringify(state.roles || []));
    localStorage.setItem("grispella_depots", JSON.stringify(state.depots || []));
    localStorage.setItem("grispella_products", JSON.stringify(state.products));
    localStorage.setItem("grispella_customers", JSON.stringify(state.customers));
    localStorage.setItem("grispella_suppliers", JSON.stringify(state.suppliers));
    localStorage.setItem("grispella_invoices", JSON.stringify(state.invoices));
    localStorage.setItem("grispella_movements", JSON.stringify(state.movements));
    localStorage.setItem("grispella_receipts", JSON.stringify(state.receipts));
    localStorage.setItem("grispella_deliveries", JSON.stringify(state.deliveries));
    localStorage.setItem("grispella_expenses", JSON.stringify(state.expenses));
    localStorage.setItem("grispella_credit_payments", JSON.stringify(state.creditPayments));
    localStorage.setItem("grispella_audit_logs", JSON.stringify(state.auditLogs));
    localStorage.setItem("grispella_cash_sessions", JSON.stringify(state.cashSessions));
    if (state.currentUser) {
      localStorage.setItem("grispella_user", JSON.stringify(state.currentUser));
    } else {
      localStorage.removeItem("grispella_user");
    }
    localStorage.setItem("grispella_depot", state.currentDepot);
  }, [state]);

  // ── Authentication helpers ───────────────────────────────────────────────
  const loginUser = (user) => {
    dispatch({ type: "LOGIN", payload: user });
  };

  const logoutUser = () => {
    dispatch({ type: "LOGOUT" });
  };

  // ── Convenience functions ────────────────────────────────────────────────
  const collectCredit = (customerId, amount, method, note) => {
    dispatch({ type: "ADD_CREDIT_PAYMENT", payload: { customerId, amount, method, note } });
    grispellaApi.collectCredit(customerId, { amount, method, note }).catch(() => null);
  };

  const validateReceipt = (receiptId) => {
    dispatch({ type: "VALIDATE_RECEIPT", payload: { receiptId, userId: state.currentUser?.id } });
    grispellaApi.validateReceipt(receiptId).catch(() => null);
  };

  const adjustStock = (data) => {
    dispatch({
      type: "ADJUST_STOCK",
      payload: {
        productId: data.productId,
        depotId: data.depotId,
        quantity: parseInt(data.quantity),
        type: data.type || "ADJUSTMENT",
        reason: data.reason,
        userId: state.currentUser?.id,
        date: new Date().toISOString(),
      },
    });
    grispellaApi.adjustStock(data).catch(() => null);
  };

  const processSale = ({ customerId, depotId, items, discount = 0, payments = [] }) => {
    const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const total = Math.max(0, subtotal - (discount || 0));
    const paidAmount = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const creditAmount = Math.max(0, total - paidAmount);

    let status = "NON PAYÉ";
    if (creditAmount === 0) status = "PAYÉ";
    else if (paidAmount > 0) status = "PARTIEL";

    const customerObj = state.customers.find((c) => c.id === customerId);
    const customerName = customerObj?.name || (customerId === "CLI-000" ? "Client Comptoir" : "Client");

    const invoiceId = `FACT-${new Date().getFullYear()}-${String(state.invoices.length + 1).padStart(4, "0")}`;
    const invoice = {
      id: invoiceId,
      date: new Date().toISOString(),
      customerId: customerId || "CLI-000",
      customerName,
      depotId: depotId || state.currentDepot,
      items: items.map((i) => ({ ...i })),
      subtotal,
      discount,
      total,
      payments,
      paidAmount,
      status,
      sessionId: null,
    };

    const saleMvts = items.map((item) => ({
      id: `MVT-${Date.now()}-${item.productId}`,
      date: new Date().toISOString(),
      type: "OUT",
      productId: item.productId,
      productName: item.productName,
      depotId: depotId || state.currentDepot,
      quantity: -(item.quantity * (item.unitFactor || 1)),
      unit: item.unit,
      documentRef: invoiceId,
      userName: state.currentUser?.name,
    }));

    dispatch({ type: "PROCESS_SALE", payload: { invoice, movements: saleMvts, customerDebtDelta: creditAmount } });

    // Sync to PostgreSQL
    grispellaApi.createSale({
      customerId: customerId || "CLI-000",
      customerName,
      depotId: depotId || state.currentDepot,
      items,
      discount,
      payments,
    }).catch(() => null);

    return invoice;
  };

  // Stock helpers
  const getAvailableStock = (product, depotId) => {
    const stock = product?.stockByDepot?.[depotId] || {};
    return Math.max(0, (stock.physical || 0) - (stock.reserved || 0));
  };

  return (
    <GrispellaContext.Provider
      value={{
        state,
        dispatch,
        // Convenience
        formatFDJ,
        collectCredit,
        validateReceipt,
        adjustStock,
        processSale,
        getAvailableStock,
        // Shorthand accessors from state (for components that do state.X)
        COMPANY,
        DEPOTS,
        PAYMENT_METHODS,
        ROLES,
        STAFF_USERS,
        loginUser,
        logoutUser,
        // Dynamic roles from backend
        dynamicRoles: state.roles || [],
        // Dynamic depots from backend (falls back to static DEPOTS)
        depots: state.depots?.length ? state.depots : DEPOTS,
      }}
    >
      {children}
    </GrispellaContext.Provider>
  );
}

export function useGrispella() {
  const ctx = useContext(GrispellaContext);
  if (!ctx) throw new Error("useGrispella must be used within GrispellaProvider");
  return ctx;
}

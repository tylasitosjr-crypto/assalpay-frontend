// Grispella API Client for Node.js + Express + PostgreSQL Backend
const BASE_URL = "";

function getHeaders() {
  const token = localStorage.getItem("grispella_token");
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const user = localStorage.getItem("grispella_user");
  if (user) {
    try {
      const u = JSON.parse(user);
      if (u.id) headers["x-user-id"] = u.id;
    } catch {
      // ignore
    }
  }
  return headers;
}

async function request(endpoint, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...getHeaders(),
        ...(options.headers || {}),
      },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || `Erreur serveur (${res.status})`);
    }
    return data;
  } catch (err) {
    console.warn(`[Grispella API] Call to ${endpoint} failed:`, err.message);
    throw err;
  }
}

export const grispellaApi = {
  // Health
  checkHealth: () => request("/api/health"),

  // Auth
  login: async (identifier, password) => {
    const res = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });
    if (res.token) {
      localStorage.setItem("grispella_token", res.token);
    }
    return res;
  },
  getMe: () => request("/api/auth/me"),
  getStaff: () => request("/api/auth/staff"),
  changePassword: (currentPassword, newPassword) =>
    request("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  // Products
  getProducts: () => request("/api/products"),
  createProduct: (data) => request("/api/products", { method: "POST", body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/api/products/${id}`, { method: "DELETE" }),

  // Customers
  getCustomers: () => request("/api/customers"),
  getCustomerProfile: (id) => request(`/api/customers/${id}/profile`),
  createCustomer: (data) => request("/api/customers", { method: "POST", body: JSON.stringify(data) }),
  updateCustomer: (id, data) => request(`/api/customers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  collectCredit: (id, data) => request(`/api/customers/${id}/collect-credit`, { method: "POST", body: JSON.stringify(data) }),

  // Suppliers
  getSuppliers: () => request("/api/suppliers"),
  createSupplier: (data) => request("/api/suppliers", { method: "POST", body: JSON.stringify(data) }),

  // Invoices & POS Sales
  getInvoices: () => request("/api/invoices"),
  createSale: (data) => request("/api/invoices", { method: "POST", body: JSON.stringify(data) }),
  voidInvoice: (id, reason) => request(`/api/invoices/${id}/void`, { method: "POST", body: JSON.stringify({ reason }) }),

  // Stock & Movements
  getMovements: (params = "") => request(`/api/stock/movements${params}`),
  adjustStock: (data) => request("/api/stock/adjust", { method: "POST", body: JSON.stringify(data) }),
  getDepots: () => request("/api/stock/depots"),
  createDepot: (data) => request("/api/stock/depots", { method: "POST", body: JSON.stringify(data) }),
  deleteDepot: (id) => request(`/api/stock/depots/${id}`, { method: "DELETE" }),

  // Receipts (Entrées fournisseurs)
  getReceipts: () => request("/api/receipts"),
  createReceipt: (data) => request("/api/receipts", { method: "POST", body: JSON.stringify(data) }),
  updateReceiptStatus: (id, status) => request(`/api/receipts/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
  validateReceipt: (id) => request(`/api/receipts/${id}/validate`, { method: "POST" }),

  // Deliveries (BL)
  getDeliveries: () => request("/api/deliveries"),
  createDelivery: (data) => request("/api/deliveries", { method: "POST", body: JSON.stringify(data) }),
  updateDeliveryStatus: (id, status, driver) => request(`/api/deliveries/${id}/status`, { method: "PUT", body: JSON.stringify({ status, driver }) }),

  // Cash Sessions
  getActiveSession: () => request("/api/cash-sessions/active"),
  getSessions: () => request("/api/cash-sessions"),
  openSession: (data) => request("/api/cash-sessions/open", { method: "POST", body: JSON.stringify(data) }),
  closeSession: (id, data) => request(`/api/cash-sessions/${id}/close`, { method: "POST", body: JSON.stringify(data) }),

  // Expenses
  getExpenses: () => request("/api/expenses"),
  createExpense: (data) => request("/api/expenses", { method: "POST", body: JSON.stringify(data) }),
  updateExpenseStatus: (id, status) => request(`/api/expenses/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),

  // Dashboard & Audit
  getDashboardSummary: (period = "today") => request(`/api/dashboard/summary?period=${period}`),
  getDailyReport: (date) => request(`/api/dashboard/daily-report?date=${encodeURIComponent(date)}`),
  getAuditLogs: () => request("/api/audit"),

  // Roles Management (Admin only)
  getRoles: () => request("/api/roles"),
  createRole: (data) => request("/api/roles", { method: "POST", body: JSON.stringify(data) }),
  updateRole: (id, data) => request(`/api/roles/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteRole: (id) => request(`/api/roles/${id}`, { method: "DELETE" }),

  // Users Management (Admin only)
  getAllUsers: () => request("/api/roles/users/all"),
  createUser: (data) => request("/api/roles/users/create", { method: "POST", body: JSON.stringify(data) }),
  updateUser: (id, data) => request(`/api/roles/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
};

export default grispellaApi;

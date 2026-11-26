// Role-Based Access Control (RBAC) definitions & permission checks
// Supports both static built-in roles and dynamic roles fetched from the backend

export const ROLE_CONFIG = {
  admin: {
    id: "admin",
    name: "Administrateur",
    badge: "Accès Total",
    defaultPath: "/",
    allowedRoutes: [
      "/",
      "/pos",
      "/invoices",
      "/customers",
      "/cash-register",
      "/products",
      "/stock",
      "/movements",
      "/receipts",
      "/deliveries",
      "/suppliers",
      "/expenses",
      "/reports",
      "/audit",
      "/settings",
    ],
    canAdjustStock: true,
    canEditProducts: true,
    canViewCosts: true,
    canApproveReceipts: true,
    canApproveDeliveries: true,
    canManageSuppliers: true,
    canManageExpenses: true,
    canViewReports: true,
    canViewAudit: true,
    canManageSettings: true,
    canAccessPOS: true,
    canAccessCashRegister: true,
  },
  caisse: {
    id: "caisse",
    name: "Caisse / Caissier",
    badge: "Ventes & Encaissements",
    defaultPath: "/pos",
    allowedRoutes: [
      "/",
      "/pos",
      "/invoices",
      "/customers",
      "/cash-register",
    ],
    canAdjustStock: false,
    canEditProducts: false,
    canViewCosts: false,
    canApproveReceipts: false,
    canApproveDeliveries: false,
    canManageSuppliers: false,
    canManageExpenses: false,
    canViewReports: false,
    canViewAudit: false,
    canManageSettings: false,
    canAccessPOS: true,
    canAccessCashRegister: true,
  },
  resp_stock: {
    id: "resp_stock",
    name: "Responsable Stock",
    badge: "Gestion Entrepôt & Logistique",
    defaultPath: "/stock",
    allowedRoutes: [
      "/",
      "/products",
      "/stock",
      "/movements",
      "/receipts",
      "/deliveries",
      "/suppliers",
    ],
    canAdjustStock: true,
    canEditProducts: true,
    canViewCosts: false,
    canApproveReceipts: true,
    canApproveDeliveries: true,
    canManageSuppliers: true,
    canManageExpenses: false,
    canViewReports: false,
    canViewAudit: false,
    canManageSettings: false,
    canAccessPOS: false,
    canAccessCashRegister: false,
  },
  agent_stock: {
    id: "agent_stock",
    name: "Agent Stock",
    badge: "Opérations Entrepôt",
    defaultPath: "/stock",
    allowedRoutes: [
      "/",
      "/products",
      "/stock",
      "/movements",
      "/receipts",
      "/deliveries",
    ],
    canAdjustStock: false,
    canEditProducts: false,
    canViewCosts: false,
    canApproveReceipts: false,
    canApproveDeliveries: false,
    canManageSuppliers: false,
    canManageExpenses: false,
    canViewReports: false,
    canViewAudit: false,
    canManageSettings: false,
    canAccessPOS: false,
    canAccessCashRegister: false,
  },
};

/**
 * Check if a role is allowed to access a specific route.
 * Accepts an optional dynamicRoles array (from backend /api/roles) for custom roles.
 */
export function isRouteAllowed(role, pathname, dynamicRoles = []) {
  const cleanPath = pathname === "" ? "/" : pathname.split("?")[0].split("#")[0];

  // Check static config first
  if (ROLE_CONFIG[role]) {
    return ROLE_CONFIG[role].allowedRoutes.includes(cleanPath);
  }

  // Check dynamic roles from backend
  const dynRole = dynamicRoles.find((r) => r.name === role);
  if (dynRole) {
    const routes = Array.isArray(dynRole.allowedRoutes) ? dynRole.allowedRoutes : [];
    return routes.includes(cleanPath);
  }

  return false;
}

/**
 * Get default starting path for a role.
 * Falls back to dynamic roles if not found in static config.
 */
export function getDefaultPathForRole(role, dynamicRoles = []) {
  if (ROLE_CONFIG[role]) return ROLE_CONFIG[role].defaultPath || "/";
  const dynRole = dynamicRoles.find((r) => r.name === role);
  return dynRole?.defaultPath || "/";
}

/**
 * Check if the current user has a specific permission key.
 * Accepts an optional dynamicRoles array for custom roles.
 */
export function hasPermission(role, permissionKey, dynamicRoles = []) {
  if (ROLE_CONFIG[role]) return Boolean(ROLE_CONFIG[role][permissionKey]);
  const dynRole = dynamicRoles.find((r) => r.name === role);
  if (dynRole?.permissions) return Boolean(dynRole.permissions[permissionKey]);
  return false;
}

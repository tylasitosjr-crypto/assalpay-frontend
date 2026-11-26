import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  FiShield,
  FiUsers,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiCheck,
  FiAlertTriangle,
  FiLock,
  FiToggleLeft,
  FiToggleRight,
  FiRefreshCw,
  FiKey,
} from "react-icons/fi";
import grispellaApi from "../api/grispellaApi.js";

// All available routes in the app
const ALL_ROUTES = [
  { path: "/", label: "Tableau de Bord" },
  { path: "/pos", label: "Caisse / POS" },
  { path: "/invoices", label: "Factures & Ventes" },
  { path: "/customers", label: "Clients & Crédits" },
  { path: "/cash-register", label: "Gestion de Caisse" },
  { path: "/products", label: "Articles & Prix" },
  { path: "/stock", label: "Stocks par Dépôt" },
  { path: "/movements", label: "Journal Mouvements" },
  { path: "/receipts", label: "Entrées / Achats" },
  { path: "/deliveries", label: "Sorties / Livraisons" },
  { path: "/suppliers", label: "Fournisseurs" },
  { path: "/expenses", label: "Dépenses" },
  { path: "/reports", label: "Rapports & Marges" },
  { path: "/audit", label: "Journal d'Audit" },
  { path: "/settings", label: "Paramètres Système" },
  { path: "/roles", label: "Rôles & Utilisateurs" },
];

// All permissions
const ALL_PERMISSIONS = [
  { key: "canAdjustStock", label: "Ajuster le stock" },
  { key: "canEditProducts", label: "Modifier les produits" },
  { key: "canViewCosts", label: "Voir les coûts d'achat" },
  { key: "canApproveReceipts", label: "Valider les réceptions" },
  { key: "canApproveDeliveries", label: "Approuver les livraisons" },
  { key: "canManageSuppliers", label: "Gérer les fournisseurs" },
  { key: "canManageExpenses", label: "Gérer les dépenses" },
  { key: "canViewReports", label: "Voir les rapports" },
  { key: "canViewAudit", label: "Voir l'audit" },
  { key: "canManageSettings", label: "Gérer les paramètres" },
  { key: "canAccessPOS", label: "Accès caisse POS" },
  { key: "canAccessCashRegister", label: "Accès gestion caisse" },
  { key: "canVoidInvoices", label: "Annuler des factures" },
  { key: "canCollectCredit", label: "Encaisser les crédits" },
  { key: "canManageRoles", label: "Gérer les rôles & utilisateurs" },
];

const BADGE_COLORS = [
  { value: "#10b981", label: "Vert" },
  { value: "#3b82f6", label: "Bleu" },
  { value: "#f59e0b", label: "Orange" },
  { value: "#ef4444", label: "Rouge" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#ec4899", label: "Rose" },
  { value: "#06b6d4", label: "Cyan" },
  { value: "#64748b", label: "Gris" },
];

const emptyRole = {
  name: "",
  label: "",
  badge: "",
  description: "",
  color: "#10b981",
  icon: "FiShield",
  defaultPath: "/",
  allowedRoutes: ["/"],
  permissions: {},
};

const emptyUser = {
  name: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "",
  title: "",
  active: true,
};

export default function Roles() {
  const [activeTab, setActiveTab] = useState("roles");
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Role modal state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm, setRoleForm] = useState(emptyRole);
  const [roleSaving, setRoleSaving] = useState(false);

  // User modal state
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState(emptyUser);
  const [userSaving, setUserSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Quick password reset modal (Admin changing any user's password)
  const [pwdUser, setPwdUser] = useState(null);
  const [pwdForm, setPwdForm] = useState({ password: "", confirmPassword: "" });
  const [pwdSaving, setPwdSaving] = useState(false);

  const openResetPwd = (user) => {
    setPwdUser(user);
    setPwdForm({ password: "", confirmPassword: "" });
  };

  const handleResetPwd = async () => {
    if (!pwdForm.password || pwdForm.password.length < 4) {
      return toast.error("Le mot de passe doit contenir au moins 4 caractères");
    }
    if (pwdForm.password !== pwdForm.confirmPassword) {
      return toast.error("Les mots de passe ne correspondent pas");
    }
    setPwdSaving(true);
    try {
      await grispellaApi.updateUser(pwdUser.id, { password: pwdForm.password });
      toast.success(`Mot de passe de "${pwdUser.name}" mis à jour`);
      setPwdUser(null);
      setPwdForm({ password: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPwdSaving(false);
    }
  };

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesRes, usersRes] = await Promise.allSettled([
        grispellaApi.getRoles(),
        grispellaApi.getAllUsers(),
      ]);
      if (rolesRes.status === "fulfilled") setRoles(rolesRes.value?.roles || []);
      if (usersRes.status === "fulfilled") setUsers(usersRes.value?.users || []);
    } catch (err) {
      toast.error("Erreur de chargement: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ── Role helpers ───────────────────────────────────────────────────────────
  const openCreateRole = () => {
    setEditingRole(null);
    setRoleForm(emptyRole);
    setShowRoleModal(true);
  };

  const openEditRole = (role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      label: role.label || "",
      badge: role.badge || "",
      description: role.description || "",
      color: role.color || "#10b981",
      icon: role.icon || "FiShield",
      defaultPath: role.defaultPath || "/",
      allowedRoutes: Array.isArray(role.allowedRoutes) ? role.allowedRoutes : [],
      permissions: typeof role.permissions === "object" ? role.permissions : {},
    });
    setShowRoleModal(true);
  };

  const toggleRoute = (path) => {
    setRoleForm((prev) => {
      const has = prev.allowedRoutes.includes(path);
      if (has && path === "/") return prev; // Always keep dashboard
      return {
        ...prev,
        allowedRoutes: has
          ? prev.allowedRoutes.filter((r) => r !== path)
          : [...prev.allowedRoutes, path],
      };
    });
  };

  const togglePermission = (key) => {
    setRoleForm((prev) => ({
      ...prev,
      permissions: { ...prev.permissions, [key]: !prev.permissions[key] },
    }));
  };

  const saveRole = async () => {
    if (!roleForm.label.trim()) return toast.error("Le nom d'affichage est requis");
    if (!editingRole && !roleForm.name.trim()) return toast.error("Le code du rôle est requis");
    setRoleSaving(true);
    try {
      if (editingRole) {
        await grispellaApi.updateRole(editingRole.id, roleForm);
        toast.success(`Rôle "${roleForm.label}" mis à jour`);
      } else {
        await grispellaApi.createRole(roleForm);
        toast.success(`Rôle "${roleForm.label}" créé avec succès`);
      }
      setShowRoleModal(false);
      await loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRoleSaving(false);
    }
  };

  const confirmDelete = (item, type) => {
    setDeleteTarget({ item, type });
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "role") {
        await grispellaApi.deleteRole(deleteTarget.item.id);
        toast.success(`Rôle "${deleteTarget.item.label}" supprimé`);
      }
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ── User helpers ───────────────────────────────────────────────────────────
  const openCreateUser = () => {
    setEditingUser(null);
    setUserForm(emptyUser);
    setShowUserModal(true);
  };

  const openEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      name: user.name || "",
      username: user.username || "",
      email: user.email || "",
      password: "",
      confirmPassword: "",
      role: user.role || "",
      title: user.title || "",
      active: user.active !== false,
    });
    setShowUserModal(true);
  };

  const saveUser = async () => {
    if (!userForm.name.trim()) return toast.error("Le nom est requis");
    if (!userForm.username.trim()) return toast.error("Le nom d'utilisateur est requis");
    if (!userForm.role) return toast.error("Le rôle est requis");
    if (!editingUser) {
      if (!userForm.password) return toast.error("Le mot de passe est requis");
      if (userForm.password !== userForm.confirmPassword)
        return toast.error("Les mots de passe ne correspondent pas");
    }
    if (userForm.password && userForm.password !== userForm.confirmPassword)
      return toast.error("Les mots de passe ne correspondent pas");

    setUserSaving(true);
    try {
      const payload = {
        name: userForm.name,
        username: userForm.username,
        email: userForm.email || undefined,
        role: userForm.role,
        title: userForm.title || undefined,
        active: userForm.active,
      };
      if (userForm.password) payload.password = userForm.password;

      if (editingUser) {
        await grispellaApi.updateUser(editingUser.id, payload);
        toast.success(`Utilisateur "${userForm.name}" mis à jour`);
      } else {
        await grispellaApi.createUser(payload);
        toast.success(`Utilisateur "${userForm.name}" créé avec succès`);
      }
      setShowUserModal(false);
      await loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUserSaving(false);
    }
  };

  const toggleUserActive = async (user) => {
    try {
      await grispellaApi.updateUser(user.id, { active: !user.active });
      toast.success(user.active ? `${user.name} désactivé` : `${user.name} activé`);
      await loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const countPermissions = (role) => {
    if (!role.permissions) return 0;
    return Object.values(role.permissions).filter(Boolean).length;
  };

  if (loading) {
    return (
      <div className="grispella-page" style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
          <FiRefreshCw size={32} style={{ animation: "spin 1s linear infinite" }} />
          <p style={{ marginTop: 16 }}>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grispella-page">
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--text)",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <FiShield style={{ color: "var(--brand)" }} />
            Rôles & Utilisateurs
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "4px 0 0" }}>
            Gérez les rôles d'accès et les comptes utilisateurs
          </p>
        </div>
        <button className="btn btn-secondary" onClick={loadData} style={{ gap: 6 }}>
          <FiRefreshCw size={14} /> Actualiser
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 20,
          background: "var(--bg2)",
          borderRadius: "var(--radius)",
          padding: 4,
          width: "fit-content",
        }}
      >
        {[
          { id: "roles", label: "Gestion des Rôles", icon: FiShield, count: roles.length },
          { id: "users", label: "Gestion des Utilisateurs", icon: FiUsers, count: users.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 18px",
              borderRadius: "var(--radius)",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.85rem",
              background: activeTab === tab.id ? "var(--brand)" : "transparent",
              color: activeTab === tab.id ? "#fff" : "var(--text-muted)",
              transition: "all 0.15s ease",
            }}
          >
            <tab.icon size={14} />
            {tab.label}
            <span
              style={{
                background: activeTab === tab.id ? "rgba(255,255,255,0.25)" : "var(--bg3)",
                color: activeTab === tab.id ? "#fff" : "var(--text-sec)",
                borderRadius: "10px",
                padding: "1px 7px",
                fontSize: "0.75rem",
                fontWeight: 700,
              }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── TAB: ROLES ────────────────────────────────────────────────────── */}
      {activeTab === "roles" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={openCreateRole} style={{ gap: 6 }}>
              <FiPlus size={14} /> Nouveau Rôle
            </button>
          </div>

          <div className="grispella-table-wrapper">
            <table className="grispella-table">
              <thead>
                <tr>
                  <th>Rôle</th>
                  <th>Code</th>
                  <th>Description</th>
                  <th>Routes</th>
                  <th>Permissions</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: role.color || "#10b981",
                            flexShrink: 0,
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, color: "var(--text)" }}>
                            {role.label}
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-muted)",
                              background: "var(--bg2)",
                              borderRadius: 4,
                              padding: "1px 6px",
                              display: "inline-block",
                              marginTop: 2,
                            }}
                          >
                            {role.badge}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <code
                        style={{
                          background: "var(--bg2)",
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontSize: "0.78rem",
                          color: "var(--brand)",
                        }}
                      >
                        {role.name}
                      </code>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.83rem", maxWidth: 200 }}>
                      {role.description || "—"}
                    </td>
                    <td>
                      <span
                        style={{
                          background: "rgba(59,130,246,0.1)",
                          color: "#93c5fd",
                          borderRadius: 4,
                          padding: "2px 8px",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                        }}
                      >
                        {Array.isArray(role.allowedRoutes) ? role.allowedRoutes.length : 0} pages
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          background: "rgba(16,185,129,0.1)",
                          color: "#6ee7b7",
                          borderRadius: 4,
                          padding: "2px 8px",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                        }}
                      >
                        {countPermissions(role)} actives
                      </span>
                    </td>
                    <td>
                      {role.isSystem ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            background: "rgba(245,158,11,0.1)",
                            color: "#fcd34d",
                            borderRadius: 4,
                            padding: "2px 8px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                          }}
                        >
                          <FiLock size={10} /> Système
                        </span>
                      ) : (
                        <span
                          style={{
                            background: "var(--bg2)",
                            color: "var(--text-muted)",
                            borderRadius: 4,
                            padding: "2px 8px",
                            fontSize: "0.75rem",
                          }}
                        >
                          Personnalisé
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: "5px 10px", fontSize: "0.78rem" }}
                          onClick={() => openEditRole(role)}
                          title="Modifier"
                        >
                          <FiEdit2 size={12} />
                        </button>
                        <button
                          className="btn"
                          style={{
                            padding: "5px 10px",
                            fontSize: "0.78rem",
                            background: role.isSystem ? "var(--bg2)" : "rgba(239,68,68,0.12)",
                            color: role.isSystem ? "var(--text-muted)" : "#fca5a5",
                            border: "1px solid",
                            borderColor: role.isSystem
                              ? "var(--border)"
                              : "rgba(239,68,68,0.3)",
                            borderRadius: "var(--radius)",
                            cursor: role.isSystem ? "not-allowed" : "pointer",
                          }}
                          disabled={role.isSystem}
                          onClick={() => !role.isSystem && confirmDelete(role, "role")}
                          title={role.isSystem ? "Rôle système — non supprimable" : "Supprimer"}
                        >
                          <FiTrash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {roles.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px 0" }}>
                      Aucun rôle trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: USERS ────────────────────────────────────────────────────── */}
      {activeTab === "users" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={openCreateUser} style={{ gap: 6 }}>
              <FiPlus size={14} /> Nouvel Utilisateur
            </button>
          </div>

          <div className="grispella-table-wrapper">
            <table className="grispella-table">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Titre</th>
                  <th>Statut</th>
                  <th>Créé le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const userRole = roles.find((r) => r.name === user.role);
                  return (
                    <tr key={user.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              background: "var(--brand-dim)",
                              color: "var(--brand)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 800,
                              fontSize: "0.85rem",
                              flexShrink: 0,
                            }}
                          >
                            {user.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <span style={{ fontWeight: 600, color: "var(--text)" }}>{user.name}</span>
                        </div>
                      </td>
                      <td>
                        <code style={{ color: "var(--brand)", fontSize: "0.83rem" }}>
                          {user.username}
                        </code>
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.83rem" }}>
                        {user.email || "—"}
                      </td>
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            background: userRole?.color
                              ? `${userRole.color}22`
                              : "var(--bg2)",
                            color: userRole?.color || "var(--text-muted)",
                            border: `1px solid ${userRole?.color ? userRole.color + "44" : "var(--border)"}`,
                            borderRadius: 4,
                            padding: "2px 8px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                          }}
                        >
                          {userRole?.label || user.role}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.83rem" }}>
                        {user.title || "—"}
                      </td>
                      <td>
                        <button
                          onClick={() => toggleUserActive(user)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            background: user.active
                              ? "rgba(16,185,129,0.1)"
                              : "rgba(239,68,68,0.1)",
                            color: user.active ? "#6ee7b7" : "#fca5a5",
                            border: "none",
                            borderRadius: 4,
                            padding: "3px 10px",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {user.active ? (
                            <><FiToggleRight size={13} /> Actif</>
                          ) : (
                            <><FiToggleLeft size={13} /> Inactif</>
                          )}
                        </button>
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString("fr-FR")
                          : "—"}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: "5px 10px", fontSize: "0.78rem" }}
                            onClick={() => openEditUser(user)}
                            title="Modifier utilisateur & rôle"
                          >
                            <FiEdit2 size={12} />
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: "5px 10px", fontSize: "0.78rem" }}
                            onClick={() => openResetPwd(user)}
                            title="Changer le mot de passe"
                          >
                            <FiKey size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px 0" }}>
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ROLE MODAL ─────────────────────────────────────────────────────── */}
      {showRoleModal && (
        <div className="grispella-modal-overlay" onClick={() => setShowRoleModal(false)}>
          <div
            className="grispella-modal"
            style={{ maxWidth: 700, width: "95%", maxHeight: "90vh", overflow: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>
                {editingRole ? `Modifier: ${editingRole.label}` : "Créer un Nouveau Rôle"}
              </h2>
              <button
                onClick={() => setShowRoleModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "1.2rem",
                }}
              >
                <FiX />
              </button>
            </div>

            {/* Basic info */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {!editingRole && (
                <div className="form-group">
                  <label className="form-label">Code (identifiant unique)</label>
                  <input
                    className="form-control"
                    placeholder="ex: superviseur_ventes"
                    value={roleForm.name}
                    onChange={(e) =>
                      setRoleForm((p) => ({
                        ...p,
                        name: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                      }))
                    }
                  />
                  <small style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                    Minuscules et underscores uniquement
                  </small>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Nom d'affichage *</label>
                <input
                  className="form-control"
                  placeholder="ex: Superviseur Ventes"
                  value={roleForm.label}
                  onChange={(e) => setRoleForm((p) => ({ ...p, label: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Badge court</label>
                <input
                  className="form-control"
                  placeholder="ex: Supervision & Ventes"
                  value={roleForm.badge}
                  onChange={(e) => setRoleForm((p) => ({ ...p, badge: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Page par défaut</label>
                <select
                  className="form-control"
                  value={roleForm.defaultPath}
                  onChange={(e) => setRoleForm((p) => ({ ...p, defaultPath: e.target.value }))}
                >
                  {ALL_ROUTES.map((r) => (
                    <option key={r.path} value={r.path}>
                      {r.label} ({r.path})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: "1/-1" }}>
                <label className="form-label">Description</label>
                <input
                  className="form-control"
                  placeholder="Courte description du rôle..."
                  value={roleForm.description}
                  onChange={(e) => setRoleForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>
            </div>

            {/* Color */}
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Couleur du rôle</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {BADGE_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setRoleForm((p) => ({ ...p, color: c.value }))}
                    title={c.label}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: c.value,
                      border: roleForm.color === c.value ? "3px solid #fff" : "2px solid transparent",
                      cursor: "pointer",
                      boxShadow: roleForm.color === c.value ? `0 0 0 2px ${c.value}` : "none",
                      transition: "all 0.15s ease",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Allowed routes */}
            <div style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ marginBottom: 8, display: "block" }}>
                Pages accessibles
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 6,
                  background: "var(--bg2)",
                  borderRadius: "var(--radius)",
                  padding: 12,
                }}
              >
                {ALL_ROUTES.map((route) => {
                  const checked = roleForm.allowedRoutes.includes(route.path);
                  return (
                    <label
                      key={route.path}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        cursor: route.path === "/" ? "default" : "pointer",
                        padding: "5px 8px",
                        borderRadius: 4,
                        background: checked ? "rgba(var(--brand-rgb), 0.1)" : "transparent",
                        fontSize: "0.83rem",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={route.path === "/"}
                        onChange={() => toggleRoute(route.path)}
                        style={{ accentColor: "var(--brand)" }}
                      />
                      <span style={{ color: checked ? "var(--text)" : "var(--text-muted)" }}>
                        {route.label}
                      </span>
                      <code
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--text-muted)",
                          marginLeft: "auto",
                        }}
                      >
                        {route.path}
                      </code>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Permissions */}
            <div style={{ marginBottom: 24 }}>
              <label className="form-label" style={{ marginBottom: 8, display: "block" }}>
                Permissions
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 6,
                  background: "var(--bg2)",
                  borderRadius: "var(--radius)",
                  padding: 12,
                }}
              >
                {ALL_PERMISSIONS.map((perm) => {
                  const checked = Boolean(roleForm.permissions[perm.key]);
                  return (
                    <label
                      key={perm.key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        cursor: "pointer",
                        padding: "5px 8px",
                        borderRadius: 4,
                        background: checked ? "rgba(16,185,129,0.08)" : "transparent",
                        fontSize: "0.83rem",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePermission(perm.key)}
                        style={{ accentColor: "#10b981" }}
                      />
                      <span style={{ color: checked ? "var(--text)" : "var(--text-muted)" }}>
                        {perm.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setShowRoleModal(false)}>
                Annuler
              </button>
              <button className="btn btn-primary" onClick={saveRole} disabled={roleSaving}>
                {roleSaving ? (
                  <FiRefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <FiCheck size={14} />
                )}
                {editingRole ? "Enregistrer" : "Créer le rôle"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── USER MODAL ─────────────────────────────────────────────────────── */}
      {showUserModal && (
        <div className="grispella-modal-overlay" onClick={() => setShowUserModal(false)}>
          <div
            className="grispella-modal"
            style={{ maxWidth: 520, width: "95%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>
                {editingUser ? `Modifier: ${editingUser.name}` : "Créer un Utilisateur"}
              </h2>
              <button
                onClick={() => setShowUserModal(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.2rem" }}
              >
                <FiX />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Nom complet *</label>
                  <input
                    className="form-control"
                    placeholder="Prénom Nom"
                    value={userForm.name}
                    onChange={(e) => setUserForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Username *</label>
                  <input
                    className="form-control"
                    placeholder="identifiant"
                    value={userForm.username}
                    onChange={(e) => setUserForm((p) => ({ ...p, username: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email (optionnel)</label>
                <input
                  className="form-control"
                  type="email"
                  placeholder="email@exemple.com"
                  value={userForm.email}
                  onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Rôle *</label>
                <select
                  className="form-control"
                  value={userForm.role}
                  onChange={(e) => {
                    const selectedRole = roles.find((r) => r.name === e.target.value);
                    setUserForm((p) => ({
                      ...p,
                      role: e.target.value,
                      title: selectedRole?.label || p.title,
                    }));
                  }}
                >
                  <option value="">— Sélectionner un rôle —</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.label} ({r.name})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Titre / Poste</label>
                <input
                  className="form-control"
                  placeholder="ex: Responsable Caisse"
                  value={userForm.title}
                  onChange={(e) => setUserForm((p) => ({ ...p, title: e.target.value }))}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">
                    {editingUser ? "Nouveau mot de passe (vide = inchangé)" : "Mot de passe *"}
                  </label>
                  <input
                    className="form-control"
                    type="password"
                    placeholder="••••••••"
                    value={userForm.password}
                    onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirmer</label>
                  <input
                    className="form-control"
                    type="password"
                    placeholder="••••••••"
                    value={userForm.confirmPassword}
                    onChange={(e) => setUserForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={userForm.active}
                    onChange={(e) => setUserForm((p) => ({ ...p, active: e.target.checked }))}
                    style={{ accentColor: "var(--brand)", width: 16, height: 16 }}
                  />
                  <span style={{ color: "var(--text)", fontSize: "0.88rem" }}>Compte actif</span>
                </label>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={() => setShowUserModal(false)}>
                Annuler
              </button>
              <button className="btn btn-primary" onClick={saveUser} disabled={userSaving}>
                {userSaving ? (
                  <FiRefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <FiCheck size={14} />
                )}
                {editingUser ? "Enregistrer" : "Créer l'utilisateur"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADMIN RESET USER PASSWORD MODAL ─────────────────────────────────── */}
      {pwdUser && (
        <div className="grispella-modal-overlay" onClick={() => setPwdUser(null)}>
          <div
            className="grispella-modal"
            style={{ maxWidth: 420, width: "95%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
                <FiKey /> Mot de passe : {pwdUser.name}
              </h2>
              <button
                onClick={() => setPwdUser(null)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.2rem" }}
              >
                <FiX />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Nouveau mot de passe *</label>
                <input
                  className="form-control"
                  type="password"
                  placeholder="Minimum 4 caractères"
                  value={pwdForm.password}
                  onChange={(e) => setPwdForm((p) => ({ ...p, password: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirmer le mot de passe *</label>
                <input
                  className="form-control"
                  type="password"
                  placeholder="••••••••"
                  value={pwdForm.confirmPassword}
                  onChange={(e) => setPwdForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={() => setPwdUser(null)}>
                Annuler
              </button>
              <button className="btn btn-primary" onClick={handleResetPwd} disabled={pwdSaving}>
                <FiCheck size={14} /> {pwdSaving ? "Enregistrement..." : "Changer le mot de passe"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM ─────────────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="grispella-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div
            className="grispella-modal"
            style={{ maxWidth: 420, width: "95%", textAlign: "center" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "rgba(239,68,68,0.12)",
                color: "#ef4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                margin: "0 auto 16px",
              }}
            >
              <FiAlertTriangle />
            </div>
            <h3 style={{ margin: "0 0 8px", fontWeight: 800 }}>Confirmer la suppression</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: 24 }}>
              Supprimer le rôle{" "}
              <strong style={{ color: "var(--text)" }}>{deleteTarget.item.label}</strong> ?<br />
              Cette action est irréversible.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>
                Annuler
              </button>
              <button
                className="btn"
                style={{
                  background: "var(--danger)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "var(--radius)",
                  padding: "8px 20px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
                onClick={executeDelete}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

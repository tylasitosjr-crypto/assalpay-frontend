import React, { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useGrispella } from "../../context/GrispellaContext.jsx";
import grispellaApi from "../../api/grispellaApi.js";
import { toast } from "react-toastify";
import {
  FiShoppingCart,
  FiUser,
  FiClock,
  FiMapPin,
  FiAlertCircle,
  FiShield,
  FiLogOut,
  FiKey,
  FiX,
  FiCheck,
  FiMenu,
  FiGrid,
  FiPackage,
  FiDatabase,
  FiActivity,
  FiFileText,
  FiUsers,
  FiTruck,
  FiCreditCard,
  FiDollarSign,
  FiBarChart2,
  FiSettings,
  FiArrowDownLeft,
  FiArrowUpRight,
  FiLock
} from "react-icons/fi";

export default function Navbar() {
  const { state, dispatch, logoutUser, dynamicRoles, depots, COMPANY, DEPOTS } = useGrispella();
  const { currentUser, currentDepot, cashSessions } = state;
  const role = currentUser?.role || "caisse";

  const isAdmin = role === "admin";
  const isCaisse = role === "caisse";
  const isRespStock = role === "resp_stock";
  const isAgentStock = role === "agent_stock";
  const isCaisseOrAdmin = isAdmin || isCaisse;

  const activeSession = cashSessions?.find(
    (s) => s.status === "OUVERT" && s.userId === currentUser?.id
  );
  const navigate = useNavigate();

  const [timeStr, setTimeStr] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdForm, setPwdForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwdSaving, setPwdSaving] = useState(false);

  const handleChangeOwnPassword = async (e) => {
    e.preventDefault();
    if (!pwdForm.currentPassword || !pwdForm.newPassword) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    if (pwdForm.newPassword.length < 4) {
      toast.error("Le nouveau mot de passe doit contenir au moins 4 caractères");
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      toast.error("Les nouveaux mots de passe ne correspondent pas");
      return;
    }
    setPwdSaving(true);
    try {
      await grispellaApi.changePassword(pwdForm.currentPassword, pwdForm.newPassword);
      toast.success("Mot de passe modifié avec succès !");
      setShowPwdModal(false);
      setPwdForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.message || "Erreur lors du changement de mot de passe");
    } finally {
      setPwdSaving(false);
    }
  };

  const dynRoleLabel = (dynamicRoles || []).find((r) => r.name === role)?.label;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleDepotChange = (e) => {
    dispatch({ type: "SET_DEPOT", payload: e.target.value });
  };

  const handleNavClick = (path) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  return (
    <header className="grispella-navbar">
      {/* Brand & Mobile Hamburger */}
      <div className="navbar-brand-section" style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flexShrink: 1 }}>
        {/* Mobile Hamburger Button (Visible on screens < 900px) */}
        <button
          type="button"
          className="mobile-menu-trigger"
          onClick={() => setMobileMenuOpen(true)}
          title="Ouvrir le menu de navigation"
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid var(--border)",
            color: "#e2e8f0",
            borderRadius: "var(--radius-sm, 8px)",
            padding: "6px 8px",
            cursor: "pointer",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 38,
            minWidth: 38,
            flexShrink: 0,
          }}
        >
          <FiMenu size={20} />
        </button>

        <Link to="/" className="navbar-logo" style={{ minWidth: 0, overflow: "hidden" }}>
          <div className="logo-badge" style={{ flexShrink: 0 }}>G</div>
          <div className="brand-texts" style={{ minWidth: 0, overflow: "hidden" }}>
            <span className="brand-title" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
              {COMPANY.name}
            </span>
            <span className="brand-subtitle hide-on-tablet">Système Grossiste · Réseau FDJ</span>
          </div>
        </Link>
      </div>

      {/* Center Info (Hidden on small mobile & tablets) */}
      <div className="navbar-center-info hide-on-tablet">
        {isCaisseOrAdmin && (
          activeSession?.isOpen || activeSession?.status === "OUVERT" ? (
            <div className="session-pill active">
              <span className="dot"></span>
              <span>Caisse Ouverte ({activeSession.id})</span>
            </div>
          ) : (
            <div className="session-pill closed">
              <FiAlertCircle />
              <span>Caisse Fermée</span>
            </div>
          )
        )}

        <div className="navbar-clock">
          <FiClock />
          <span>{timeStr}</span>
        </div>
      </div>

      {/* Right Controls (Responsive touch layout) */}
      <div className="navbar-controls" style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        {/* Depot Selector */}
        <div className="control-item navbar-depot-wrap">
          <FiMapPin className="control-icon" />
          <select
            value={currentDepot}
            onChange={handleDepotChange}
            className="navbar-select"
            title="Dépôt actif actuel"
          >
            {(depots && depots.length ? depots : DEPOTS).map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Quick POS action button (Caisse & Admin) */}
        {isCaisseOrAdmin && (
          <button
            className="btn-pos-quick hide-on-mobile"
            onClick={() => navigate("/pos")}
            title="Accès rapide Caisse POS"
          >
            <FiShoppingCart />
            <span>Caisse</span>
          </button>
        )}

        {/* User Identity Pill (Condensed on mobile) */}
        <div className="navbar-user-badge">
          <div className="navbar-user-avatar">
            {currentUser?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="navbar-user-info hide-on-tablet">
            <span className="navbar-user-name">{currentUser?.name || "Utilisateur"}</span>
            <span className="navbar-user-role">
              {dynRoleLabel ||
                (role === "admin"
                  ? "👑 Admin"
                  : role === "caisse"
                  ? "🛒 Caissier"
                  : role === "resp_stock"
                  ? "🏬 Resp. Stock"
                  : "📦 Agent")}
            </span>
          </div>
        </div>

        {/* Change Own Password Button */}
        <button
          title="Changer mon mot de passe"
          className="hide-on-tablet"
          onClick={() => setShowPwdModal(true)}
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.16)",
            color: "#e2e8f0",
            borderRadius: "var(--radius-sm)",
            padding: "7px 10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "0.78rem",
            fontWeight: "600",
          }}
        >
          <FiKey />
          <span>Clé</span>
        </button>

        {/* Logout Button */}
        <button
          className="btn-logout-nav"
          title="Se déconnecter"
          onClick={() => {
            logoutUser();
            toast.info("Session terminée");
            navigate("/login");
          }}
          style={{
            background: "rgba(239,68,68,0.15)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#fca5a5",
            borderRadius: "var(--radius-sm)",
            padding: "7px 10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "0.78rem",
            fontWeight: "600",
            minHeight: 38,
          }}
        >
          <FiLogOut />
          <span className="hide-on-mobile">Sortie</span>
        </button>
      </div>

      {/* ── MOBILE DRAWER NAVIGATION (Phone & Tablet < 900px) ───────────────── */}
      {mobileMenuOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            zIndex: 10000,
            display: "flex",
          }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            style={{
              width: "82%",
              maxWidth: 320,
              background: "var(--bg, #0f172a)",
              borderRight: "1px solid var(--border)",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "10px 0 30px rgba(0,0,0,0.5)",
              animation: "slideInLeft 0.2s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div>
              <div
                style={{
                  padding: "18px 16px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="logo-badge" style={{ width: 34, height: 34, fontSize: "1.1rem" }}>G</div>
                  <div>
                    <strong style={{ fontSize: "1rem", color: "#f8fafc", display: "block" }}>{COMPANY.name}</strong>
                    <span style={{ fontSize: "0.72rem", color: "var(--brand, #10b981)", fontWeight: 700 }}>
                      {dynRoleLabel || role.toUpperCase()}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    fontSize: "1.3rem",
                    cursor: "pointer",
                    padding: 4,
                  }}
                >
                  <FiX />
                </button>
              </div>

              {/* Depot selector inside mobile drawer */}
              <div style={{ padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--border)" }}>
                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                  Dépôt de travail actif :
                </label>
                <select
                  value={currentDepot}
                  onChange={handleDepotChange}
                  className="form-input"
                  style={{ width: "100%", fontSize: "0.85rem", minHeight: 38 }}
                >
                  {(depots && depots.length ? depots : DEPOTS).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Drawer Links List */}
              <div style={{ padding: "12px 10px", overflowY: "auto", maxHeight: "calc(100vh - 220px)" }}>
                <span style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)", padding: "4px 10px", display: "block", fontWeight: 700 }}>
                  Menu Principal
                </span>

                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => handleNavClick("/")}
                    className="mobile-nav-item"
                  >
                    <FiGrid /> <span>Tableau de bord</span>
                  </button>

                  {isCaisseOrAdmin && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleNavClick("/pos")}
                        className="mobile-nav-item"
                        style={{ color: "#34d399", fontWeight: 700 }}
                      >
                        <FiShoppingCart /> <span>Caisse POS Vente</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNavClick("/invoices")}
                        className="mobile-nav-item"
                      >
                        <FiFileText /> <span>Factures & Ventes</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNavClick("/customers")}
                        className="mobile-nav-item"
                      >
                        <FiUsers /> <span>Clients & Crédits</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNavClick("/cash-register")}
                        className="mobile-nav-item"
                      >
                        <FiCreditCard /> <span>Caisse Journalière</span>
                      </button>
                    </>
                  )}

                  {(isAdmin || isRespStock || isAgentStock) && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleNavClick("/products")}
                        className="mobile-nav-item"
                      >
                        <FiPackage /> <span>Articles & Prix</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNavClick("/stock")}
                        className="mobile-nav-item"
                      >
                        <FiDatabase /> <span>Stocks par Dépôt</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNavClick("/movements")}
                        className="mobile-nav-item"
                      >
                        <FiActivity /> <span>Mouvements Stock</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNavClick("/receipts")}
                        className="mobile-nav-item"
                      >
                        <FiArrowDownLeft /> <span>Entrées / Achats</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNavClick("/deliveries")}
                        className="mobile-nav-item"
                      >
                        <FiArrowUpRight /> <span>Sorties / BL</span>
                      </button>
                    </>
                  )}

                  {(isAdmin || isRespStock) && (
                    <button
                      type="button"
                      onClick={() => handleNavClick("/suppliers")}
                      className="mobile-nav-item"
                    >
                      <FiTruck /> <span>Fournisseurs</span>
                    </button>
                  )}

                  {isAdmin && (
                    <>
                      <span style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)", padding: "10px 10px 4px", display: "block", fontWeight: 700 }}>
                        Administration & Audit
                      </span>
                      <button
                        type="button"
                        onClick={() => handleNavClick("/expenses")}
                        className="mobile-nav-item"
                      >
                        <FiDollarSign /> <span>Dépenses</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNavClick("/reports")}
                        className="mobile-nav-item"
                      >
                        <FiBarChart2 /> <span>Rapports Journaliers</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNavClick("/settings")}
                        className="mobile-nav-item"
                        style={{ color: "#38bdf8", fontWeight: 700 }}
                      >
                        <FiSettings /> <span>Paramètres & Dépôts</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNavClick("/roles")}
                        className="mobile-nav-item"
                      >
                        <FiShield /> <span>Utilisateurs & Rôles</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNavClick("/audit")}
                        className="mobile-nav-item"
                      >
                        <FiLock /> <span>Journal d'Audit</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div style={{ padding: "14px 16px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowPwdModal(true);
                }}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid var(--border)",
                  color: "#cbd5e1",
                  borderRadius: 8,
                  padding: "9px 12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: "0.85rem",
                  width: "100%",
                }}
              >
                <FiKey /> Changer mon mot de passe
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logoutUser();
                  toast.info("Session terminée");
                  navigate("/login");
                }}
                style={{
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#fca5a5",
                  borderRadius: 8,
                  padding: "9px 12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  width: "100%",
                }}
              >
                <FiLogOut /> Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Self-service Change Password Modal */}
      {showPwdModal && (
        <div
          className="grispella-modal-overlay"
          style={{ zIndex: 10001 }}
          onClick={() => setShowPwdModal(false)}
        >
          <div
            className="grispella-modal"
            style={{ maxWidth: 420, width: "92%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <FiKey /> Changer mon mot de passe
              </h3>
              <button
                onClick={() => setShowPwdModal(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.1rem" }}
              >
                <FiX />
              </button>
            </div>
            <form onSubmit={handleChangeOwnPassword} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Mot de passe actuel *</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={pwdForm.currentPassword}
                  onChange={(e) => setPwdForm((p) => ({ ...p, currentPassword: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nouveau mot de passe *</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Minimum 4 caractères"
                  value={pwdForm.newPassword}
                  onChange={(e) => setPwdForm((p) => ({ ...p, newPassword: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirmer le nouveau mot de passe *</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={pwdForm.confirmPassword}
                  onChange={(e) => setPwdForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  required
                />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPwdModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={pwdSaving}>
                  <FiCheck size={14} /> {pwdSaving ? "Enregistrement..." : "Mettre à jour"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGrispella } from "../../context/GrispellaContext.jsx";
import grispellaApi from "../../api/grispellaApi.js";
import { toast } from "react-toastify";
import {
  FiShoppingCart,
  FiUser,
  FiClock,
  FiMapPin,
  FiCheckCircle,
  FiAlertCircle,
  FiShield,
  FiLogOut,
  FiKey,
  FiX,
  FiCheck,
} from "react-icons/fi";

export default function Navbar() {
  const { state, dispatch, logoutUser, dynamicRoles, depots, COMPANY, DEPOTS } = useGrispella();
  const { currentUser, currentDepot, cashSessions } = state;
  const role = currentUser?.role || "caisse";

  const isCaisseOrAdmin = role === "admin" || role === "caisse";

  const activeSession = cashSessions?.find(
    (s) => s.status === "OUVERT" && s.userId === currentUser?.id
  );
  const navigate = useNavigate();

  const [timeStr, setTimeStr] = useState("");
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
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
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

  return (
    <header className="grispella-navbar">
      <div className="navbar-brand-section">
        <Link to="/" className="navbar-logo">
          <div className="logo-badge">G</div>
          <div className="brand-texts">
            <span className="brand-title">{COMPANY.name}</span>
            <span className="brand-subtitle">Système Grossiste · Mode Réseau Connecté</span>
          </div>
        </Link>
      </div>

      <div className="navbar-center-info">
        {/* Active Session Badge — Shown only for roles with Caisse operations */}
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

        {/* Live Clock UTC+3 */}
        <div className="navbar-clock">
          <FiClock />
          <span>{timeStr} (UTC+3)</span>
        </div>
      </div>

      <div className="navbar-controls">
        {/* Depot Selector */}
        <div className="control-item">
          <FiMapPin className="control-icon" />
          <select value={currentDepot} onChange={handleDepotChange} className="navbar-select">
            {(depots && depots.length ? depots : DEPOTS).map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Logged-in Staff Identity (Read-only - Role locked to authenticated session) */}
        <div className="navbar-user-badge">
          <div className="navbar-user-avatar">
            {currentUser?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="navbar-user-info">
            <span className="navbar-user-name">{currentUser?.name || "Utilisateur"}</span>
            <span className="navbar-user-role">
              {dynRoleLabel ||
                (role === "admin"
                  ? "👑 Administrateur"
                  : role === "caisse"
                  ? "🛒 Caissier / Vente"
                  : role === "resp_stock"
                  ? "🏬 Resp. Stock"
                  : "📦 Agent Stock")}
            </span>
          </div>
        </div>

        {/* Change Own Password Button (ALL users) */}
        <button
          title="Changer mon mot de passe"
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
          <span>Mot de passe</span>
        </button>

        {/* Quick POS action button — ONLY for Caisse and Admin */}
        {isCaisseOrAdmin && (
          <button className="btn-pos-quick" onClick={() => navigate("/pos")}>
            <FiShoppingCart />
            <span>Caisse Vente</span>
          </button>
        )}

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
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--danger)";
            e.currentTarget.style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.15)";
            e.currentTarget.style.color = "#fca5a5";
          }}
        >
          <FiLogOut />
          <span>Déconnexion</span>
        </button>
      </div>

      {/* Self-service Change Password Modal */}
      {showPwdModal && (
        <div
          className="grispella-modal-overlay"
          style={{ zIndex: 9999 }}
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

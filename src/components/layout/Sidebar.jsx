import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useGrispella } from "../../context/GrispellaContext.jsx";
import { ROLE_CONFIG } from "../../utils/permissions.js";
import { toast } from "react-toastify";
import {
  FiGrid,
  FiShoppingCart,
  FiFileText,
  FiPackage,
  FiDatabase,
  FiActivity,
  FiArrowDownLeft,
  FiArrowUpRight,
  FiUsers,
  FiTruck,
  FiCreditCard,
  FiDollarSign,
  FiBarChart2,
  FiLock,
  FiSettings,
  FiShield,
  FiLogOut,
} from "react-icons/fi";

export default function Sidebar() {
  const { state, logoutUser } = useGrispella();
  const navigate = useNavigate();
  const { currentUser } = state;
  const role = currentUser?.role || "caisse";

  const isAdmin = role === "admin";
  const isCaisse = role === "caisse";
  const isRespStock = role === "resp_stock";
  const isAgentStock = role === "agent_stock";

  const NavItem = ({ to, icon: Icon, label, end = false, bold = false }) => (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
    >
      <Icon className="icon" />
      <span className={bold ? "label-bold" : ""}>{label}</span>
    </NavLink>
  );

  const roleInfo = ROLE_CONFIG[role] || { name: role, badge: "Utilisateur" };

  return (
    <aside className="grispella-sidebar">
      {/* Role Badge Indicator */}
      <div style={{ padding: "8px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 8 }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: isAdmin
            ? "rgba(16,185,129,0.18)"
            : isCaisse
            ? "rgba(59,130,246,0.18)"
            : "rgba(245,158,11,0.18)",
          color: isAdmin ? "#6ee7b7" : isCaisse ? "#93c5fd" : "#fcd34d",
          border: `1px solid ${isAdmin ? "rgba(16,185,129,0.3)" : isCaisse ? "rgba(59,130,246,0.3)" : "rgba(245,158,11,0.3)"}`,
          padding: "4px 10px",
          borderRadius: "20px",
          fontSize: "0.7rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.5px"
        }}>
          <FiShield size={11} /> {roleInfo.name}
        </div>
      </div>

      {/* SECTION 1: VENTES & OPÉRATIONS (Admin & Caisse ONLY) */}
      {(isAdmin || isCaisse) && (
        <div className="sidebar-menu-group">
          <span className="sidebar-group-title">Ventes & Caisse</span>

          <NavItem to="/" icon={FiGrid} label="Tableau de Bord" end />
          <NavItem to="/pos" icon={FiShoppingCart} label="Caisse / POS" bold />
          <NavItem to="/invoices" icon={FiFileText} label="Factures & Ventes" />
          <NavItem to="/customers" icon={FiUsers} label="Clients & Crédits" />
          <NavItem to="/cash-register" icon={FiCreditCard} label="Gestion de Caisse" />
        </div>
      )}

      {/* SECTION 2: STOCKS & LOGISTIQUE (Admin & Stock Roles ONLY) */}
      {(isAdmin || isRespStock || isAgentStock) && (
        <div className="sidebar-menu-group">
          <span className="sidebar-group-title">
            {isAgentStock ? "Opérations Entrepôt" : "Stocks & Logistique"}
          </span>

          {/* For stock users, Dashboard link is placed here */}
          {(isRespStock || isAgentStock) && (
            <NavItem to="/" icon={FiGrid} label="Tableau de Bord" end />
          )}

          <NavItem to="/products" icon={FiPackage} label="Articles & Prix" />
          <NavItem to="/stock" icon={FiDatabase} label="Stocks par Dépôt" />
          <NavItem to="/movements" icon={FiActivity} label="Journal Mouvements" />
          <NavItem to="/receipts" icon={FiArrowDownLeft} label="Entrées / Achats" />
          <NavItem to="/deliveries" icon={FiArrowUpRight} label="Sorties / Livraisons" />

          {/* Suppliers: Admin & Resp Stock only */}
          {(isAdmin || isRespStock) && (
            <NavItem to="/suppliers" icon={FiTruck} label="Fournisseurs" />
          )}
        </div>
      )}

      {/* SECTION 3: FINANCES & CONTRÔLE (Admin ONLY) */}
      {isAdmin && (
        <div className="sidebar-menu-group">
          <span className="sidebar-group-title">Finances & Contrôle</span>

          <NavItem to="/expenses" icon={FiDollarSign} label="Dépenses" />
          <NavItem to="/reports" icon={FiBarChart2} label="Rapports & Marges" />
          <NavItem to="/audit" icon={FiLock} label="Journal d'Audit" />
          <NavItem to="/settings" icon={FiSettings} label="Paramètres Système" />
          <NavItem to="/roles" icon={FiShield} label="Rôles & Utilisateurs" bold />
        </div>
      )}

      {/* Footer Profile & Logout */}
      <div className="sidebar-footer-profile" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div className="avatar-letter">{currentUser?.name?.charAt(0)?.toUpperCase() || "U"}</div>
          <div className="profile-details">
            <span className="profile-name">{currentUser?.name}</span>
            <span className="profile-role">{roleInfo.name}</span>
          </div>
        </div>
        <button
          onClick={() => {
            logoutUser();
            toast.info("Session terminée. À bientôt !");
            navigate("/login");
          }}
          title="Se déconnecter"
          style={{
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.25)",
            color: "#fca5a5",
            borderRadius: "6px",
            padding: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
            fontSize: "0.95rem"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--danger)";
            e.currentTarget.style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.12)";
            e.currentTarget.style.color = "#fca5a5";
          }}
        >
          <FiLogOut />
        </button>
      </div>
    </aside>
  );
}

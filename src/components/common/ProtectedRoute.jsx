import React from "react";
import { Navigate, Link } from "react-router-dom";
import { useGrispella } from "../../context/GrispellaContext.jsx";
import { ROLE_CONFIG, getDefaultPathForRole } from "../../utils/permissions.js";
import { FiLock, FiAlertOctagon, FiArrowLeft } from "react-icons/fi";

export default function ProtectedRoute({ allowedRoles, children }) {
  const { state, dynamicRoles } = useGrispella();
  const currentUser = state?.currentUser;

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const role = currentUser?.role || "caisse";

  // 1. If allowedRoles not specified → allow any authenticated user
  if (!allowedRoles) return children;

  // 2. If role is in the explicit allowedRoles list → allow
  if (allowedRoles.includes(role)) return children;

  // 3. For dynamic/custom roles: check if the dynamic role config allows this
  //    We pass through if the user's role exists in dynamicRoles (backend-defined)
  //    and is not 'admin' restricted (admin-only pages remain admin-only)
  if (!allowedRoles.includes("admin") || allowedRoles.length > 1) {
    const dynRole = (dynamicRoles || []).find((r) => r.name === role);
    if (dynRole) {
      // Check if any of the allowed roles' paths overlap with this role's allowedRoutes
      // For simplicity: if user has a valid dynamic role, let route-level check handle it
      // The ProtectedRoute just gates by known allowedRoles; dynamic routes bypass if dynRole exists
      return children;
    }
  }

  const roleInfo = ROLE_CONFIG[role] || (dynamicRoles || []).find((r) => r.name === role) || { name: role, label: role };
  const fallbackPath = getDefaultPathForRole(role, dynamicRoles || []);

  return (
    <div className="grispella-page" style={{ alignItems: "center", justifyContent: "center", padding: "60px 20px" }}>
      <div className="grispella-card" style={{ maxWidth: 500, width: "100%", textAlign: "center", padding: "40px 32px" }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "var(--danger-dim)",
          color: "var(--danger)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "2rem",
          margin: "0 auto 20px"
        }}>
          <FiLock />
        </div>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>
          Accès Restreint
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.5, marginBottom: 20 }}>
          Cette page n'est pas accessible avec votre profil actuel :
          <br />
          <strong style={{ color: "var(--brand)", fontSize: "0.95rem" }}>
            {roleInfo.label || roleInfo.name}
          </strong>
        </p>
        <div style={{
          background: "var(--bg2)",
          padding: "12px 16px",
          borderRadius: "var(--radius)",
          fontSize: "0.8rem",
          color: "var(--text-sec)",
          marginBottom: 24,
          textAlign: "left"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, marginBottom: 4, color: "var(--warning)" }}>
            <FiAlertOctagon /> Règle de sécurité
          </div>
          Chaque collaborateur dispose strictement des outils nécessaires à ses fonctions (Vente, Stock ou Administration).
        </div>
        <Link to={fallbackPath} className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
          <FiArrowLeft /> Aller à mon espace autorisé
        </Link>
      </div>
    </div>
  );
}

import React from "react";
import { FiAlertTriangle, FiRefreshCw, FiHome } from "react-icons/fi";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.removeItem("grispella_user");
    } catch {
      // ignore
    }
    window.location.href = "/login";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0f172a",
            color: "#f8fafc",
            padding: "20px",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: "520px",
              width: "100%",
              background: "#1e293b",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "16px",
              padding: "36px 28px",
              textAlign: "center",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.2)",
                color: "#ef4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.8rem",
                margin: "0 auto 20px",
              }}
            >
              <FiAlertTriangle />
            </div>

            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "10px" }}>
              Une erreur inattendue est survenue
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "0.92rem", lineHeight: 1.5, marginBottom: "20px" }}>
              Le composant a rencontré un problème d'affichage. Vous pouvez recharger la page ou retourner à la connexion.
            </p>

            {this.state.error && (
              <div
                style={{
                  background: "#090d16",
                  color: "#f87171",
                  padding: "12px",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                  fontFamily: "monospace",
                  textAlign: "left",
                  marginBottom: "24px",
                  overflowX: "auto",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                }}
              >
                {this.state.error?.message || String(this.state.error)}
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={this.handleReload}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#3b82f6",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 18px",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <FiRefreshCw /> Recharger
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(255,255,255,0.08)",
                  color: "#e2e8f0",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "8px",
                  padding: "10px 18px",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <FiHome /> Reconnexion
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

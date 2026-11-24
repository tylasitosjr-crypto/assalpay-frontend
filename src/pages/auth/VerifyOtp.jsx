import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { verifyOtp, resendOtp } from "../../api/auth.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { t } = useLanguage();

  const id = location.state?.id;
  const email = location.state?.email || "";
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!otp.trim()) return toast.error("Veuillez entrer le code OTP");
    setLoading(true);
    try {
      const data = await verifyOtp({ id, otp: Number(otp) });
      const token = data?.authToken || data?.token;
      login(token, data?.user || data);
      toast.success("Compte vérifié avec succès !");
      navigate("/");
    } catch (err) {
      toast.error(err.message || "Code OTP incorrect");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      await resendOtp({ id });
      toast.success("Nouveau code OTP envoyé !");
    } catch (err) {
      toast.error(err.message || "Erreur lors du renvoi du code");
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">
          <span>AssalPay</span>
        </div>
        <h1 className="auth-title">{t("verify_otp")}</h1>
        <p className="auth-sub">
          Entrez le code envoyé à <strong>{email || "votre adresse email"}</strong>
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t("otp_code")}</label>
            <input
              className="form-control"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              placeholder="1234"
              maxLength={6}
              style={{
                textAlign: "center",
                letterSpacing: "0.5rem",
                fontSize: "1.5rem",
                fontWeight: 700,
              }}
            />
          </div>
          <button className="btn primary full" type="submit" disabled={loading}>
            {loading ? "Vérification en cours…" : t("verify")}
          </button>
        </form>
        <div className="auth-link">
          Vous n'avez pas reçu le code ?{" "}
          <button
            onClick={handleResend}
            style={{
              background: "none",
              border: "none",
              color: "var(--brand)",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "inherit",
            }}
          >
            {t("resend_otp")}
          </button>
        </div>
      </div>
    </div>
  );
}

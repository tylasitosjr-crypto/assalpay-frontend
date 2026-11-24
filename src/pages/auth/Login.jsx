import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { login as apiLogin } from "../../api/auth.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "", role: "customer" });
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiLogin({
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        device_type: "web",
      });

      const token = data?.authToken || data?.token;
      login(token, data?.user || data);
      toast.success("Connexion réussie !");
      if (form.role === "vendor") {
        navigate("/vendor/dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      toast.error(err.message || "Échec de la connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">
          <span>AssalPay</span>
        </div>
        <h1 className="auth-title">{t("welcome_back")}</h1>
        <p className="auth-sub">{t("sign_in_account")}</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t("email")}</label>
            <input
              className="form-control"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
            />
          </div>
          <div className="form-group">
            <label>{t("current_password")}</label>
            <input
              className="form-control"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
            />
          </div>
          <div className="form-group">
            <label>{t("account_type")}</label>
            <select
              className="form-control"
              name="role"
              value={form.role}
              onChange={handleChange}
            >
              <option value="customer">{t("buyer_type")}</option>
              <option value="vendor">{t("vendor_type")}</option>
            </select>
          </div>
          <div style={{ textAlign: "right", marginBottom: "1rem", fontSize: "0.85rem" }}>
            <Link to="/forgot-password">{t("forgot_password")}</Link>
          </div>
          <button className="btn primary full" type="submit" disabled={loading}>
            {loading ? "Connexion en cours…" : t("sign_in")}
          </button>
        </form>
        <div className="auth-link">
          {t("no_account")} <Link to="/signup">{t("signup")}</Link>
        </div>
      </div>
    </div>
  );
}

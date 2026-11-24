import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { signup } from "../../api/auth.js";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function Signup() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [form, setForm] = useState({
    name: "",
    email: "",
    country_code: "+253",
    phone: "",
    location: "Djibouti",
    password: "",
    role: "customer", // 'customer' or 'vendor'
  });
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password.length < 6 || form.password.length > 12) {
      return toast.error("Le mot de passe doit contenir entre 6 et 12 caractères.");
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        country_code: form.country_code.trim(),
        phone: form.phone.trim().replace(/^\+/, ""),
        location: form.location.trim(),
        password: form.password,
        role: form.role,
        device_type: "web",
      };

      const res = await signup(payload);
      const user = res?.user || res?.body || res;
      toast.success(t("verify_otp") + " — Code envoyé !");
      navigate("/verify-otp", {
        state: {
          id: user?.id,
          email: form.email,
        },
      });
    } catch (err) {
      toast.error(err.message || "Échec de l'inscription");
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
        <h1 className="auth-title">{t("create_account")}</h1>
        <p className="auth-sub">{t("join_today")}</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t("full_name")}</label>
            <input
              className="form-control"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Ex: Mohamed Ali"
            />
          </div>

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

          <div className="form-row">
            <div className="form-group" style={{ maxWidth: 110 }}>
              <label>Indicatif</label>
              <input
                className="form-control"
                name="country_code"
                value={form.country_code}
                onChange={handleChange}
                required
                placeholder="+253"
              />
            </div>
            <div className="form-group">
              <label>{t("phone")}</label>
              <input
                className="form-control"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                placeholder="77 00 00 00"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Ville / Adresse</label>
            <input
              className="form-control"
              name="location"
              value={form.location}
              onChange={handleChange}
              required
              placeholder="Djibouti-ville"
            />
          </div>

          <div className="form-group">
            <label>{t("current_password")} (6-12 caractères)</label>
            <input
              className="form-control"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
              maxLength={12}
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

          <button className="btn primary full" type="submit" disabled={loading}>
            {loading ? "Création en cours…" : t("create_account")}
          </button>
        </form>
        <div className="auth-link">
          {t("already_account")} <Link to="/login">{t("sign_in")}</Link>
        </div>
      </div>
    </div>
  );
}

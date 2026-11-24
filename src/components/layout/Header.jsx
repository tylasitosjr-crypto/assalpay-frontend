import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiShoppingCart, FiBell, FiSearch, FiUser, FiLogOut, FiPackage, FiHeart, FiSettings, FiGlobe } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { mediaUrl } from "../../utils/helpers.js";

export default function Header({ cartCount = 0, notifCount = 0 }) {
  const { user, logout, isVendor } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const menuRef = useRef(null);
  const langRef = useRef(null);

  useEffect(() => {
    function close(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    if (search.trim()) navigate(`/products?q=${encodeURIComponent(search.trim())}`);
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const initials = user ? (user.full_name || user.name || "U").charAt(0).toUpperCase() : "U";

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-logo">AssalPay</Link>

        <form className="header-search" onSubmit={handleSearch}>
          <FiSearch />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search_placeholder")}
          />
        </form>

        <div className="header-actions">
          {/* Language Switcher */}
          <div className="user-menu" ref={langRef}>
            <button
              className="btn outline sm"
              style={{
                color: "#fff",
                borderColor: "rgba(255,255,255,0.4)",
                padding: "0.3rem 0.6rem",
                fontSize: "0.8rem",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
              onClick={() => setLangOpen((o) => !o)}
            >
              <FiGlobe /> {lang === "fr" ? "🇫🇷 FR" : "🇬🇧 EN"}
            </button>
            {langOpen && (
              <div className="user-dropdown" style={{ minWidth: 120 }}>
                <button
                  style={{ fontWeight: lang === "fr" ? 700 : 400 }}
                  onClick={() => {
                    setLang("fr");
                    setLangOpen(false);
                  }}
                >
                  🇫🇷 Français
                </button>
                <button
                  style={{ fontWeight: lang === "en" ? 700 : 400 }}
                  onClick={() => {
                    setLang("en");
                    setLangOpen(false);
                  }}
                >
                  🇬🇧 English
                </button>
              </div>
            )}
          </div>

          {user ? (
            <>
              <button className="header-icon-btn" title={t("cart")} onClick={() => navigate("/cart")}>
                <FiShoppingCart />
                {cartCount > 0 && <span className="header-badge">{cartCount}</span>}
              </button>
              <button className="header-icon-btn" title={t("notifications")} onClick={() => navigate("/notifications")}>
                <FiBell />
                {notifCount > 0 && <span className="header-badge">{notifCount}</span>}
              </button>
              <div className="user-menu" ref={menuRef}>
                <div className="user-avatar" onClick={() => setMenuOpen((o) => !o)}>
                  {user.profile_image ? <img src={mediaUrl(user.profile_image)} alt="" /> : initials}
                </div>
                {menuOpen && (
                  <div className="user-dropdown">
                    <Link to="/profile" onClick={() => setMenuOpen(false)}><FiUser /> {t("profile")}</Link>
                    <Link to="/orders" onClick={() => setMenuOpen(false)}><FiPackage /> {t("my_orders")}</Link>
                    <Link to="/wishlist" onClick={() => setMenuOpen(false)}><FiHeart /> {t("wishlist")}</Link>
                    <Link to="/addresses" onClick={() => setMenuOpen(false)}><FiSettings /> {t("addresses")}</Link>
                    {isVendor && <Link to="/vendor/dashboard" onClick={() => setMenuOpen(false)}>🏪 {t("vendor_portal")}</Link>}
                    <hr />
                    <button className="danger" onClick={handleLogout}><FiLogOut /> {t("logout")}</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="header-auth-btns">
              <button className="btn login" onClick={() => navigate("/login")}>{t("login")}</button>
              <button className="btn signup" onClick={() => navigate("/signup")}>{t("signup")}</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

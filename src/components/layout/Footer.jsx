import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <div className="footer-brand">AssalPay</div>
          <p className="footer-desc">{t("footer_desc")}</p>
        </div>
        <div>
          <h4>{t("quick_links")}</h4>
          <ul>
            <li><Link to="/">{t("home")}</Link></li>
            <li><Link to="/products">{t("products")}</Link></li>
            <li><Link to="/faq">{t("faq")}</Link></li>
            <li><Link to="/contact">{t("contact_us")}</Link></li>
          </ul>
        </div>
        <div>
          <h4>{t("profile")}</h4>
          <ul>
            <li><Link to="/profile">{t("my_profile")}</Link></li>
            <li><Link to="/orders">{t("my_orders")}</Link></li>
            <li><Link to="/wishlist">{t("wishlist")}</Link></li>
            <li><Link to="/vendor/dashboard">{t("vendor_portal")}</Link></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">© {new Date().getFullYear()} AssalPay. {t("rights_reserved")}</div>
    </footer>
  );
}

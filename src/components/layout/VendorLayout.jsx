import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { FiGrid, FiPackage, FiShoppingBag, FiDollarSign, FiLogOut } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext.jsx";

export default function VendorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="vendor-layout">
      <aside className="vendor-sidebar">
        <div className="vendor-sidebar-logo">🏪 AssalPay<br /><span style={{ fontSize: "0.75rem", fontWeight: 400, opacity: 0.7 }}>Vendor Portal</span></div>
        <nav className="vendor-nav">
          <NavLink to="/vendor/dashboard"><FiGrid /> Dashboard</NavLink>
          <NavLink to="/vendor/products"><FiPackage /> Products</NavLink>
          <NavLink to="/vendor/orders"><FiShoppingBag /> Orders</NavLink>
          <NavLink to="/vendor/wallet"><FiDollarSign /> Wallet</NavLink>
        </nav>
        <div style={{ padding: "0 1.25rem", paddingBottom: "1rem" }}>
          <button onClick={handleLogout} className="btn" style={{ width: "100%", color: "rgba(255,255,255,0.75)", background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.15)" }}>
            <FiLogOut /> Logout
          </button>
        </div>
      </aside>
      <div className="vendor-main">
        <div className="vendor-topbar">
          <span className="vendor-topbar-title">Vendor Portal</span>
          <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
            {user?.full_name || user?.name || user?.email}
          </span>
        </div>
        <div className="vendor-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

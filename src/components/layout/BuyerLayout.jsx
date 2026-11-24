import { Outlet } from "react-router-dom";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";

export default function BuyerLayout() {
  return (
    <div className="buyer-layout">
      <Header />
      <div className="page-content">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

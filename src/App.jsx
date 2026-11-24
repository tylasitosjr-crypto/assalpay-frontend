import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "./context/AuthContext.jsx";
import { TOKEN_KEY } from "./api/axiosInstance.js";
import BuyerLayout from "./components/layout/BuyerLayout.jsx";
import VendorLayout from "./components/layout/VendorLayout.jsx";
import Login from "./pages/auth/Login.jsx";
import Signup from "./pages/auth/Signup.jsx";
import VerifyOtp from "./pages/auth/VerifyOtp.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import HomePage from "./pages/home/HomePage.jsx";
import ProductList from "./pages/products/ProductList.jsx";
import ProductDetail from "./pages/products/ProductDetail.jsx";
import CartPage from "./pages/cart/CartPage.jsx";
import CheckoutPage from "./pages/checkout/CheckoutPage.jsx";
import OrderList from "./pages/orders/OrderList.jsx";
import OrderDetail from "./pages/orders/OrderDetail.jsx";
import WishlistPage from "./pages/wishlist/WishlistPage.jsx";
import ProfilePage from "./pages/profile/ProfilePage.jsx";
import AddressBook from "./pages/profile/AddressBook.jsx";
import NotificationsPage from "./pages/misc/NotificationsPage.jsx";
import FaqPage from "./pages/misc/FaqPage.jsx";
import ContactPage from "./pages/misc/ContactPage.jsx";
import VendorDashboard from "./pages/vendor/VendorDashboard.jsx";
import VendorProductList from "./pages/vendor/VendorProductList.jsx";
import VendorProductForm from "./pages/vendor/VendorProductForm.jsx";
import VendorOrderList from "./pages/vendor/VendorOrderList.jsx";
import VendorOrderDetail from "./pages/vendor/VendorOrderDetail.jsx";
import VendorWallet from "./pages/vendor/VendorWallet.jsx";

function AuthBootstrap({ children }) {
  const { refreshMe, logout } = useAuth();
  useEffect(() => {
    if (localStorage.getItem(TOKEN_KEY)) {
      refreshMe().catch(() => logout());
    }
  }, []);
  return children;
}

function PrivateRoute({ children }) {
  return localStorage.getItem(TOKEN_KEY) ? children : <Navigate to="/login" replace />;
}

function VendorRoute({ children }) {
  const { user, isVendor } = useAuth();
  if (!localStorage.getItem(TOKEN_KEY)) return <Navigate to="/login" replace />;
  if (user && !isVendor) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthBootstrap>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Buyer / Public */}
        <Route path="/" element={<BuyerLayout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductList />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="faq" element={<FaqPage />} />
          <Route path="contact" element={<ContactPage />} />

          <Route path="cart" element={<PrivateRoute><CartPage /></PrivateRoute>} />
          <Route path="checkout" element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
          <Route path="orders" element={<PrivateRoute><OrderList /></PrivateRoute>} />
          <Route path="orders/:id" element={<PrivateRoute><OrderDetail /></PrivateRoute>} />
          <Route path="wishlist" element={<PrivateRoute><WishlistPage /></PrivateRoute>} />
          <Route path="profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="addresses" element={<PrivateRoute><AddressBook /></PrivateRoute>} />
          <Route path="notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
        </Route>

        {/* Vendor Portal */}
        <Route path="/vendor" element={<VendorRoute><VendorLayout /></VendorRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<VendorDashboard />} />
          <Route path="products" element={<VendorProductList />} />
          <Route path="products/new" element={<VendorProductForm />} />
          <Route path="products/:id/edit" element={<VendorProductForm />} />
          <Route path="orders" element={<VendorOrderList />} />
          <Route path="orders/:id" element={<VendorOrderDetail />} />
          <Route path="wallet" element={<VendorWallet />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthBootstrap>
  );
}

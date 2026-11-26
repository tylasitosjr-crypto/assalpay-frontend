import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Sidebar from "./Sidebar.jsx";

export default function Layout() {
  return (
    <div className="grispella-app-container">
      <Navbar />
      <div className="grispella-main-body">
        <Sidebar />
        <main className="grispella-content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

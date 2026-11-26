import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Invoices from './pages/Invoices';
import Customers from './pages/Customers';
import CashRegister from './pages/CashRegister';
import Products from './pages/Products';
import Stock from './pages/Stock';
import Movements from './pages/Movements';
import Receipts from './pages/Receipts';
import Deliveries from './pages/Deliveries';
import Suppliers from './pages/Suppliers';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Audit from './pages/Audit';
import Settings from './pages/Settings';
import Roles from './pages/Roles';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={['admin', 'caisse', 'resp_stock', 'agent_stock']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard is accessible to all authenticated roles with role-specific widgets */}
        <Route index element={<Dashboard />} />

        {/* Caisse / Sales Only (Admin + Caisse) */}
        <Route
          path="pos"
          element={
            <ProtectedRoute allowedRoles={['admin', 'caisse']}>
              <POS />
            </ProtectedRoute>
          }
        />
        <Route
          path="invoices"
          element={
            <ProtectedRoute allowedRoles={['admin', 'caisse']}>
              <Invoices />
            </ProtectedRoute>
          }
        />
        <Route
          path="customers"
          element={
            <ProtectedRoute allowedRoles={['admin', 'caisse']}>
              <Customers />
            </ProtectedRoute>
          }
        />
        <Route
          path="cash-register"
          element={
            <ProtectedRoute allowedRoles={['admin', 'caisse']}>
              <CashRegister />
            </ProtectedRoute>
          }
        />

        {/* Stock & Logistics Only (Admin + Resp Stock + Agent Stock) */}
        <Route
          path="products"
          element={
            <ProtectedRoute allowedRoles={['admin', 'resp_stock', 'agent_stock']}>
              <Products />
            </ProtectedRoute>
          }
        />
        <Route
          path="stock"
          element={
            <ProtectedRoute allowedRoles={['admin', 'resp_stock', 'agent_stock']}>
              <Stock />
            </ProtectedRoute>
          }
        />
        <Route
          path="movements"
          element={
            <ProtectedRoute allowedRoles={['admin', 'resp_stock', 'agent_stock']}>
              <Movements />
            </ProtectedRoute>
          }
        />
        <Route
          path="receipts"
          element={
            <ProtectedRoute allowedRoles={['admin', 'resp_stock', 'agent_stock']}>
              <Receipts />
            </ProtectedRoute>
          }
        />
        <Route
          path="deliveries"
          element={
            <ProtectedRoute allowedRoles={['admin', 'resp_stock', 'agent_stock']}>
              <Deliveries />
            </ProtectedRoute>
          }
        />

        {/* Suppliers: Admin + Resp Stock only (Agent cannot view supplier agreements/balances) */}
        <Route
          path="suppliers"
          element={
            <ProtectedRoute allowedRoles={['admin', 'resp_stock']}>
              <Suppliers />
            </ProtectedRoute>
          }
        />

        {/* Finance & Management: Admin ONLY */}
        <Route
          path="expenses"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Expenses />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="audit"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Audit />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Roles & Users: Admin ONLY */}
        <Route
          path="roles"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Roles />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

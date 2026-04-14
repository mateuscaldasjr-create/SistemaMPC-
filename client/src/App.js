import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import TicketForm from './pages/TicketForm';
import TicketDetail from './pages/TicketDetail';
import ServiceOrders from './pages/ServiceOrders';
import ServiceOrderForm from './pages/ServiceOrderForm';
import ServiceOrderDetail from './pages/ServiceOrderDetail';
import Clients from './pages/Clients';
import Equipment from './pages/Equipment';
import Technicians from './pages/Technicians';
import Reports from './pages/Reports';
import Schedule from './pages/Schedule';
import PublicTicket from './pages/PublicTicket';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#64748b' }}>Carregando...</div>;
  return user ? children : <Navigate to="/login" />;
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
      <Route path="/abrir-chamado" element={<PublicTicket />} />

      {/* Protected routes */}
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/chamados" element={<PrivateRoute><Tickets /></PrivateRoute>} />
      <Route path="/chamados/novo" element={<PrivateRoute><TicketForm /></PrivateRoute>} />
      <Route path="/chamados/:id" element={<PrivateRoute><TicketDetail /></PrivateRoute>} />
      <Route path="/ordens" element={<PrivateRoute><ServiceOrders /></PrivateRoute>} />
      <Route path="/ordens/nova" element={<PrivateRoute><ServiceOrderForm /></PrivateRoute>} />
      <Route path="/ordens/:id" element={<PrivateRoute><ServiceOrderDetail /></PrivateRoute>} />
      <Route path="/clientes" element={<PrivateRoute><Clients /></PrivateRoute>} />
      <Route path="/equipamentos" element={<PrivateRoute><Equipment /></PrivateRoute>} />
      <Route path="/tecnicos" element={<PrivateRoute><Technicians /></PrivateRoute>} />
      <Route path="/relatorios" element={<PrivateRoute><Reports /></PrivateRoute>} />
      <Route path="/agenda" element={<PrivateRoute><Schedule /></PrivateRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

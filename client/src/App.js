import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClientDashboard from './pages/ClientDashboard';
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

function RoleRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#64748b' }}>Carregando...</div>;
  if (!user) return <Navigate to="/login" />;
  if (!roles.includes(user.role)) {
    if (user.role === 'cliente') return <Navigate to="/meus-chamados" />;
    return <Navigate to="/" />;
  }
  return children;
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    if (user.role === 'cliente') return <Navigate to="/meus-chamados" />;
    return <Navigate to="/" />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
      <Route path="/abrir-chamado" element={<PublicTicket />} />

      {/* Admin + Gestor + Tecnico */}
      <Route path="/" element={<RoleRoute roles={['admin', 'gestor', 'tecnico']}><Dashboard /></RoleRoute>} />

      {/* Cliente */}
      <Route path="/meus-chamados" element={<RoleRoute roles={['cliente']}><ClientDashboard /></RoleRoute>} />

      {/* Chamados - todos logados podem ver */}
      <Route path="/chamados" element={<RoleRoute roles={['admin', 'gestor', 'tecnico']}><Tickets /></RoleRoute>} />
      <Route path="/chamados/novo" element={<PrivateRoute><TicketForm /></PrivateRoute>} />
      <Route path="/chamados/:id" element={<PrivateRoute><TicketDetail /></PrivateRoute>} />

      {/* Ordens - admin, gestor, tecnico */}
      <Route path="/ordens" element={<RoleRoute roles={['admin', 'gestor', 'tecnico']}><ServiceOrders /></RoleRoute>} />
      <Route path="/ordens/nova" element={<RoleRoute roles={['admin', 'gestor', 'tecnico']}><ServiceOrderForm /></RoleRoute>} />
      <Route path="/ordens/:id" element={<RoleRoute roles={['admin', 'gestor', 'tecnico']}><ServiceOrderDetail /></RoleRoute>} />

      {/* Cadastros - admin, gestor */}
      <Route path="/clientes" element={<RoleRoute roles={['admin', 'gestor']}><Clients /></RoleRoute>} />
      <Route path="/equipamentos" element={<RoleRoute roles={['admin', 'gestor']}><Equipment /></RoleRoute>} />

      {/* Admin only */}
      <Route path="/tecnicos" element={<RoleRoute roles={['admin']}><Technicians /></RoleRoute>} />

      {/* Relatórios - admin, gestor, cliente */}
      <Route path="/relatorios" element={<RoleRoute roles={['admin', 'gestor', 'cliente']}><Reports /></RoleRoute>} />

      {/* Agenda - admin, gestor, tecnico */}
      <Route path="/agenda" element={<RoleRoute roles={['admin', 'gestor', 'tecnico']}><Schedule /></RoleRoute>} />

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

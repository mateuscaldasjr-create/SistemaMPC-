import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const menuItems = [
  { path: '/', icon: 'dashboard', label: 'Dashboard' },
  { path: '/chamados', icon: 'confirmation_number', label: 'Chamados', section: 'GESTÃO' },
  { path: '/ordens', icon: 'assignment', label: 'Ordens de Serviço' },
  { path: '/agenda', icon: 'calendar_today', label: 'Agenda' },
  { path: '/clientes', icon: 'people', label: 'Clientes', section: 'CADASTROS' },
  { path: '/equipamentos', icon: 'precision_manufacturing', label: 'Equipamentos' },
  { path: '/tecnicos', icon: 'engineering', label: 'Técnicos' },
  { path: '/relatorios', icon: 'bar_chart', label: 'Relatórios', section: 'ANÁLISE' },
];

export default function Layout({ children, title }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

  const roleLabels = { admin: 'Administrador', gestor: 'Gestor', tecnico: 'Técnico', cliente: 'Cliente' };

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">M</div>
          <div>
            <h1>SistemaMPC</h1>
            <span>Gestão de Serviços</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item, idx) => (
            <React.Fragment key={item.path}>
              {item.section && (
                <div className="sidebar-section">
                  <div className="sidebar-section-title">{item.section}</div>
                </div>
              )}
              <Link
                to={item.path}
                className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="icon">{item.icon}</span>
                {item.label}
              </Link>
            </React.Fragment>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={() => { logout(); navigate('/login'); }}>
            <div className="avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{roleLabels[user?.role] || user?.role}</div>
            </div>
            <span className="icon" style={{ opacity: 0.5 }}>logout</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <span className="icon">menu</span>
            </button>
            <h2>{title || ''}</h2>
          </div>
          <div className="header-right">
            <button className="header-btn">
              <span className="icon">notifications</span>
              <span className="notification-dot"></span>
            </button>
          </div>
        </header>

        <div className="page-content">
          {children}
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="mobile-bottom-nav">
          <Link to="/" className={`mobile-nav-item ${location.pathname === '/' ? 'active' : ''}`}>
            <span className="icon">dashboard</span>
            <span>Início</span>
          </Link>
          <Link to="/chamados" className={`mobile-nav-item ${location.pathname.startsWith('/chamados') ? 'active' : ''}`}>
            <span className="icon">confirmation_number</span>
            <span>Chamados</span>
          </Link>
          <Link to="/chamados/novo" className="mobile-nav-item mobile-nav-fab">
            <span className="icon">add</span>
          </Link>
          <Link to="/ordens" className={`mobile-nav-item ${location.pathname.startsWith('/ordens') ? 'active' : ''}`}>
            <span className="icon">assignment</span>
            <span>O.S.</span>
          </Link>
          <Link to="/clientes" className={`mobile-nav-item ${location.pathname.startsWith('/clientes') ? 'active' : ''}`}>
            <span className="icon">people</span>
            <span>Clientes</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}

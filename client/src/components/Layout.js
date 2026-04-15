import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const allMenuItems = [
  { path: '/', icon: 'dashboard', label: 'Dashboard', roles: ['admin', 'gestor', 'tecnico'] },
  { path: '/meus-chamados', icon: 'dashboard', label: 'Meus Chamados', roles: ['cliente'] },
  { path: '/chamados', icon: 'confirmation_number', label: 'Chamados', section: 'GESTÃO', roles: ['admin', 'gestor', 'tecnico'] },
  { path: '/chamados/novo', icon: 'add_circle', label: 'Abrir Chamado', section: 'GESTÃO', roles: ['cliente'] },
  { path: '/ordens', icon: 'assignment', label: 'Ordens de Serviço', roles: ['admin', 'gestor', 'tecnico'] },
  { path: '/agenda', icon: 'calendar_today', label: 'Agenda', roles: ['admin', 'gestor', 'tecnico'] },
  { path: '/clientes', icon: 'people', label: 'Clientes', section: 'CADASTROS', roles: ['admin', 'gestor'] },
  { path: '/equipamentos', icon: 'precision_manufacturing', label: 'Equipamentos', roles: ['admin', 'gestor'] },
  { path: '/tecnicos', icon: 'engineering', label: 'Usuários', section: 'ADMINISTRAÇÃO', roles: ['admin'] },
  { path: '/relatorios', icon: 'bar_chart', label: 'Relatórios', section: 'ANÁLISE', roles: ['admin', 'gestor', 'cliente'] },
];

export default function Layout({ children, title }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
  const roleLabels = { admin: 'Administrador', gestor: 'Gestor', tecnico: 'Técnico', cliente: 'Cliente' };

  const menuItems = allMenuItems.filter(item => item.roles.includes(user?.role));

  // Mobile nav items based on role
  const getMobileNav = () => {
    if (user?.role === 'cliente') {
      return [
        { path: '/meus-chamados', icon: 'dashboard', label: 'Início' },
        { path: '/chamados/novo', icon: 'add_circle', label: 'Abrir Chamado' },
        { path: '/relatorios', icon: 'bar_chart', label: 'Relatórios' },
      ];
    }
    if (user?.role === 'tecnico') {
      return [
        { path: '/', icon: 'dashboard', label: 'Início' },
        { path: '/chamados', icon: 'confirmation_number', label: 'Chamados' },
        { path: '/ordens', icon: 'assignment', label: 'O.S.' },
        { path: '/agenda', icon: 'calendar_today', label: 'Agenda' },
      ];
    }
    return [
      { path: '/', icon: 'dashboard', label: 'Início' },
      { path: '/chamados', icon: 'confirmation_number', label: 'Chamados' },
      { path: '/chamados/novo', icon: 'add', label: '', fab: true },
      { path: '/ordens', icon: 'assignment', label: 'O.S.' },
      { path: '/clientes', icon: 'people', label: 'Clientes' },
    ];
  };

  const mobileNav = getMobileNav();

  return (
    <div className="app-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">M</div>
          <div>
            <h1>SistemaMPC</h1>
            <span>Gestão de Serviços</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
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

      <div className="main-content">
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

        <nav className="mobile-bottom-nav">
          {mobileNav.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`mobile-nav-item ${item.fab ? 'mobile-nav-fab' : ''} ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="icon">{item.icon}</span>
              {item.label && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

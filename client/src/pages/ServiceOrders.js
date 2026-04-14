import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../utils/api';
import { statusLabels, statusColors, formatCurrency, formatDate, timeAgo } from '../utils/helpers';

export default function ServiceOrders() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 20 });
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    api.get(`/service-orders?${params}`).then(data => {
      setOrders(data.orders);
      setTotal(data.total);
    }).catch(console.error).finally(() => setLoading(false));
  }, [page, filters]);

  return (
    <Layout title="Ordens de Serviço">
      <div className="page-header">
        <div>
          <h1>Ordens de Serviço</h1>
          <p>{total} ordens encontradas</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/ordens/nova')}>
          <span className="icon">add</span>
          Nova O.S.
        </button>
      </div>

      <div className="card">
        <div className="tabs" style={{ padding: '0 16px' }}>
          {[
            { value: '', label: 'Todas' },
            { value: 'pendente', label: 'Pendentes' },
            { value: 'em_execucao', label: 'Em Execução' },
            { value: 'finalizada', label: 'Finalizadas' },
          ].map(tab => (
            <button key={tab.value} className={`tab ${filters.status === tab.value ? 'active' : ''}`}
              onClick={() => { setFilters(f => ({ ...f, status: tab.value })); setPage(1); }}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="filters-bar">
          <div className="search-input">
            <span className="icon">search</span>
            <input placeholder="Buscar ordens..." value={filters.search}
              onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }} />
          </div>
        </div>

        {/* Desktop */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>O.S.</th>
                <th>Chamado</th>
                <th>Cliente</th>
                <th>Técnico</th>
                <th>Status</th>
                <th>Valor</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40 }}>Carregando...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40 }}>Nenhuma ordem encontrada</td></tr>
              ) : orders.map(o => (
                <tr key={o.id} onClick={() => navigate(`/ordens/${o.id}`)}>
                  <td><span className="ticket-number">{o.order_number}</span></td>
                  <td>{o.ticket_number || '-'}</td>
                  <td>{o.client_name || '-'}</td>
                  <td>{o.technician_name || '-'}</td>
                  <td>
                    <span className="badge" style={{ background: `${statusColors[o.status]}20`, color: statusColors[o.status] }}>
                      <span className="dot" style={{ background: statusColors[o.status] }}></span>
                      {statusLabels[o.status]}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(o.cost_total)}</td>
                  <td style={{ fontSize: 13, color: '#64748b' }}>{formatDate(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="mobile-card-list" style={{ padding: 12 }}>
          {loading ? (
            <div className="empty-state" style={{ padding: 40 }}><p>Carregando...</p></div>
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <span className="icon">assignment</span>
              <h3>Nenhuma ordem</h3>
            </div>
          ) : orders.map(o => (
            <div key={o.id} className="mobile-ticket-card" onClick={() => navigate(`/ordens/${o.id}`)}>
              <div className="card-top">
                <span className="ticket-id">{o.order_number}</span>
                <span className="badge" style={{ background: `${statusColors[o.status]}20`, color: statusColors[o.status] }}>
                  <span className="dot" style={{ background: statusColors[o.status] }}></span>
                  {statusLabels[o.status]}
                </span>
              </div>
              <div className="card-title">{o.ticket_title || o.order_number}</div>
              <div className="card-client">
                <span className="icon">business</span>
                {o.client_name || 'Sem cliente'}
                <span style={{ marginLeft: 'auto' }}>
                  <span className="icon" style={{ fontSize: 14 }}>person</span> {o.technician_name || '-'}
                </span>
              </div>
              <div className="card-bottom">
                <span style={{ fontWeight: 700, color: '#1a73e8' }}>{formatCurrency(o.cost_total)}</span>
                <span className="card-meta">
                  <span className="icon">schedule</span> {timeAgo(o.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

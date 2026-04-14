import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../utils/api';
import { statusLabels, statusColors, priorityLabels, priorityColors, typeLabels, formatDate, timeAgo } from '../utils/helpers';

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: '', priority: '', type: '', search: '' });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadTickets = () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 20 });
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.type) params.append('type', filters.type);
    if (filters.search) params.append('search', filters.search);

    api.get(`/tickets?${params}`).then(data => {
      setTickets(data.tickets);
      setTotal(data.total);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { loadTickets(); }, [page, filters]);

  const statusTabs = [
    { value: '', label: 'Todos', count: total },
    { value: 'aberto', label: 'Abertos' },
    { value: 'em_andamento', label: 'Em Andamento' },
    { value: 'aguardando', label: 'Aguardando' },
    { value: 'concluido', label: 'Concluídos' },
  ];

  return (
    <Layout title="Chamados">
      <div className="page-header">
        <div>
          <h1>Chamados</h1>
          <p>{total} chamados encontrados</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/chamados/novo')}>
          <span className="icon">add</span>
          Novo Chamado
        </button>
      </div>

      <div className="card">
        {/* Tabs */}
        <div className="tabs" style={{ padding: '0 16px' }}>
          {statusTabs.map(tab => (
            <button
              key={tab.value}
              className={`tab ${filters.status === tab.value ? 'active' : ''}`}
              onClick={() => { setFilters(f => ({ ...f, status: tab.value })); setPage(1); }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <div className="search-input">
            <span className="icon">search</span>
            <input
              placeholder="Buscar chamados..."
              value={filters.search}
              onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }}
            />
          </div>
          <select className="filter-select" value={filters.priority} onChange={e => { setFilters(f => ({ ...f, priority: e.target.value })); setPage(1); }}>
            <option value="">Prioridade</option>
            {Object.entries(priorityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className="filter-select" value={filters.type} onChange={e => { setFilters(f => ({ ...f, type: e.target.value })); setPage(1); }}>
            <option value="">Tipo</option>
            {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {/* Desktop Table */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Chamado</th>
                <th>Título</th>
                <th>Cliente</th>
                <th>Tipo</th>
                <th>Prioridade</th>
                <th>Status</th>
                <th>Responsável</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: 40 }}>Carregando...</td></tr>
              ) : tickets.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: 40 }}>Nenhum chamado encontrado</td></tr>
              ) : tickets.map(t => (
                <tr key={t.id} onClick={() => navigate(`/chamados/${t.id}`)}>
                  <td><span className="ticket-number">{t.ticket_number}</span></td>
                  <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</td>
                  <td>{t.client_name || '-'}</td>
                  <td><span style={{ fontSize: 13 }}>{typeLabels[t.type]}</span></td>
                  <td>
                    <span className="badge badge-priority" style={{ background: `${priorityColors[t.priority]}20`, color: priorityColors[t.priority] }}>
                      {priorityLabels[t.priority]}
                    </span>
                  </td>
                  <td>
                    <span className="badge" style={{ background: `${statusColors[t.status]}20`, color: statusColors[t.status] }}>
                      <span className="dot" style={{ background: statusColors[t.status] }}></span>
                      {statusLabels[t.status]}
                    </span>
                  </td>
                  <td>{t.assigned_name || <span style={{ color: '#94a3b8' }}>Não atribuído</span>}</td>
                  <td style={{ color: '#64748b', fontSize: 13 }}>{formatDate(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="mobile-card-list" style={{ padding: 12 }}>
          {loading ? (
            <div className="empty-state" style={{ padding: 40 }}><p>Carregando...</p></div>
          ) : tickets.length === 0 ? (
            <div className="empty-state">
              <span className="icon">inbox</span>
              <h3>Nenhum chamado</h3>
              <p>Crie um novo chamado para começar</p>
            </div>
          ) : tickets.map(t => (
            <div key={t.id} className="mobile-ticket-card" onClick={() => navigate(`/chamados/${t.id}`)}>
              <div className="card-top">
                <span className="ticket-id">{t.ticket_number}</span>
                <span className="badge badge-priority" style={{ background: `${priorityColors[t.priority]}20`, color: priorityColors[t.priority] }}>
                  {priorityLabels[t.priority]}
                </span>
              </div>
              <div className="card-title">{t.title}</div>
              <div className="card-client">
                <span className="icon">business</span>
                {t.client_name || t.client_company || 'Sem cliente'}
                {t.assigned_name && (
                  <span style={{ marginLeft: 'auto', color: '#64748b' }}>
                    <span className="icon" style={{ fontSize: 14 }}>person</span> {t.assigned_name}
                  </span>
                )}
              </div>
              <div className="card-bottom">
                <span className="badge" style={{ background: `${statusColors[t.status]}20`, color: statusColors[t.status] }}>
                  <span className="dot" style={{ background: statusColors[t.status] }}></span>
                  {statusLabels[t.status]}
                </span>
                <div className="card-meta">
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{typeLabels[t.type]}</span>
                  <span className="icon">schedule</span>
                  {timeAgo(t.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="pagination">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <span className="icon">chevron_left</span>
            </button>
            {Array.from({ length: Math.min(5, Math.ceil(total / 20)) }, (_, i) => (
              <button key={i + 1} className={page === i + 1 ? 'active' : ''} onClick={() => setPage(i + 1)}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)}>
              <span className="icon">chevron_right</span>
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}

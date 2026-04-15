import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../utils/api';
import { statusLabels, statusColors, priorityLabels, priorityColors, timeAgo } from '../utils/helpers';

export default function ClientDashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todos');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/tickets?limit=100').then(data => {
      setTickets(data.tickets || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const abertos = tickets.filter(t => ['aberto', 'aprovado', 'em_andamento', 'aguardando'].includes(t.status));
  const finalizados = tickets.filter(t => ['concluido', 'cancelado'].includes(t.status));

  const filtered = filter === 'abertos' ? abertos : filter === 'finalizados' ? finalizados : tickets;

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <Layout title="Meus Chamados"><div className="empty-state"><p>Carregando...</p></div></Layout>;

  return (
    <Layout title="Meus Chamados">
      <div className="page-header">
        <div>
          <h1>Meus Chamados</h1>
          <p>{tickets.length} chamados no total</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={handlePrint}>
            <span className="icon">print</span> Relatório
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/chamados/novo')}>
            <span className="icon">add</span> Abrir Chamado
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card" onClick={() => setFilter('todos')} style={{ cursor: 'pointer', border: filter === 'todos' ? '2px solid #3b82f6' : 'none' }}>
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
            <span className="icon">confirmation_number</span>
          </div>
          <div className="stat-info">
            <div className="stat-value">{tickets.length}</div>
            <div className="stat-label">Total</div>
          </div>
        </div>
        <div className="stat-card" onClick={() => setFilter('abertos')} style={{ cursor: 'pointer', border: filter === 'abertos' ? '2px solid #f59e0b' : 'none' }}>
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <span className="icon">pending_actions</span>
          </div>
          <div className="stat-info">
            <div className="stat-value">{abertos.length}</div>
            <div className="stat-label">Em Aberto</div>
          </div>
        </div>
        <div className="stat-card" onClick={() => setFilter('finalizados')} style={{ cursor: 'pointer', border: filter === 'finalizados' ? '2px solid #10b981' : 'none' }}>
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <span className="icon">check_circle</span>
          </div>
          <div className="stat-info">
            <div className="stat-value">{finalizados.length}</div>
            <div className="stat-label">Finalizados</div>
          </div>
        </div>
      </div>

      {/* Mobile Stats */}
      <div className="mobile-stats-scroll">
        <div className="mobile-stat-card" onClick={() => setFilter('todos')} style={{ cursor: 'pointer' }}>
          <div className="stat-value" style={{ color: '#3b82f6' }}>{tickets.length}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="mobile-stat-card" onClick={() => setFilter('abertos')} style={{ cursor: 'pointer' }}>
          <div className="stat-value" style={{ color: '#f59e0b' }}>{abertos.length}</div>
          <div className="stat-label">Em Aberto</div>
        </div>
        <div className="mobile-stat-card" onClick={() => setFilter('finalizados')} style={{ cursor: 'pointer' }}>
          <div className="stat-value" style={{ color: '#10b981' }}>{finalizados.length}</div>
          <div className="stat-label">Finalizados</div>
        </div>
      </div>

      {/* Ticket List */}
      <div className="card">
        <div className="card-header">
          <h3>{filter === 'abertos' ? 'Chamados em Aberto' : filter === 'finalizados' ? 'Chamados Finalizados' : 'Todos os Chamados'}</h3>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: 40 }}>
            <span className="icon" style={{ fontSize: 48, color: '#cbd5e1' }}>inbox</span>
            <p>Nenhum chamado encontrado</p>
            <button className="btn btn-primary" onClick={() => navigate('/chamados/novo')}>Abrir Chamado</button>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Chamado</th>
                    <th>Título</th>
                    <th>Status</th>
                    <th>Prioridade</th>
                    <th>Responsável</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t.id} onClick={() => navigate(`/chamados/${t.id}`)}>
                      <td><span className="ticket-number">{t.ticket_number}</span></td>
                      <td>{t.title}</td>
                      <td>
                        <span className="badge" style={{ background: `${statusColors[t.status]}20`, color: statusColors[t.status] }}>
                          <span className="dot" style={{ background: statusColors[t.status] }}></span>
                          {statusLabels[t.status]}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-priority" style={{ background: `${priorityColors[t.priority]}20`, color: priorityColors[t.priority] }}>
                          {priorityLabels[t.priority]}
                        </span>
                      </td>
                      <td>{t.assigned_name || 'Aguardando'}</td>
                      <td style={{ color: '#64748b', fontSize: 13 }}>{timeAgo(t.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="mobile-card-list" style={{ padding: 12 }}>
              {filtered.map(t => (
                <div key={t.id} className="mobile-ticket-card" onClick={() => navigate(`/chamados/${t.id}`)}>
                  <div className="card-top">
                    <span className="ticket-id">{t.ticket_number}</span>
                    <span className="badge badge-priority" style={{ background: `${priorityColors[t.priority]}20`, color: priorityColors[t.priority] }}>
                      {priorityLabels[t.priority]}
                    </span>
                  </div>
                  <div className="card-title">{t.title}</div>
                  <div className="card-bottom">
                    <span className="badge" style={{ background: `${statusColors[t.status]}20`, color: statusColors[t.status] }}>
                      <span className="dot" style={{ background: statusColors[t.status] }}></span>
                      {statusLabels[t.status]}
                    </span>
                    <span className="card-meta">
                      <span className="icon">schedule</span>
                      {timeAgo(t.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Layout from '../components/Layout';
import { api } from '../utils/api';
import { statusLabels, statusColors, priorityLabels, priorityColors, formatCurrency, timeAgo } from '../utils/helpers';

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#6b7280'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard').then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout title="Dashboard"><div className="empty-state"><p>Carregando...</p></div></Layout>;
  if (!data) return <Layout title="Dashboard"><div className="empty-state"><p>Erro ao carregar dados</p></div></Layout>;

  const { tickets, serviceOrders, clients, equipment, technicians, charts, recentTickets } = data;

  return (
    <Layout title="Dashboard">
      {/* Mobile Quick Actions */}
      <div className="mobile-quick-actions">
        <button className="quick-action-btn" onClick={() => navigate('/chamados/novo')}>
          <div className="action-icon" style={{ background: '#1a73e8' }}>
            <span className="icon">add</span>
          </div>
          <div>
            <div className="action-text">Novo Chamado</div>
            <div className="action-sub">Abrir chamado</div>
          </div>
        </button>
        <button className="quick-action-btn" onClick={() => navigate('/ordens/nova')}>
          <div className="action-icon" style={{ background: '#10b981' }}>
            <span className="icon">assignment_add</span>
          </div>
          <div>
            <div className="action-text">Nova O.S.</div>
            <div className="action-sub">Criar ordem</div>
          </div>
        </button>
        <button className="quick-action-btn" onClick={() => navigate('/chamados')}>
          <div className="action-icon" style={{ background: '#f59e0b' }}>
            <span className="icon">list_alt</span>
          </div>
          <div>
            <div className="action-text">Chamados</div>
            <div className="action-sub">{tickets.abertos} abertos</div>
          </div>
        </button>
        <button className="quick-action-btn" onClick={() => navigate('/clientes')}>
          <div className="action-icon" style={{ background: '#8b5cf6' }}>
            <span className="icon">people</span>
          </div>
          <div>
            <div className="action-text">Clientes</div>
            <div className="action-sub">{clients.total} cadastrados</div>
          </div>
        </button>
      </div>

      {/* Mobile Stats Scroll */}
      <div className="mobile-stats-scroll">
        <div className="mobile-stat-card">
          <div className="stat-value" style={{ color: '#3b82f6' }}>{tickets.abertos}</div>
          <div className="stat-label">Abertos</div>
        </div>
        <div className="mobile-stat-card">
          <div className="stat-value" style={{ color: '#f59e0b' }}>{tickets.em_andamento}</div>
          <div className="stat-label">Em Andamento</div>
        </div>
        <div className="mobile-stat-card">
          <div className="stat-value" style={{ color: '#ef4444' }}>{tickets.urgentes}</div>
          <div className="stat-label">Urgentes</div>
        </div>
        <div className="mobile-stat-card">
          <div className="stat-value" style={{ color: '#10b981' }}>{tickets.concluidos}</div>
          <div className="stat-label">Concluídos</div>
        </div>
        <div className="mobile-stat-card">
          <div className="stat-value" style={{ color: '#8b5cf6' }}>{serviceOrders.total}</div>
          <div className="stat-label">Ordens</div>
        </div>
        <div className="mobile-stat-card">
          <div className="stat-value" style={{ color: '#1a73e8' }}>{formatCurrency(serviceOrders.revenue)}</div>
          <div className="stat-label">Faturamento</div>
        </div>
      </div>

      {/* Desktop Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
            <span className="icon">confirmation_number</span>
          </div>
          <div className="stat-info">
            <div className="stat-value">{tickets.abertos}</div>
            <div className="stat-label">Chamados Abertos</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <span className="icon">pending_actions</span>
          </div>
          <div className="stat-info">
            <div className="stat-value">{tickets.em_andamento}</div>
            <div className="stat-label">Em Andamento</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
            <span className="icon">priority_high</span>
          </div>
          <div className="stat-info">
            <div className="stat-value">{tickets.urgentes}</div>
            <div className="stat-label">Urgentes</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <span className="icon">check_circle</span>
          </div>
          <div className="stat-info">
            <div className="stat-value">{tickets.concluidos}</div>
            <div className="stat-label">Concluídos</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
            <span className="icon">assignment</span>
          </div>
          <div className="stat-info">
            <div className="stat-value">{serviceOrders.total}</div>
            <div className="stat-label">Ordens de Serviço</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}>
            <span className="icon">payments</span>
          </div>
          <div className="stat-info">
            <div className="stat-value">{formatCurrency(serviceOrders.revenue)}</div>
            <div className="stat-label">Faturamento Total</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Chamados por Mês</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={charts.ticketsMonthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total" />
              <Bar dataKey="concluidos" fill="#10b981" radius={[4, 4, 0, 0]} name="Concluídos" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Chamados por Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={charts.ticketsByStatus.map(s => ({ name: statusLabels[s.status] || s.status, value: s.count }))}
                cx="50%" cy="50%"
                innerRadius={60} outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {charts.ticketsByStatus.map((s, i) => (
                  <Cell key={i} fill={statusColors[s.status] || COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {charts.ticketsByStatus.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColors[s.status] || COLORS[i] }}></div>
                {statusLabels[s.status]} ({s.count})
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Tickets */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3>Chamados Recentes</h3>
          <button className="btn btn-sm btn-ghost" onClick={() => navigate('/chamados')}>Ver todos</button>
        </div>

        {/* Desktop table */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Chamado</th>
                <th>Título</th>
                <th>Cliente</th>
                <th>Status</th>
                <th>Prioridade</th>
                <th>Responsável</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {recentTickets.map(t => (
                <tr key={t.id} onClick={() => navigate(`/chamados/${t.id}`)}>
                  <td><span className="ticket-number">{t.ticket_number}</span></td>
                  <td>{t.title}</td>
                  <td>{t.client_name || '-'}</td>
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
                  <td>{t.assigned_name || 'Não atribuído'}</td>
                  <td style={{ color: '#64748b', fontSize: 13 }}>{timeAgo(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="mobile-card-list" style={{ padding: 12 }}>
          {recentTickets.slice(0, 5).map(t => (
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
                {t.client_name || 'Sem cliente'}
              </div>
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
      </div>

      {/* Performance */}
      {charts.technicianPerformance.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3>Performance dos Técnicos</h3>
          </div>
          <div className="card-body">
            {charts.technicianPerformance.map((tech, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${COLORS[i]}, ${COLORS[(i+1) % COLORS.length]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 600 }}>
                  {tech.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{tech.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{tech.concluidos} concluídos / {tech.total} total</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: tech.pendentes > 0 ? '#f59e0b' : '#10b981' }}>
                    {tech.pendentes} pendentes
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: 12 }}>
        MPC Service v1.0 - Desenvolvido por MPC AI Solutions
      </div>
    </Layout>
  );
}

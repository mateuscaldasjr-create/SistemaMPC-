import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import Layout from '../components/Layout';
import { api } from '../utils/api';
import { statusLabels, statusColors, priorityLabels, priorityColors, typeLabels, formatCurrency } from '../utils/helpers';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Reports() {
  const [data, setData] = useState(null);
  const [soStats, setSoStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/tickets/stats'),
      api.get('/service-orders/stats'),
    ]).then(([ticketStats, orderStats]) => {
      setData(ticketStats);
      setSoStats(orderStats);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout title="Relatórios"><div className="empty-state"><p>Carregando...</p></div></Layout>;

  return (
    <Layout title="Relatórios">
      <div className="page-header">
        <div>
          <h1>Relatórios e Indicadores</h1>
          <p>Análise completa dos seus serviços</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
            <span className="icon">confirmation_number</span>
          </div>
          <div className="stat-info">
            <div className="stat-value">{data?.total || 0}</div>
            <div className="stat-label">Total de Chamados</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <span className="icon">check_circle</span>
          </div>
          <div className="stat-info">
            <div className="stat-value">{data?.concluidos || 0}</div>
            <div className="stat-label">Concluídos</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
            <span className="icon">assignment</span>
          </div>
          <div className="stat-info">
            <div className="stat-value">{soStats?.total || 0}</div>
            <div className="stat-label">Ordens de Serviço</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}>
            <span className="icon">payments</span>
          </div>
          <div className="stat-info">
            <div className="stat-value">{formatCurrency(soStats?.revenue || 0)}</div>
            <div className="stat-label">Faturamento</div>
          </div>
        </div>
      </div>

      {/* Mobile Stats */}
      <div className="mobile-stats-scroll">
        <div className="mobile-stat-card">
          <div className="stat-value" style={{ color: '#3b82f6' }}>{data?.total || 0}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="mobile-stat-card">
          <div className="stat-value" style={{ color: '#10b981' }}>{data?.concluidos || 0}</div>
          <div className="stat-label">Concluídos</div>
        </div>
        <div className="mobile-stat-card">
          <div className="stat-value" style={{ color: '#8b5cf6' }}>{soStats?.total || 0}</div>
          <div className="stat-label">O.S.</div>
        </div>
        <div className="mobile-stat-card">
          <div className="stat-value" style={{ color: '#06b6d4', fontSize: 18 }}>{formatCurrency(soStats?.revenue || 0)}</div>
          <div className="stat-label">Faturamento</div>
        </div>
      </div>

      <div className="charts-grid">
        {/* By Status */}
        <div className="chart-card">
          <h3>Chamados por Status</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data?.by_status?.map(s => ({ name: statusLabels[s.status] || s.status, value: s.count })) || []}
                cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value"
              >
                {data?.by_status?.map((s, i) => <Cell key={i} fill={statusColors[s.status] || COLORS[i]} />) || null}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 }}>
            {data?.by_status?.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColors[s.status] || COLORS[i] }}></div>
                {statusLabels[s.status]} ({s.count})
              </div>
            ))}
          </div>
        </div>

        {/* By Type */}
        <div className="chart-card">
          <h3>Chamados por Tipo</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data?.by_type?.map(t => ({ name: typeLabels[t.type] || t.type, total: t.count })) || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="total" fill="#1a73e8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By Priority */}
        <div className="chart-card">
          <h3>Chamados Ativos por Prioridade</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data?.by_priority?.map(p => ({ name: priorityLabels[p.priority] || p.priority, value: p.count })) || []}
                cx="50%" cy="50%" outerRadius={100} paddingAngle={3} dataKey="value"
              >
                {data?.by_priority?.map((p, i) => <Cell key={i} fill={priorityColors[p.priority] || COLORS[i]} />) || null}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 }}>
            {data?.by_priority?.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: priorityColors[p.priority] || COLORS[i] }}></div>
                {priorityLabels[p.priority]} ({p.count})
              </div>
            ))}
          </div>
        </div>

        {/* Monthly trend */}
        <div className="chart-card">
          <h3>Evolução Mensal</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data?.monthly || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#1a73e8" strokeWidth={3} dot={{ fill: '#1a73e8', r: 5 }} name="Chamados" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header"><h3>Resumo Operacional</h3></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            <div style={{ padding: 16, background: '#f8fafc', borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>{data?.em_andamento || 0}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>Em Andamento</div>
            </div>
            <div style={{ padding: 16, background: '#f8fafc', borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>{data?.urgentes || 0}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>Urgentes Ativos</div>
            </div>
            <div style={{ padding: 16, background: '#f8fafc', borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>{soStats?.finalizadas || 0}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>O.S. Finalizadas</div>
            </div>
            <div style={{ padding: 16, background: '#f8fafc', borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#1a73e8' }}>{soStats?.avg_time ? `${Math.round(soStats.avg_time)}h` : '-'}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>Tempo Médio de Serviço</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '16px 0', color: '#94a3b8', fontSize: 12 }}>
        Relatórios gerados por MPC Service - MPC AI Solutions
      </div>
    </Layout>
  );
}

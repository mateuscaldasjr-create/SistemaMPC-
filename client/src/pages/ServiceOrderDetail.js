import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../utils/api';
import { statusLabels, statusColors, formatCurrency, formatDateTime } from '../utils/helpers';

export default function ServiceOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/service-orders/${id}`).then(setOrder).catch(() => navigate('/ordens')).finally(() => setLoading(false));
  }, [id, navigate]);

  const updateStatus = async (status) => {
    try {
      const updates = { status };
      if (status === 'em_execucao') updates.start_time = new Date().toISOString();
      if (status === 'finalizada') updates.end_time = new Date().toISOString();
      await api.put(`/service-orders/${id}`, updates);
      const updated = await api.get(`/service-orders/${id}`);
      setOrder(updated);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <Layout title="O.S."><div className="empty-state"><p>Carregando...</p></div></Layout>;
  if (!order) return <Layout title="O.S."><div className="empty-state"><p>Ordem não encontrada</p></div></Layout>;

  return (
    <Layout title={order.order_number}>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1>{order.order_number}</h1>
            <span className="badge" style={{ background: `${statusColors[order.status]}20`, color: statusColors[order.status] }}>
              <span className="dot" style={{ background: statusColors[order.status] }}></span>
              {statusLabels[order.status]}
            </span>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/ordens')}>
          <span className="icon">arrow_back</span> Voltar
        </button>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {order.status === 'pendente' && (
          <button className="btn btn-primary btn-sm" onClick={() => updateStatus('em_execucao')}>
            <span className="icon">play_arrow</span> Iniciar Execução
          </button>
        )}
        {order.status === 'em_execucao' && (
          <>
            <button className="btn btn-success btn-sm" onClick={() => updateStatus('finalizada')}>
              <span className="icon">check_circle</span> Finalizar
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => updateStatus('pausada')}>
              <span className="icon">pause</span> Pausar
            </button>
          </>
        )}
        {order.status === 'pausada' && (
          <button className="btn btn-primary btn-sm" onClick={() => updateStatus('em_execucao')}>
            <span className="icon">play_arrow</span> Retomar
          </button>
        )}
      </div>

      <div className="detail-grid">
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><h3>Serviço</h3></div>
            <div className="card-body">
              {order.diagnosis && (
                <div className="detail-field">
                  <div className="label">Diagnóstico</div>
                  <div className="value">{order.diagnosis}</div>
                </div>
              )}
              {order.service_performed && (
                <div className="detail-field">
                  <div className="label">Serviço Realizado</div>
                  <div className="value">{order.service_performed}</div>
                </div>
              )}
              {order.materials_used && (
                <div className="detail-field">
                  <div className="label">Materiais Utilizados</div>
                  <div className="value">{order.materials_used}</div>
                </div>
              )}
              {order.observations && (
                <div className="detail-field">
                  <div className="label">Observações</div>
                  <div className="value">{order.observations}</div>
                </div>
              )}
              {!order.diagnosis && !order.service_performed && (
                <p style={{ color: '#94a3b8', fontSize: 14 }}>Nenhum registro de serviço ainda</p>
              )}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><h3>Custos</h3></div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div className="detail-field">
                  <div className="label">Mão de Obra</div>
                  <div className="value" style={{ fontWeight: 600 }}>{formatCurrency(order.cost_labor)}</div>
                </div>
                <div className="detail-field">
                  <div className="label">Materiais</div>
                  <div className="value" style={{ fontWeight: 600 }}>{formatCurrency(order.cost_materials)}</div>
                </div>
                <div className="detail-field">
                  <div className="label">Total</div>
                  <div className="value" style={{ fontWeight: 700, fontSize: 18, color: 'var(--primary)' }}>{formatCurrency(order.cost_total)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3>Tempos</h3></div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="detail-field">
                  <div className="label">Início</div>
                  <div className="value">{formatDateTime(order.start_time)}</div>
                </div>
                <div className="detail-field">
                  <div className="label">Fim</div>
                  <div className="value">{formatDateTime(order.end_time)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          {order.ticket_number && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header"><h3>Chamado Vinculado</h3></div>
              <div className="card-body">
                <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: 4 }}>{order.ticket_number}</div>
                <div style={{ fontSize: 14 }}>{order.ticket_title}</div>
              </div>
            </div>
          )}

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><h3>Cliente</h3></div>
            <div className="card-body">
              {order.client_name ? (
                <>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{order.client_name}</div>
                  {order.client_company && <div style={{ fontSize: 13, color: '#64748b' }}>{order.client_company}</div>}
                  {order.client_phone && (
                    <a href={`tel:${order.client_phone}`} style={{ fontSize: 13, color: 'var(--primary)', display: 'block', marginTop: 4 }}>{order.client_phone}</a>
                  )}
                </>
              ) : <p style={{ color: '#94a3b8', fontSize: 14 }}>Sem cliente</p>}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><h3>Técnico</h3></div>
            <div className="card-body">
              {order.technician_name ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 600 }}>
                    {order.technician_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{order.technician_name}</div>
                    {order.technician_phone && (
                      <a href={`tel:${order.technician_phone}`} style={{ fontSize: 13, color: 'var(--primary)' }}>{order.technician_phone}</a>
                    )}
                  </div>
                </div>
              ) : <p style={{ color: '#94a3b8', fontSize: 14 }}>Sem técnico</p>}
            </div>
          </div>

          {order.equipment_name && (
            <div className="card">
              <div className="card-header"><h3>Equipamento</h3></div>
              <div className="card-body">
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{order.equipment_name}</div>
                {order.equipment_model && <div style={{ fontSize: 13, color: '#64748b' }}>{order.equipment_model}</div>}
                {order.equipment_serial && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>S/N: {order.equipment_serial}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

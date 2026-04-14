import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../utils/api';
import { statusLabels, statusColors, priorityLabels, priorityColors, typeLabels, formatDateTime, timeAgo } from '../utils/helpers';

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [comment, setComment] = useState('');
  const [editStatus, setEditStatus] = useState(false);

  useEffect(() => {
    api.get(`/tickets/${id}`).then(setTicket).catch(() => navigate('/chamados')).finally(() => setLoading(false));
  }, [id, navigate]);

  const updateStatus = async (status) => {
    try {
      await api.put(`/tickets/${id}`, { ...ticket, status });
      setTicket(t => ({ ...t, status }));
      setEditStatus(false);
      // Reload to get updated history
      const updated = await api.get(`/tickets/${id}`);
      setTicket(updated);
    } catch (err) {
      alert(err.message);
    }
  };

  const addComment = async () => {
    if (!comment.trim()) return;
    try {
      await api.post(`/tickets/${id}/comments`, { comment });
      setComment('');
      const updated = await api.get(`/tickets/${id}`);
      setTicket(updated);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <Layout title="Chamado"><div className="empty-state"><p>Carregando...</p></div></Layout>;
  if (!ticket) return <Layout title="Chamado"><div className="empty-state"><p>Chamado não encontrado</p></div></Layout>;

  const statusOptions = ['aberto', 'aprovado', 'em_andamento', 'aguardando', 'concluido', 'cancelado'];

  return (
    <Layout title={ticket.ticket_number}>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1>{ticket.ticket_number}</h1>
            <span className="badge" style={{ background: `${statusColors[ticket.status]}20`, color: statusColors[ticket.status] }}>
              <span className="dot" style={{ background: statusColors[ticket.status] }}></span>
              {statusLabels[ticket.status]}
            </span>
            <span className="badge badge-priority" style={{ background: `${priorityColors[ticket.priority]}20`, color: priorityColors[ticket.priority] }}>
              {priorityLabels[ticket.priority]}
            </span>
          </div>
          <p style={{ marginTop: 4 }}>{ticket.title}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/chamados')}>
            <span className="icon">arrow_back</span>
            Voltar
          </button>
        </div>
      </div>

      {/* Status Actions (mobile-friendly) */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {ticket.status === 'aberto' && (
          <>
            <button className="btn btn-success btn-sm" onClick={() => updateStatus('aprovado')}>
              <span className="icon">check</span> Aprovar
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => updateStatus('cancelado')}>
              <span className="icon">close</span> Recusar
            </button>
          </>
        )}
        {ticket.status === 'aprovado' && (
          <button className="btn btn-primary btn-sm" onClick={() => updateStatus('em_andamento')}>
            <span className="icon">play_arrow</span> Iniciar Atendimento
          </button>
        )}
        {ticket.status === 'em_andamento' && (
          <>
            <button className="btn btn-success btn-sm" onClick={() => updateStatus('concluido')}>
              <span className="icon">check_circle</span> Concluir
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => updateStatus('aguardando')}>
              <span className="icon">pause</span> Aguardando
            </button>
          </>
        )}
        {ticket.status === 'aguardando' && (
          <button className="btn btn-primary btn-sm" onClick={() => updateStatus('em_andamento')}>
            <span className="icon">play_arrow</span> Retomar
          </button>
        )}
        <div style={{ position: 'relative' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setEditStatus(!editStatus)}>
            <span className="icon">edit</span> Alterar Status
          </button>
          {editStatus && (
            <div style={{ position: 'absolute', top: '100%', left: 0, background: 'white', borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', zIndex: 10, minWidth: 180, padding: 4, marginTop: 4 }}>
              {statusOptions.map(s => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', border: 'none', background: ticket.status === s ? '#e8f0fe' : 'transparent', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}
                >
                  <span className="dot" style={{ width: 8, height: 8, borderRadius: '50%', background: statusColors[s] }}></span>
                  {statusLabels[s]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>Informações</button>
        <button className={`tab ${activeTab === 'comments' ? 'active' : ''}`} onClick={() => setActiveTab('comments')}>
          Comentários ({ticket.comments?.length || 0})
        </button>
        <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Histórico</button>
        <button className={`tab ${activeTab === 'os' ? 'active' : ''}`} onClick={() => setActiveTab('os')}>
          Ordens ({ticket.serviceOrders?.length || 0})
        </button>
      </div>

      {/* Info Tab */}
      {activeTab === 'info' && (
        <div className="detail-grid">
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header"><h3>Detalhes do Chamado</h3></div>
              <div className="card-body">
                <div className="detail-field">
                  <div className="label">Descrição</div>
                  <div className="value">{ticket.description || 'Sem descrição'}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="detail-field">
                    <div className="label">Tipo</div>
                    <div className="value">{typeLabels[ticket.type]}</div>
                  </div>
                  <div className="detail-field">
                    <div className="label">Data Agendada</div>
                    <div className="value">{formatDateTime(ticket.scheduled_date)}</div>
                  </div>
                  <div className="detail-field">
                    <div className="label">Criado por</div>
                    <div className="value">{ticket.creator_name || '-'}</div>
                  </div>
                  <div className="detail-field">
                    <div className="label">Criado em</div>
                    <div className="value">{formatDateTime(ticket.created_at)}</div>
                  </div>
                </div>
                {ticket.notes && (
                  <div className="detail-field">
                    <div className="label">Observações</div>
                    <div className="value">{ticket.notes}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Contact */}
            {(ticket.contact_name || ticket.address) && (
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-header"><h3>Contato e Local</h3></div>
                <div className="card-body">
                  {ticket.contact_name && (
                    <div className="detail-field">
                      <div className="label">Contato</div>
                      <div className="value">{ticket.contact_name} {ticket.contact_phone && `- ${ticket.contact_phone}`}</div>
                    </div>
                  )}
                  {ticket.address && (
                    <div className="detail-field">
                      <div className="label">Endereço</div>
                      <div className="value">{ticket.address}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            {/* Client */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header"><h3>Cliente</h3></div>
              <div className="card-body">
                {ticket.client_name ? (
                  <>
                    <div className="detail-field">
                      <div className="label">Nome</div>
                      <div className="value" style={{ fontWeight: 600 }}>{ticket.client_name}</div>
                    </div>
                    {ticket.client_company && (
                      <div className="detail-field">
                        <div className="label">Empresa</div>
                        <div className="value">{ticket.client_company}</div>
                      </div>
                    )}
                    {ticket.client_phone && (
                      <div className="detail-field">
                        <div className="label">Telefone</div>
                        <div className="value">
                          <a href={`tel:${ticket.client_phone}`} style={{ color: 'var(--primary)' }}>{ticket.client_phone}</a>
                        </div>
                      </div>
                    )}
                    {ticket.client_email && (
                      <div className="detail-field">
                        <div className="label">Email</div>
                        <div className="value">{ticket.client_email}</div>
                      </div>
                    )}
                  </>
                ) : (
                  <p style={{ color: '#94a3b8', fontSize: 14 }}>Nenhum cliente vinculado</p>
                )}
              </div>
            </div>

            {/* Equipment */}
            {ticket.equipment_name && (
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-header"><h3>Equipamento</h3></div>
                <div className="card-body">
                  <div className="detail-field">
                    <div className="label">Nome</div>
                    <div className="value" style={{ fontWeight: 600 }}>{ticket.equipment_name}</div>
                  </div>
                  {ticket.equipment_model && (
                    <div className="detail-field">
                      <div className="label">Modelo</div>
                      <div className="value">{ticket.equipment_model}</div>
                    </div>
                  )}
                  {ticket.equipment_serial && (
                    <div className="detail-field">
                      <div className="label">Nº Série</div>
                      <div className="value">{ticket.equipment_serial}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Assigned */}
            <div className="card">
              <div className="card-header"><h3>Responsável</h3></div>
              <div className="card-body">
                {ticket.assigned_name ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, fontWeight: 600 }}>
                        {ticket.assigned_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{ticket.assigned_name}</div>
                        {ticket.assigned_phone && (
                          <a href={`tel:${ticket.assigned_phone}`} style={{ fontSize: 13, color: 'var(--primary)' }}>{ticket.assigned_phone}</a>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <p style={{ color: '#94a3b8', fontSize: 14 }}>Nenhum técnico atribuído</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments Tab */}
      {activeTab === 'comments' && (
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <textarea
                className="form-textarea"
                placeholder="Escreva um comentário..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                style={{ minHeight: 80 }}
              />
            </div>
            <button className="btn btn-primary btn-sm" onClick={addComment} disabled={!comment.trim()}>
              <span className="icon">send</span> Enviar Comentário
            </button>

            <div style={{ marginTop: 24 }}>
              {ticket.comments?.length === 0 && (
                <div className="empty-state" style={{ padding: 40 }}>
                  <span className="icon">chat_bubble_outline</span>
                  <h3>Nenhum comentário</h3>
                  <p>Seja o primeiro a comentar</p>
                </div>
              )}
              {ticket.comments?.map(c => (
                <div key={c.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e8f0fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a73e8', fontSize: 12, fontWeight: 600 }}>
                      {c.user_name?.split(' ').map(n => n[0]).join('').substring(0, 2) || '?'}
                    </div>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{c.user_name || 'Sistema'}</span>
                      <span style={{ color: '#94a3b8', fontSize: 12, marginLeft: 8 }}>{timeAgo(c.created_at)}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 14, marginLeft: 40, color: '#334155' }}>{c.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="card">
          <div className="card-body">
            {ticket.history?.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <span className="icon">history</span>
                <h3>Sem histórico</h3>
              </div>
            ) : (
              <div className="timeline">
                {ticket.history?.map(h => (
                  <div key={h.id} className="timeline-item">
                    <div className="time">{formatDateTime(h.created_at)} {h.user_name && `- ${h.user_name}`}</div>
                    <div className="content">
                      {h.action === 'criado' && 'Chamado criado'}
                      {h.action === 'status_alterado' && (
                        <>Status alterado de <strong>{statusLabels[h.old_value]}</strong> para <strong>{statusLabels[h.new_value]}</strong></>
                      )}
                      {h.action === 'atribuido' && <>Atribuído para <strong>{h.new_value}</strong></>}
                      {h.action === 'comentario' && 'Comentário adicionado'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Service Orders Tab */}
      {activeTab === 'os' && (
        <div className="card">
          <div className="card-header">
            <h3>Ordens de Serviço</h3>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/ordens/nova')}>
              <span className="icon">add</span> Nova O.S.
            </button>
          </div>
          <div className="card-body">
            {ticket.serviceOrders?.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <span className="icon">assignment</span>
                <h3>Nenhuma O.S.</h3>
                <p>Crie uma ordem de serviço para este chamado</p>
              </div>
            ) : (
              ticket.serviceOrders?.map(so => (
                <div key={so.id} onClick={() => navigate(`/ordens/${so.id}`)} style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 10, marginBottom: 10, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{so.order_number}</span>
                    <span className="badge" style={{ background: `${statusColors[so.status]}20`, color: statusColors[so.status] }}>
                      {statusLabels[so.status]}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>
                    Técnico: {so.technician_name || '-'} | {timeAgo(so.created_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}

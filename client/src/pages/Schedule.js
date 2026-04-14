import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../utils/api';
import { formatDate, formatDateTime } from '../utils/helpers';

const statusMap = {
  agendado: { label: 'Agendado', color: '#3b82f6' },
  confirmado: { label: 'Confirmado', color: '#8b5cf6' },
  realizado: { label: 'Realizado', color: '#10b981' },
  cancelado: { label: 'Cancelado', color: '#ef4444' },
};

export default function Schedule() {
  const [schedules, setSchedules] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', technician_id: '', client_id: '', start_date: '', end_date: '', recurrence: 'none' });

  const load = () => {
    setLoading(true);
    api.get('/schedules').then(setSchedules).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    api.get('/users/technicians').then(setTechnicians).catch(console.error);
    api.get('/clients').then(d => setClients(d.clients)).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/schedules', {
        ...form,
        technician_id: form.technician_id || null,
        client_id: form.client_id || null,
      });
      setShowModal(false);
      load();
    } catch (err) { alert(err.message); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/schedules/${id}`, { status });
      load();
    } catch (err) { alert(err.message); }
  };

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  // Group by date
  const grouped = {};
  schedules.forEach(s => {
    const date = formatDate(s.start_date);
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(s);
  });

  return (
    <Layout title="Agenda">
      <div className="page-header">
        <div>
          <h1>Agenda</h1>
          <p>{schedules.length} agendamentos</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm({ title: '', description: '', technician_id: '', client_id: '', start_date: '', end_date: '', recurrence: 'none' }); setShowModal(true); }}>
          <span className="icon">add</span> Novo Agendamento
        </button>
      </div>

      {loading ? (
        <div className="empty-state"><p>Carregando...</p></div>
      ) : schedules.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <span className="icon">calendar_today</span>
            <h3>Nenhum agendamento</h3>
            <p>Crie um novo agendamento para começar</p>
          </div>
        </div>
      ) : (
        Object.entries(grouped).map(([date, items]) => (
          <div key={date} style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginBottom: 10, padding: '0 4px' }}>{date}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map(s => (
                <div key={s.id} className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{s.title}</div>
                      {s.description && <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{s.description}</div>}
                    </div>
                    <span className="badge" style={{ background: `${statusMap[s.status]?.color}20`, color: statusMap[s.status]?.color }}>
                      {statusMap[s.status]?.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#64748b', flexWrap: 'wrap' }}>
                    {s.technician_name && <span><span className="icon" style={{ fontSize: 14, verticalAlign: 'middle' }}>person</span> {s.technician_name}</span>}
                    {s.client_name && <span><span className="icon" style={{ fontSize: 14, verticalAlign: 'middle' }}>business</span> {s.client_name}</span>}
                    <span><span className="icon" style={{ fontSize: 14, verticalAlign: 'middle' }}>schedule</span> {formatDateTime(s.start_date)}</span>
                  </div>
                  {s.status === 'agendado' && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button className="btn btn-sm btn-success" onClick={() => updateStatus(s.id, 'confirmado')}>Confirmar</button>
                      <button className="btn btn-sm btn-danger" onClick={() => updateStatus(s.id, 'cancelado')}>Cancelar</button>
                    </div>
                  )}
                  {s.status === 'confirmado' && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button className="btn btn-sm btn-success" onClick={() => updateStatus(s.id, 'realizado')}>Marcar como Realizado</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Novo Agendamento</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><span className="icon">close</span></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Título *</label>
                  <input className="form-input" value={form.title} onChange={set('title')} required placeholder="Ex: Manutenção preventiva" />
                </div>
                <div className="form-group">
                  <label className="form-label">Descrição</label>
                  <textarea className="form-textarea" value={form.description} onChange={set('description')} style={{ minHeight: 60 }} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Técnico</label>
                    <select className="form-select" value={form.technician_id} onChange={set('technician_id')}>
                      <option value="">Selecione</option>
                      {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cliente</label>
                    <select className="form-select" value={form.client_id} onChange={set('client_id')}>
                      <option value="">Selecione</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Data/Hora Início *</label>
                    <input type="datetime-local" className="form-input" value={form.start_date} onChange={set('start_date')} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Data/Hora Fim</label>
                    <input type="datetime-local" className="form-input" value={form.end_date} onChange={set('end_date')} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Recorrência</label>
                  <select className="form-select" value={form.recurrence} onChange={set('recurrence')}>
                    <option value="none">Sem recorrência</option>
                    <option value="daily">Diário</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary"><span className="icon">save</span> Agendar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

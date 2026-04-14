import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../utils/api';

export default function ServiceOrderForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ticketId = searchParams.get('ticket');

  const [form, setForm] = useState({
    ticket_id: ticketId || '', technician_id: '', client_id: '', equipment_id: '',
    diagnosis: '', service_performed: '', materials_used: '', observations: '',
    cost_labor: '', cost_materials: ''
  });
  const [clients, setClients] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/clients').then(d => setClients(d.clients)),
      api.get('/users/technicians').then(setTechnicians),
      api.get('/equipment').then(d => setEquipments(d.equipments)),
      api.get('/tickets?status=aberto&limit=100').then(d => setTickets(d.tickets)),
    ]).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const order = await api.post('/service-orders', {
        ...form,
        ticket_id: form.ticket_id || null,
        technician_id: form.technician_id || null,
        client_id: form.client_id || null,
        equipment_id: form.equipment_id || null,
      });
      navigate(`/ordens/${order.id}`);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <Layout title="Nova Ordem de Serviço">
      <div className="page-header">
        <div>
          <h1>Nova Ordem de Serviço</h1>
          <p>Registre o serviço realizado</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/ordens')}>
          <span className="icon">arrow_back</span> Voltar
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {error && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14, border: '1px solid #fecaca' }}>{error}</div>}

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><h3>Vínculo</h3></div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Chamado Relacionado</label>
                <select className="form-select" value={form.ticket_id} onChange={set('ticket_id')}>
                  <option value="">Nenhum</option>
                  {tickets.map(t => <option key={t.id} value={t.id}>{t.ticket_number} - {t.title}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Técnico</label>
                <select className="form-select" value={form.technician_id} onChange={set('technician_id')}>
                  <option value="">Selecione</option>
                  {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Cliente</label>
                <select className="form-select" value={form.client_id} onChange={set('client_id')}>
                  <option value="">Selecione</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Equipamento</label>
                <select className="form-select" value={form.equipment_id} onChange={set('equipment_id')}>
                  <option value="">Selecione</option>
                  {equipments.map(e => <option key={e.id} value={e.id}>{e.name} - {e.model || ''}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><h3>Serviço</h3></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Diagnóstico</label>
              <textarea className="form-textarea" placeholder="Diagnóstico do problema..." value={form.diagnosis} onChange={set('diagnosis')} />
            </div>
            <div className="form-group">
              <label className="form-label">Serviço Realizado</label>
              <textarea className="form-textarea" placeholder="Descrição do serviço..." value={form.service_performed} onChange={set('service_performed')} />
            </div>
            <div className="form-group">
              <label className="form-label">Materiais Utilizados</label>
              <textarea className="form-textarea" placeholder="Lista de materiais..." value={form.materials_used} onChange={set('materials_used')} style={{ minHeight: 60 }} />
            </div>
            <div className="form-group">
              <label className="form-label">Observações</label>
              <textarea className="form-textarea" placeholder="Observações..." value={form.observations} onChange={set('observations')} style={{ minHeight: 60 }} />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><h3>Custos</h3></div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Mão de Obra (R$)</label>
                <input type="number" step="0.01" className="form-input" placeholder="0,00" value={form.cost_labor} onChange={set('cost_labor')} />
              </div>
              <div className="form-group">
                <label className="form-label">Materiais (R$)</label>
                <input type="number" step="0.01" className="form-input" placeholder="0,00" value={form.cost_materials} onChange={set('cost_materials')} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/ordens')}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <span className="icon">save</span> {loading ? 'Salvando...' : 'Criar O.S.'}
          </button>
        </div>
      </form>
    </Layout>
  );
}

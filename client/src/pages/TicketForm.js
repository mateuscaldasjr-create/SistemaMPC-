import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../utils/api';

export default function TicketForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', type: 'corretiva', priority: 'media',
    client_id: '', equipment_id: '', assigned_to: '',
    scheduled_date: '', address: '', contact_name: '', contact_phone: '', notes: ''
  });
  const [clients, setClients] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/clients').then(d => setClients(d.clients)),
      api.get('/users/technicians').then(setTechnicians),
      api.get('/equipment').then(d => setEquipments(d.equipments)),
    ]).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) { setError('Título é obrigatório'); return; }
    setLoading(true);
    setError('');
    try {
      const ticket = await api.post('/tickets', {
        ...form,
        client_id: form.client_id || null,
        equipment_id: form.equipment_id || null,
        assigned_to: form.assigned_to || null,
      });
      navigate(`/chamados/${ticket.id}`);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <Layout title="Novo Chamado">
      <div className="page-header">
        <div>
          <h1>Novo Chamado</h1>
          <p>Preencha as informações do chamado</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/chamados')}>
          <span className="icon">arrow_back</span>
          Voltar
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {error && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14, border: '1px solid #fecaca' }}>{error}</div>}

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><h3>Informações do Chamado</h3></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Título *</label>
              <input className="form-input" placeholder="Descreva brevemente o problema" value={form.title} onChange={set('title')} required />
            </div>

            <div className="form-group">
              <label className="form-label">Descrição</label>
              <textarea className="form-textarea" placeholder="Detalhes sobre o chamado..." value={form.description} onChange={set('description')} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Tipo</label>
                <select className="form-select" value={form.type} onChange={set('type')}>
                  <option value="corretiva">Corretiva</option>
                  <option value="preventiva">Preventiva</option>
                  <option value="instalacao">Instalação</option>
                  <option value="vistoria">Vistoria</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Prioridade</label>
                <select className="form-select" value={form.priority} onChange={set('priority')}>
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><h3>Cliente e Equipamento</h3></div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Cliente</label>
                <select className="form-select" value={form.client_id} onChange={set('client_id')}>
                  <option value="">Selecione um cliente</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.company ? `- ${c.company}` : ''}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Equipamento</label>
                <select className="form-select" value={form.equipment_id} onChange={set('equipment_id')}>
                  <option value="">Selecione um equipamento</option>
                  {equipments.filter(e => !form.client_id || e.client_id === parseInt(form.client_id)).map(e => (
                    <option key={e.id} value={e.id}>{e.name} - {e.model || ''}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><h3>Atribuição e Agendamento</h3></div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Técnico Responsável</label>
                <select className="form-select" value={form.assigned_to} onChange={set('assigned_to')}>
                  <option value="">Selecione um técnico</option>
                  {technicians.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.active_tickets} chamados ativos)</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Data Agendada</label>
                <input type="datetime-local" className="form-input" value={form.scheduled_date} onChange={set('scheduled_date')} />
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><h3>Contato e Endereço</h3></div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nome do Contato</label>
                <input className="form-input" placeholder="Nome" value={form.contact_name} onChange={set('contact_name')} />
              </div>
              <div className="form-group">
                <label className="form-label">Telefone do Contato</label>
                <input className="form-input" placeholder="(00) 00000-0000" value={form.contact_phone} onChange={set('contact_phone')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Endereço</label>
              <input className="form-input" placeholder="Endereço completo" value={form.address} onChange={set('address')} />
            </div>
            <div className="form-group">
              <label className="form-label">Observações</label>
              <textarea className="form-textarea" placeholder="Observações adicionais..." value={form.notes} onChange={set('notes')} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/chamados')}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <span className="icon">save</span>
            {loading ? 'Salvando...' : 'Criar Chamado'}
          </button>
        </div>
      </form>
    </Layout>
  );
}

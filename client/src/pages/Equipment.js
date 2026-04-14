import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../utils/api';

const statusMap = { ativo: { label: 'Ativo', color: '#10b981' }, inativo: { label: 'Inativo', color: '#6b7280' }, manutencao: { label: 'Em Manutenção', color: '#f59e0b' } };

export default function Equipment() {
  const [equipments, setEquipments] = useState([]);
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', model: '', serial_number: '', brand: '', category: '', client_id: '', location: '', status: 'ativo', notes: '' });

  const load = () => {
    setLoading(true);
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    api.get(`/equipment${params}`).then(d => setEquipments(d.equipments)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); api.get('/clients').then(d => setClients(d.clients)); }, []);
  useEffect(() => { load(); }, [search]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', model: '', serial_number: '', brand: '', category: '', client_id: '', location: '', status: 'ativo', notes: '' });
    setShowModal(true);
  };

  const openEdit = (eq) => {
    setEditing(eq);
    setForm({ name: eq.name || '', model: eq.model || '', serial_number: eq.serial_number || '', brand: eq.brand || '', category: eq.category || '', client_id: eq.client_id || '', location: eq.location || '', status: eq.status || 'ativo', notes: eq.notes || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/equipment/${editing.id}`, { ...form, client_id: form.client_id || null });
      else await api.post('/equipment', { ...form, client_id: form.client_id || null });
      setShowModal(false);
      load();
    } catch (err) { alert(err.message); }
  };

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <Layout title="Equipamentos">
      <div className="page-header">
        <div>
          <h1>Equipamentos</h1>
          <p>{equipments.length} equipamentos cadastrados</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <span className="icon">add</span> Novo Equipamento
        </button>
      </div>

      <div className="card">
        <div className="filters-bar">
          <div className="search-input">
            <span className="icon">search</span>
            <input placeholder="Buscar equipamentos..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>Nome</th><th>Modelo</th><th>Marca</th><th>Nº Série</th><th>Cliente</th><th>Local</th><th>Status</th></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40 }}>Carregando...</td></tr> :
              equipments.length === 0 ? <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40 }}>Nenhum equipamento</td></tr> :
              equipments.map(eq => (
                <tr key={eq.id} onClick={() => openEdit(eq)}>
                  <td style={{ fontWeight: 600 }}>{eq.name}</td>
                  <td>{eq.model || '-'}</td>
                  <td>{eq.brand || '-'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{eq.serial_number || '-'}</td>
                  <td>{eq.client_name || '-'}</td>
                  <td>{eq.location || '-'}</td>
                  <td>
                    <span className="badge" style={{ background: `${statusMap[eq.status]?.color}20`, color: statusMap[eq.status]?.color }}>
                      {statusMap[eq.status]?.label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mobile-card-list" style={{ padding: 12 }}>
          {loading ? <div className="empty-state" style={{ padding: 40 }}><p>Carregando...</p></div> :
          equipments.length === 0 ? <div className="empty-state"><span className="icon">precision_manufacturing</span><h3>Nenhum equipamento</h3></div> :
          equipments.map(eq => (
            <div key={eq.id} className="mobile-ticket-card" onClick={() => openEdit(eq)}>
              <div className="card-top">
                <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#64748b' }}>{eq.serial_number || 'S/N'}</span>
                <span className="badge" style={{ background: `${statusMap[eq.status]?.color}20`, color: statusMap[eq.status]?.color }}>
                  {statusMap[eq.status]?.label}
                </span>
              </div>
              <div className="card-title">{eq.name}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>{eq.brand} {eq.model}</div>
              <div className="card-bottom">
                <div className="card-meta"><span className="icon">business</span> {eq.client_name || '-'}</div>
                <div className="card-meta"><span className="icon">location_on</span> {eq.location || '-'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Editar Equipamento' : 'Novo Equipamento'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><span className="icon">close</span></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome *</label>
                  <input className="form-input" value={form.name} onChange={set('name')} required placeholder="Ex: Ar Condicionado" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Modelo</label>
                    <input className="form-input" value={form.model} onChange={set('model')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Marca</label>
                    <input className="form-input" value={form.brand} onChange={set('brand')} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Nº Série</label>
                    <input className="form-input" value={form.serial_number} onChange={set('serial_number')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Categoria</label>
                    <input className="form-input" value={form.category} onChange={set('category')} placeholder="Ex: HVAC, Elevadores" />
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
                    <label className="form-label">Localização</label>
                    <input className="form-input" value={form.location} onChange={set('location')} placeholder="Ex: Sala 301" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={set('status')}>
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                    <option value="manutencao">Em Manutenção</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary"><span className="icon">save</span> {editing ? 'Salvar' : 'Cadastrar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

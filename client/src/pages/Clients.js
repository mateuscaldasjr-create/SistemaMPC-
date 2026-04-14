import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../utils/api';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', document: '', company: '', address: '', city: '', state: '', zip_code: '', notes: '' });
  const navigate = useNavigate();

  const loadClients = () => {
    setLoading(true);
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    api.get(`/clients${params}`).then(d => setClients(d.clients)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { loadClients(); }, [search]);

  const openNew = () => {
    setEditingClient(null);
    setForm({ name: '', email: '', phone: '', document: '', company: '', address: '', city: '', state: '', zip_code: '', notes: '' });
    setShowModal(true);
  };

  const openEdit = (client) => {
    setEditingClient(client);
    setForm({ name: client.name || '', email: client.email || '', phone: client.phone || '', document: client.document || '', company: client.company || '', address: client.address || '', city: client.city || '', state: client.state || '', zip_code: client.zip_code || '', notes: client.notes || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await api.put(`/clients/${editingClient.id}`, form);
      } else {
        await api.post('/clients', form);
      }
      setShowModal(false);
      loadClients();
    } catch (err) { alert(err.message); }
  };

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <Layout title="Clientes">
      <div className="page-header">
        <div>
          <h1>Clientes</h1>
          <p>{clients.length} clientes cadastrados</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <span className="icon">add</span> Novo Cliente
        </button>
      </div>

      <div className="card">
        <div className="filters-bar">
          <div className="search-input">
            <span className="icon">search</span>
            <input placeholder="Buscar clientes..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Desktop */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Empresa</th>
                <th>Email</th>
                <th>Telefone</th>
                <th>Cidade</th>
                <th>Chamados</th>
                <th>Equipamentos</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40 }}>Carregando...</td></tr>
              ) : clients.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40 }}>Nenhum cliente encontrado</td></tr>
              ) : clients.map(c => (
                <tr key={c.id} onClick={() => openEdit(c)}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td>{c.company || '-'}</td>
                  <td>{c.email || '-'}</td>
                  <td>{c.phone || '-'}</td>
                  <td>{c.city ? `${c.city}/${c.state}` : '-'}</td>
                  <td style={{ textAlign: 'center' }}><span className="badge" style={{ background: '#e8f0fe', color: '#1a73e8' }}>{c.ticket_count}</span></td>
                  <td style={{ textAlign: 'center' }}><span className="badge" style={{ background: '#f0fdf4', color: '#10b981' }}>{c.equipment_count}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="mobile-card-list" style={{ padding: 12 }}>
          {loading ? (
            <div className="empty-state" style={{ padding: 40 }}><p>Carregando...</p></div>
          ) : clients.length === 0 ? (
            <div className="empty-state"><span className="icon">people</span><h3>Nenhum cliente</h3></div>
          ) : clients.map(c => (
            <div key={c.id} className="mobile-ticket-card" onClick={() => openEdit(c)}>
              <div className="card-title" style={{ marginBottom: 2 }}>{c.name}</div>
              {c.company && <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>{c.company}</div>}
              <div className="card-bottom">
                <div className="card-meta">
                  {c.phone && <><span className="icon">phone</span> {c.phone}</>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span className="badge" style={{ background: '#e8f0fe', color: '#1a73e8', fontSize: 11 }}>{c.ticket_count} ch.</span>
                  <span className="badge" style={{ background: '#f0fdf4', color: '#10b981', fontSize: 11 }}>{c.equipment_count} eq.</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <span className="icon">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome *</label>
                  <input className="form-input" value={form.name} onChange={set('name')} required placeholder="Nome completo" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Empresa</label>
                    <input className="form-input" value={form.company} onChange={set('company')} placeholder="Nome da empresa" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CNPJ/CPF</label>
                    <input className="form-input" value={form.document} onChange={set('document')} placeholder="Documento" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-input" value={form.email} onChange={set('email')} placeholder="email@exemplo.com" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Telefone</label>
                    <input className="form-input" value={form.phone} onChange={set('phone')} placeholder="(00) 00000-0000" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Endereço</label>
                  <input className="form-input" value={form.address} onChange={set('address')} placeholder="Endereço completo" />
                </div>
                <div className="form-row-3">
                  <div className="form-group">
                    <label className="form-label">Cidade</label>
                    <input className="form-input" value={form.city} onChange={set('city')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Estado</label>
                    <input className="form-input" value={form.state} onChange={set('state')} maxLength="2" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CEP</label>
                    <input className="form-input" value={form.zip_code} onChange={set('zip_code')} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Observações</label>
                  <textarea className="form-textarea" value={form.notes} onChange={set('notes')} style={{ minHeight: 60 }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  <span className="icon">save</span> {editingClient ? 'Salvar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

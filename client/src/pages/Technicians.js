import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../utils/api';

const roleLabels = { admin: 'Administrador', gestor: 'Gestor', tecnico: 'Técnico', cliente: 'Cliente' };

export default function Technicians() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'tecnico', phone: '' });

  const load = () => {
    setLoading(true);
    api.get('/users').then(setUsers).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', email: '', password: '', role: 'tecnico', phone: '' });
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role, phone: user.phone || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...form };
      if (editing && !data.password) delete data.password;
      if (editing) await api.put(`/users/${editing.id}`, data);
      else await api.post('/users', data);
      setShowModal(false);
      load();
    } catch (err) { alert(err.message); }
  };

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <Layout title="Técnicos e Usuários">
      <div className="page-header">
        <div>
          <h1>Técnicos e Usuários</h1>
          <p>{users.length} usuários cadastrados</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <span className="icon">person_add</span> Novo Usuário
        </button>
      </div>

      <div className="card">
        {/* Desktop */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>Nome</th><th>Email</th><th>Perfil</th><th>Telefone</th><th>Chamados</th><th>Concluídos</th><th>Status</th></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40 }}>Carregando...</td></tr> :
              users.map(u => (
                <tr key={u.id} onClick={() => openEdit(u)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                        {u.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </div>
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td><span className="badge" style={{ background: '#e8f0fe', color: '#1a73e8' }}>{roleLabels[u.role]}</span></td>
                  <td>{u.phone || '-'}</td>
                  <td style={{ textAlign: 'center' }}>{u.ticket_count || 0}</td>
                  <td style={{ textAlign: 'center' }}>{u.completed_count || 0}</td>
                  <td>
                    <span className="badge" style={{ background: u.active ? '#f0fdf420' : '#fef2f2', color: u.active ? '#10b981' : '#ef4444' }}>
                      {u.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="mobile-card-list" style={{ padding: 12 }}>
          {loading ? <div className="empty-state" style={{ padding: 40 }}><p>Carregando...</p></div> :
          users.map(u => (
            <div key={u.id} className="mobile-ticket-card" onClick={() => openEdit(u)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, fontWeight: 600, flexShrink: 0 }}>
                  {u.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{u.name}</div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>{u.email}</div>
                </div>
              </div>
              <div className="card-bottom">
                <span className="badge" style={{ background: '#e8f0fe', color: '#1a73e8' }}>{roleLabels[u.role]}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{u.ticket_count || 0} chamados</span>
                  <span style={{ fontSize: 12, color: '#10b981' }}>{u.completed_count || 0} concl.</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Editar Usuário' : 'Novo Usuário'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><span className="icon">close</span></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome *</label>
                  <input className="form-input" value={form.name} onChange={set('name')} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input type="email" className="form-input" value={form.email} onChange={set('email')} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{editing ? 'Nova Senha (opcional)' : 'Senha *'}</label>
                    <input type="password" className="form-input" value={form.password} onChange={set('password')} required={!editing} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Perfil</label>
                    <select className="form-select" value={form.role} onChange={set('role')}>
                      <option value="tecnico">Técnico</option>
                      <option value="gestor">Gestor</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Telefone</label>
                    <input className="form-input" value={form.phone} onChange={set('phone')} />
                  </div>
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

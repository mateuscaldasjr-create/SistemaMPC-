import React, { useState } from 'react';

export default function PublicTicket() {
  const [form, setForm] = useState({ title: '', description: '', type: 'corretiva', priority: 'media', contact_name: '', contact_phone: '', address: '' });
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/tickets/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <div className="public-page">
      <div className="public-card">
        <div className="logo">
          <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #1a73e8, #00c853)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 28, fontWeight: 700, margin: '0 auto' }}>M</div>
          <h1>MPC Service</h1>
          <p>Abertura de Chamado</p>
        </div>

        {success ? (
          <div className="success-msg">
            <span className="icon">check_circle</span>
            <h2>Chamado Aberto!</h2>
            <p>Seu chamado foi registrado com sucesso.</p>
            <div className="ticket-num">{success.ticket_number}</div>
            <p style={{ color: '#64748b', fontSize: 14 }}>Guarde este número para acompanhamento.</p>
            <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => { setSuccess(null); setForm({ title: '', description: '', type: 'corretiva', priority: 'media', contact_name: '', contact_phone: '', address: '' }); }}>
              Abrir Novo Chamado
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14, border: '1px solid #fecaca' }}>{error}</div>}

            <div className="form-group">
              <label className="form-label">Seu Nome *</label>
              <input className="form-input" placeholder="Nome completo" value={form.contact_name} onChange={set('contact_name')} required />
            </div>

            <div className="form-group">
              <label className="form-label">Telefone</label>
              <input className="form-input" placeholder="(00) 00000-0000" value={form.contact_phone} onChange={set('contact_phone')} type="tel" />
            </div>

            <div className="form-group">
              <label className="form-label">Título do Chamado *</label>
              <input className="form-input" placeholder="Descreva brevemente o problema" value={form.title} onChange={set('title')} required />
            </div>

            <div className="form-group">
              <label className="form-label">Descrição Detalhada</label>
              <textarea className="form-textarea" placeholder="Descreva o problema com detalhes, incluindo quando começou e o que já foi tentado..." value={form.description} onChange={set('description')} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Tipo</label>
                <select className="form-select" value={form.type} onChange={set('type')}>
                  <option value="corretiva">Manutenção Corretiva</option>
                  <option value="preventiva">Manutenção Preventiva</option>
                  <option value="instalacao">Instalação</option>
                  <option value="vistoria">Vistoria</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Urgência</label>
                <select className="form-select" value={form.priority} onChange={set('priority')}>
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Endereço do Local</label>
              <input className="form-input" placeholder="Endereço completo" value={form.address} onChange={set('address')} />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: 14, fontSize: 16 }} disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Chamado'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: '#94a3b8' }}>
          Powered by MPC AI Solutions
        </p>
      </div>
    </div>
  );
}
